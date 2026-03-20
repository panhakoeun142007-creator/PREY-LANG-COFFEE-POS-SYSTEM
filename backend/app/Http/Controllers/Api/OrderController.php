<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderAction;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Staff;
use App\Models\User;
use App\Support\AppSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Cache TTL for live orders (30 seconds).
     */
    private const CACHE_TTL_LIVE = 5;

    private const LIVE_CACHE_KEY = 'orders_live_active';

    /**
     * Cache TTL for order history (2 minutes).
     */
    private const CACHE_TTL_HISTORY = 120;

    /**
     * Display a listing of orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->select($this->orderColumns())
            ->with($this->orderRelations())
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->integer('table_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateOrderPayload($request, false);

        return $this->persistOrder($validated);
    }

    /**
     * Store a customer order with a resilient table fallback.
     */
    public function customerStore(Request $request): JsonResponse
    {
        $validated = $this->validateOrderPayload($request, true);

        return $this->persistOrder($validated);
    }

    /**
     * Persist a validated order payload.
     */
    private function persistOrder(array $validated): JsonResponse
    {
        $order = DB::transaction(function () use ($validated) {
            $nextQueue = isset($validated['queue_number'])
                ? (int) $validated['queue_number']
                : ((int) (Order::query()->lockForUpdate()->max('queue_number') ?? 0) + 1);

            $order = Order::create([
                'table_id' => $validated['table_id'],
                'status' => $validated['status'] ?? 'pending',
                'payment_type' => $validated['payment_type'],
                'queue_number' => $nextQueue,
                'total_price' => 0,
            ]);

            $productIds = array_values(array_unique(array_map('intval', array_column($validated['items'], 'product_id'))));
            $products = Product::query()
                ->select(['id', 'price_small', 'price_medium', 'price_large'])
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            $total = 0;
            $now = now();
            $orderItems = [];
            foreach ($validated['items'] as $item) {
                if (isset($item['price'])) {
                    $price = (float) $item['price'];
                } else {
                    $product = $products->get($item['product_id']);
                    $price = match ($item['size']) {
                        'small' => (float) $product->price_small,
                        'medium' => (float) $product->price_medium,
                        'large' => (float) $product->price_large,
                    };
                }
                
                $total += ((float) $price * (int) $item['qty']);

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

            OrderItem::query()->insert($orderItems);

            $settings = AppSettings::getMerged();
            $taxRate = (float) (($settings['payment']['tax_rate'] ?? 0));
            $taxAmount = round($total * ($taxRate / 100), 2);
            $computedTotal = round($total + $taxAmount, 2);

            $order->forceFill([
                'total_price' => $validated['total_price'] ?? $computedTotal,
            ])->save();

            $this->recordOrderAction(
                $order,
                'created',
                null,
                $order->status,
                sprintf('Order #%d was created.', $order->queue_number ?? $order->id)
            );

            return Order::query()
                ->select($this->orderColumns())
                ->with($this->orderRelations())
                ->findOrFail($order->id);
        });

        $this->clearOrderCaches();

        return response()->json($order, 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load($this->orderRelations()));
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $enabledPaymentTypes = array_keys(AppSettings::enabledPaymentTypes());
        if (count($enabledPaymentTypes) === 0) {
            $enabledPaymentTypes = ['cash'];
        }

        $validated = $request->validate([
            'table_id' => ['sometimes', 'required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['sometimes', 'required', Rule::in($enabledPaymentTypes)],
            'queue_number' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'total_price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $order->update($validated);

        $this->clearOrderCaches();

        return response()->json($order->fresh()->load($this->orderRelations()));
    }

    /**
     * Remove the specified order.
     */
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        $this->clearOrderCaches();

        return response()->json(['message' => 'Order deleted']);
    }

    /**
     * Display live (active) orders.
     */
    public function live(): JsonResponse
    {
        $orders = Cache::remember(self::LIVE_CACHE_KEY, self::CACHE_TTL_LIVE, function () {
            return Order::query()
                ->select($this->orderColumns())
                ->with($this->orderRelations())
                ->whereIn('status', ['pending', 'preparing', 'ready'])
                ->orderBy('created_at', 'asc')
                ->get();
        });

        return response()->json($orders);
    }

    /**
     * Display order history (completed and cancelled orders).
     */
    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate($this->historyFilterRules());

        $query = Order::query()
            ->select($this->orderColumns())
            ->with($this->orderRelations())
            ->whereIn('status', ['completed', 'cancelled']);
        $this->applyHistoryFilters($query, $validated);

        // Sorting
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';
        $allowedSorts = ['created_at', 'updated_at', 'total_price', 'queue_number'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('created_at');
        }

        // Optimized summary calculation - single query with conditional counts
        $summaryBase = Order::query()
            ->whereIn('status', ['completed', 'cancelled']);
        $this->applyHistoryFilters($summaryBase, $validated);

        // Single query to get all summary stats
        $summaryStats = (clone $summaryBase)
            ->selectRaw('
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_count,
                SUM(CASE WHEN status = "completed" THEN total_price ELSE 0 END) as total_revenue
            ')
            ->first();

        $completedCount = (int) ($summaryStats->completed_count ?? 0);
        $cancelledCount = (int) ($summaryStats->cancelled_count ?? 0);
        $totalRevenue = round((float) ($summaryStats->total_revenue ?? 0), 2);

        $paginator = $query->paginate(20);
        $payload = $paginator->toArray();
        $payload['summary'] = [
            'completed_count' => $completedCount,
            'cancelled_count' => $cancelledCount,
            'total_revenue' => $totalRevenue,
        ];

        return response()->json($payload);
    }

    /**
     * Update order status.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
        ]);

        $fromStatus = (string) $order->status;
        $toStatus = (string) $validated['status'];

        $order->update(['status' => $toStatus]);

        $this->recordOrderAction(
            $order->fresh(),
            'status_changed',
            $fromStatus,
            $toStatus,
            $this->buildStatusChangeDescription($fromStatus, $toStatus)
        );

        $this->clearOrderCaches();

        return response()->json($order->fresh()->load($this->orderRelations()));
    }

    /**
     * Customer pickup confirmation (public).
     */
    public function pickup(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Order has been cancelled.'], 409);
        }

        if ($order->status === 'completed') {
            return response()->json($order->fresh()->load($this->orderRelations()));
        }

        if ($order->status !== 'ready') {
            return response()->json(['message' => 'Order is not ready for pickup yet.'], 409);
        }

        $fromStatus = (string) $order->status;

        $order->update(['status' => 'completed']);

        $this->recordOrderAction(
            $order->fresh(),
            'picked_up',
            $fromStatus,
            'completed',
            sprintf('Customer pickup completed for order #%d.', $order->queue_number ?? $order->id)
        );

        $this->clearOrderCaches();

        return response()->json($order->fresh()->load($this->orderRelations()));
    }

    /**
     * Customer order status (public).
     */
    public function customerStatus(Order $order): JsonResponse
    {
        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'queue_number' => $order->queue_number,
            'table' => $order->table?->name,
            'updated_at' => $order->updated_at,
        ]);
    }

    private function orderColumns(): array
    {
        return [
            'id',
            'table_id',
            'status',
            'total_price',
            'payment_type',
            'queue_number',
            'created_at',
            'updated_at',
        ];
    }

    private function orderRelations(): array
    {
        return [
            'table:id,name',
            'items' => fn ($query) => $query->select(['id', 'order_id', 'product_id', 'size', 'qty', 'price']),
            'items.product' => fn ($query) => $query->select($this->productRelationColumns()),
            'actions' => fn ($query) => $query
                ->select(['id', 'order_id', 'actor_type', 'actor_id', 'actor_name', 'action_type', 'from_status', 'to_status', 'description', 'created_at'])
                ->latest()
                ->limit(20),
        ];
    }

    private function applyHistoryFilters($query, array $filters): void
    {
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['payment_type'])) {
            $query->where('payment_type', $filters['payment_type']);
        }

        if (empty($filters['search'])) {
            return;
        }

        $search = trim((string) $filters['search']);
        $query->where(function ($inner) use ($search) {
            if (ctype_digit($search)) {
                $inner->where('id', (int) $search)
                    ->orWhere('queue_number', (int) $search);
            } else {
                $inner->where('queue_number', 'like', "%{$search}%");
            }

            $inner->orWhereHas('table', function ($tableQuery) use ($search) {
                $tableQuery->where('name', 'like', "%{$search}%");
            });
        });
    }

    private function historyFilterRules(): array
    {
        $enabledPaymentTypes = array_keys(AppSettings::enabledPaymentTypes());
        if (count($enabledPaymentTypes) === 0) {
            $enabledPaymentTypes = ['cash'];
        }

        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['completed', 'cancelled'])],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date', 'after_or_equal:date_from'],
            'payment_type' => ['sometimes', Rule::in($enabledPaymentTypes)],
            'search' => ['sometimes', 'string', 'max:100'],
            'sort_by' => ['sometimes', Rule::in(['created_at', 'updated_at', 'total_price', 'queue_number'])],
            'sort_order' => ['sometimes', Rule::in(['asc', 'desc'])],
        ];
    }

    private function clearOrderCaches(): void
    {
        Cache::forget(self::LIVE_CACHE_KEY);
        DashboardController::clearCache();
    }

    private function validateOrderPayload(Request $request, bool $allowCustomerTableFallback): array
    {
        $enabledPaymentTypes = array_keys(AppSettings::enabledPaymentTypes());
        if (count($enabledPaymentTypes) === 0) {
            $enabledPaymentTypes = ['cash'];
        }

        $validated = $request->validate([
            'table_id' => $allowCustomerTableFallback
                ? ['nullable', 'integer', 'min:1']
                : ['required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['required', Rule::in($enabledPaymentTypes)],
            'queue_number' => ['nullable', 'integer', 'min:1'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (!$allowCustomerTableFallback) {
            return $validated;
        }

        $tableId = isset($validated['table_id']) ? (int) $validated['table_id'] : null;
        if ($tableId && DiningTable::query()->whereKey($tableId)->exists()) {
            return $validated;
        }

        $fallbackTableId = DiningTable::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->value('id') ?? DiningTable::query()->orderBy('id')->value('id');

        if (!$fallbackTableId) {
            throw ValidationException::withMessages([
                'table_id' => 'No dining table is available for customer ordering.',
            ]);
        }

        $validated['table_id'] = (int) $fallbackTableId;

        return $validated;
    }

    private function productRelationColumns(): array
    {
        return $this->filterExistingProductColumns([
            'id',
            'category_id',
            'name',
            'description',
            'image',
            'price_small',
            'price_medium',
            'price_large',
            'is_available',
        ]);
    }

    private function filterExistingProductColumns(array $columns): array
    {
        static $availableColumns;

        if ($availableColumns === null) {
            $availableColumns = array_flip(Schema::getColumnListing('products'));
        }

        return array_values(array_filter($columns, fn (string $column) => isset($availableColumns[$column])));
    }

    private function recordOrderAction(
        Order $order,
        string $actionType,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $description = null
    ): void {
        $actor = $this->resolveActor();

        OrderAction::query()->create([
            'order_id' => $order->id,
            'actor_type' => $actor['type'],
            'actor_id' => $actor['id'],
            'actor_name' => $actor['name'],
            'action_type' => $actionType,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'description' => $description,
        ]);
    }

    private function resolveActor(): array
    {
        $actor = Auth::user();

        if ($actor instanceof User) {
            return [
                'type' => 'admin',
                'id' => $actor->id,
                'name' => $actor->name,
            ];
        }

        if ($actor instanceof Staff) {
            return [
                'type' => 'staff',
                'id' => $actor->id,
                'name' => $actor->name,
            ];
        }

        return [
            'type' => 'system',
            'id' => null,
            'name' => 'System',
        ];
    }

    private function buildStatusChangeDescription(string $fromStatus, string $toStatus): string
    {
        if ($fromStatus === $toStatus) {
            return sprintf('Order status remained %s.', $toStatus);
        }

        return sprintf('Order status changed from %s to %s.', $fromStatus, $toStatus);
    }
}
