<?php

namespace App\Services;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rule;

class OrderItemService
{
    public function list(Request $request): LengthAwarePaginator
    {
        $query = OrderItem::query()->with(['order', 'product'])->latest();

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->integer('order_id'));
        }

        return $query->paginate(20);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'product_id' => ['required', 'exists:products,id'],
            'size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'qty' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);
    }

    public function create(array $validated): OrderItem
    {
        return OrderItem::create($validated)->load(['order', 'product']);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request): array
    {
        return $request->validate([
            'order_id' => ['sometimes', 'required', 'exists:orders,id'],
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'size' => ['sometimes', 'required', Rule::in(['small', 'medium', 'large'])],
            'qty' => ['sometimes', 'required', 'integer', 'min:1'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);
    }

    public function update(OrderItem $orderItem, array $validated): OrderItem
    {
        $orderItem->update($validated);

        return $orderItem->fresh()->load(['order', 'product']);
    }

    public function delete(OrderItem $orderItem): void
    {
        $orderItem->delete();
    }
}
