<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderItemController extends Controller
{
    /**
     * Display a listing of order items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrderItem::query()->with(['order', 'product'])->latest();

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->integer('order_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created order item.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'product_id' => ['required', 'exists:products,id'],
            'size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'qty' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $item = OrderItem::create($validated)->load(['order', 'product']);

        return response()->json($item, 201);
    }

    /**
     * Display the specified order item.
     */
    public function show(OrderItem $orderItem): JsonResponse
    {
        return response()->json($orderItem->load(['order', 'product']));
    }

    /**
     * Update the specified order item.
     */
    public function update(Request $request, OrderItem $orderItem): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['sometimes', 'required', 'exists:orders,id'],
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'size' => ['sometimes', 'required', Rule::in(['small', 'medium', 'large'])],
            'qty' => ['sometimes', 'required', 'integer', 'min:1'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $orderItem->update($validated);

        return response()->json($orderItem->fresh()->load(['order', 'product']));
    }

    /**
     * Remove the specified order item.
     */
    public function destroy(OrderItem $orderItem): JsonResponse
    {
        $orderItem->delete();

        return response()->json(['message' => 'Order item deleted']);
    }
}
