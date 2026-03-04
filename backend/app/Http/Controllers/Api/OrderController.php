<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService)
    {
    }

    /**
     * Display a listing of orders.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->orderService->list($request);
        $paginator->setCollection(OrderResource::collection($paginator->getCollection())->collection);

        return response()->json($paginator);
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->orderService->validateStore($request);
        $order = $this->orderService->create($validated);

        return response()->json(new OrderResource($order), 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json(new OrderResource($order->load(['table', 'items.product'])));
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $this->orderService->validateUpdate($request);
        $updated = $this->orderService->update($order, $validated);

        return response()->json(new OrderResource($updated));
    }

    /**
     * Remove the specified order.
     */
    public function destroy(Order $order): JsonResponse
    {
        $this->orderService->delete($order);

        return response()->json(['message' => 'Order deleted']);
    }

    /**
     * Display live (active) orders.
     */
    public function live(): JsonResponse
    {
        $orders = $this->orderService->live();

        return response()->json(OrderResource::collection($orders));
    }

    /**
     * Display order history (completed and cancelled orders).
     */
    public function history(Request $request): JsonResponse
    {
        $payload = $this->orderService->history($request);

        return response()->json($payload);
    }

    /**
     * Update order status.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $this->orderService->validateStatusUpdate($request);
        $updated = $this->orderService->updateStatus($order, (string) $validated['status']);

        return response()->json(new OrderResource($updated));
    }
}
