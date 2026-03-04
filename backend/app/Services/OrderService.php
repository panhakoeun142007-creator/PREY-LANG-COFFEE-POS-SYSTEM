<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderService
{
    public function list(Request $request): LengthAwarePaginator
    {
        $query = Order::query()->with(['table', 'items.product'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->integer('table_id'));
        }

        return $query->paginate(20);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate([
            'table_id' => ['required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['required', Rule::in(['cash', 'khqr'])],
            'queue_number' => ['nullable', 'integer', 'min:1'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
        ]);
    }

    public function create(array $validated): Order
    {
        return DB::transaction(function () use ($validated) {
            $nextQueue = Order::query()->max('queue_number') ?? 0;
            $order = Order::create([
                'table_id' => $validated['table_id'],
                'status' => $validated['status'] ?? 'pending',
                'payment_type' => $validated['payment_type'],
                'queue_number' => $validated['queue_number'] ?? ($nextQueue + 1),
                'total_price' => 0,
            ]);

            $total = 0;
            foreach ($validated['items'] as $item) {
                $price = $item['price'] ?? $this->getProductSizePrice((int) $item['product_id'], (string) $item['size']);
                $total += ((float) $price * (int) $item['qty']);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'size' => $item['size'],
                    'qty' => $item['qty'],
                    'price' => $price,
                ]);
            }

            $order->update([
                'total_price' => $validated['total_price'] ?? $total,
            ]);

            return $order->fresh()->load(['table', 'items.product']);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request): array
    {
        return $request->validate([
            'table_id' => ['sometimes', 'required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['sometimes', 'required', Rule::in(['cash', 'khqr'])],
            'queue_number' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'total_price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);
    }

    public function update(Order $order, array $validated): Order
    {
        $order->update($validated);

        return $order->fresh()->load(['table', 'items.product']);
    }

    public function delete(Order $order): void
    {
        $order->delete();
    }

    /**
     * @return Collection<int, Order>
     */
    public function live(): Collection
    {
        return Order::query()
            ->with(['table', 'items.product'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function history(Request $request): array
    {
        $query = Order::query()
            ->with(['table', 'items.product'])
            ->whereIn('status', ['completed', 'cancelled']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to'));
        }

        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->string('payment_type'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->string('search'));
            $query->where(function ($q) use ($search) {
                if (ctype_digit($search)) {
                    $q->orWhere('id', (int) $search)
                        ->orWhere('queue_number', (int) $search);
                } else {
                    $q->orWhere('queue_number', 'like', "%{$search}%");
                }

                $q->orWhereHas('table', function ($tableQuery) use ($search) {
                    $tableQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        $sortBy = $request->string('sort_by', 'created_at');
        $sortOrder = $request->string('sort_order', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'total_price', 'queue_number'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('created_at');
        }

        $summaryBase = (clone $query)->reorder();
        $completedCount = (clone $summaryBase)->where('status', 'completed')->count();
        $cancelledCount = (clone $summaryBase)->where('status', 'cancelled')->count();
        $totalRevenue = (float) ((clone $summaryBase)->where('status', 'completed')->sum('total_price'));

        $paginator = $query->paginate(20);
        $payload = $paginator->toArray();
        $payload['summary'] = [
            'completed_count' => $completedCount,
            'cancelled_count' => $cancelledCount,
            'total_revenue' => round($totalRevenue, 2),
        ];

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    public function validateStatusUpdate(Request $request): array
    {
        return $request->validate([
            'status' => ['required', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
        ]);
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $order->update(['status' => $status]);

        return $order->fresh()->load(['table', 'items.product']);
    }

    private function getProductSizePrice(int $productId, string $size): float
    {
        $product = Product::query()->findOrFail($productId);

        return match ($size) {
            'small' => (float) $product->price_small,
            'medium' => (float) $product->price_medium,
            'large' => (float) $product->price_large,
        };
    }
}
