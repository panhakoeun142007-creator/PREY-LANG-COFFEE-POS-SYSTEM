<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Display a listing of orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->with(['table', 'items.product'])->latest();

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
        $validated = $request->validate([
            'table_id' => ['required', 'exists:tables,id'],
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

        $order = DB::transaction(function () use ($validated) {
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
                $price = $item['price'] ?? $this->getProductSizePrice($item['product_id'], $item['size']);
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

        return response()->json($order, 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['table', 'items.product']));
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'table_id' => ['sometimes', 'required', 'exists:tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['sometimes', 'required', Rule::in(['cash', 'khqr'])],
            'queue_number' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'total_price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $order->update($validated);

        return response()->json($order->fresh()->load(['table', 'items.product']));
    }

    /**
     * Remove the specified order.
     */
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json(['message' => 'Order deleted']);
    }

    /**
     * Display live (active) orders.
     */
    public function live(): JsonResponse
    {
        $orders = Order::query()
            ->with(['table', 'items.product'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($orders);
    }

    /**
     * Update order status.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
        ]);

        $order->update(['status' => $validated['status']]);

        return response()->json($order->fresh()->load(['table', 'items.product']));
    }

    /**
     * Get product price by selected size.
     */
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
