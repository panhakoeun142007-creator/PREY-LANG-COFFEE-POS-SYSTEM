<?php

namespace App\Services;

use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderAction;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Staff;
use App\Models\User;
use App\Support\AppSettings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Business logic for Order operations.
 */
class OrderService
{
    private const CACHE_TTL_LIVE = 5;
    private const CACHE_KEY_LIVE = 'orders_live_active';

    /**
     * Create a new order with items.
     */
    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            // Generate queue number
            $queueNumber = $data['queue_number'] ?? ((int) (Order::query()->lockForUpdate()->max('queue_number') ?? 0) + 1);

            // Create order
            $order = Order::create([
                'table_id' => $data['table_id'],
                'status' => $data['status'] ?? 'pending',
                'payment_type' => $data['payment_type'],
                'queue_number' => $queueNumber,
                'total_price' => 0,
            ]);

            // Get products and calculate prices
            $productIds = array_unique(array_map('intval', array_column($data['items'], 'product_id')));
            $products = Product::query()
                ->select(['id', 'price_small', 'price_medium', 'price_large'])
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            // Build order items
            $orderItems = [];
            $total = 0;
            $now = now();

            foreach ($data['items'] as $item) {
                $price = $this->calculateItemPrice($item, $products->get($item['product_id']));
                $total += $price * (int) $item['qty'];

                $orderItems[] = [
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'size' => $item['size'],
                    'qty' => $item['qty'],
                    'price' => $price,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Insert items
            OrderItem::query()->insert($orderItems);

            // Calculate total with tax
            $totalPrice = $this->calculateTotalPrice($total);

            // Update order total
            $order->forceFill(['total_price' => $data['total_price'] ?? $totalPrice])->save();

            // Record action
            $this->recordAction($order, 'created', null, $order->status, "Order #{$order->queue_number} was created.");

            return $order;
        });
    }

    /**
     * Calculate item price based on size.
     */
    private function calculateItemPrice(array $item, ?Product $product): float
    {
        if (isset($item['price'])) {
            return (float) $item['price'];
        }

        if (!$product) {
            return 0;
        }

        return match ($item['size']) {
            'small' => (float) $product->price_small,
            'medium' => (float) $product->price_medium,
            'large' => (float) $product->price_large,
            default => 0,
        };
    }

    /**
     * Calculate total price with tax.
     */
    private function calculateTotalPrice(float $subtotal): float
    {
        $settings = AppSettings::getMerged();
        $taxRate = (float) ($settings['payment']['tax_rate'] ?? 0);
        $taxAmount = round($subtotal * ($taxRate / 100), 2);
        
        return round($subtotal + $taxAmount, 2);
    }

    /**
     * Record order action.
     */
    public function recordAction(Order $order, string $type, ?string $fromStatus, ?string $toStatus, string $description): OrderAction
    {
        $actor = $this->resolveActor();
        
        return OrderAction::create([
            'order_id' => $order->id,
            'actor_type' => $actor['type'],
            'actor_id' => $actor['id'],
            'actor_name' => $actor['name'],
            'action_type' => $type,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'description' => $description,
        ]);
    }

    /**
     * Resolve current actor (staff or system).
     */
    private function resolveActor(): array
    {
        $token = request()->bearerToken();
        $cacheKey = "api_auth_token:{$token}";
        $cached = Cache::get($cacheKey);

        if (!$cached) {
            return ['type' => 'system', 'id' => null, 'name' => 'System'];
        }

        // Backward compatible: some tests/legacy code may cache a numeric admin user id directly.
        if (is_int($cached) || (is_string($cached) && ctype_digit($cached))) {
            $userId = (int) $cached;
            $name = User::query()->whereKey($userId)->value('name') ?? 'Admin';
            return ['type' => 'admin', 'id' => $userId, 'name' => $name];
        }

        if (!is_array($cached)) {
            return ['type' => 'system', 'id' => null, 'name' => 'System'];
        }

        $subjectType = (string) ($cached['subject_type'] ?? 'unknown');
        $subjectId = $cached['subject_id'] ?? null;

        $name = $cached['subject_name'] ?? null;
        if (!is_string($name) || trim($name) === '') {
            $resolved = null;
            if ($subjectType === 'staff' && $subjectId) {
                $resolved = Staff::query()->whereKey($subjectId)->value('name');
            } elseif ($subjectType === 'admin' && $subjectId) {
                $resolved = User::query()->whereKey($subjectId)->value('name');
            }
            $name = $resolved ?: ucfirst($subjectType);
        }

        return [
            'type' => $subjectType,
            'id' => $subjectId,
            'name' => $name,
        ];
    }

    /**
     * Update order status.
     */
    public function updateStatus(Order $order, string $newStatus): Order
    {
        $fromStatus = $order->status;
        
        $order->update(['status' => $newStatus]);

        $description = $this->buildStatusChangeDescription($fromStatus, $newStatus);
        $this->recordAction($order, 'status_changed', $fromStatus, $newStatus, $description);

        return $order->fresh();
    }

    /**
     * Build status change description.
     */
    public function buildStatusChangeDescription(string $from, string $to): string
    {
        return match ([$from, $to]) {
            ['pending', 'preparing'] => 'Order has been started.',
            ['preparing', 'ready'] => 'Order is ready for pickup.',
            ['ready', 'completed'] => 'Order has been completed.',
            ['pending', 'cancelled'] => 'Order has been cancelled.',
            ['preparing', 'cancelled'] => 'Order has been cancelled during preparation.',
            default => "Status changed from {$from} to {$to}.",
        };
    }

    /**
     * Clear order caches.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY_LIVE);
        Cache::forget('dashboard_notifications');
        
        // Clear dashboard hourly caches
        for ($hour = 0; $hour <= now()->hour; $hour++) {
            Cache::forget('dashboard_' . now()->format('Y-m-d-') . sprintf('%02d', $hour));
        }
    }

    /**
     * Get fallback table ID for customer orders.
     */
    public function getFallbackTableId(): ?int
    {
        return DiningTable::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->value('id') ?? DiningTable::query()->orderBy('id')->value('id');
    }

    /**
     * Get order columns for queries.
     */
    public function getOrderColumns(): array
    {
        return ['id', 'table_id', 'status', 'total_price', 'payment_type', 'queue_number', 'created_at', 'updated_at'];
    }

    /**
     * Get order relations.
     */
    public function getOrderRelations(): array
    {
        return [
            'table:id,name',
            'items' => fn ($query) => $query->select(['id', 'order_id', 'product_id', 'size', 'qty', 'price']),
            'items.product:id,category_id,name,image,price_small,price_medium,price_large,is_available',
            'actions' => fn ($query) => $query
                ->select(['id', 'order_id', 'actor_type', 'actor_id', 'actor_name', 'action_type', 'from_status', 'to_status', 'description', 'created_at'])
                ->latest()
                ->limit(20),
        ];
    }
}
