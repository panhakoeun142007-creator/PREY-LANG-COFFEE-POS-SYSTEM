<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.size' => 'required|string|in:small,medium,large',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'total_price' => 'required|numeric',
            'payment_type' => 'nullable|string|in:cash,khqr',
            'table_id' => 'nullable|integer',
        ]);

        try {
            DB::beginTransaction();

            // Get the next queue number
            $lastOrder = Order::orderBy('queue_number', 'desc')->first();
            $queueNumber = $lastOrder ? $lastOrder->queue_number + 1 : 1;

            // Create order
            $order = Order::create([
                'table_id' => $validated['table_id'] ?? null,
                'queue_number' => $queueNumber,
                'status' => 'pending',
                'total_price' => $validated['total_price'],
                'payment_type' => $validated['payment_type'] ?? 'cash',
            ]);

            // Create order items
            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'size' => $item['size'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'queue_number' => $order->queue_number,
                'message' => 'Order created successfully',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function index(): JsonResponse
    {
        $orders = Order::with(['items.product'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $orders->map(fn ($order) => [
                'id' => $order->id,
                'queue_number' => $order->queue_number,
                'status' => $order->status,
                'total_price' => (float) $order->total_price,
                'payment_type' => $order->payment_type,
                'items' => $order->items->map(fn ($item) => [
                    'product_name' => $item->product?->name,
                    'size' => $item->size,
                    'qty' => $item->qty,
                    'price' => (float) $item->price,
                ]),
                'created_at' => $order->created_at,
            ]),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,preparing,ready,completed,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated',
        ]);
    }
}
