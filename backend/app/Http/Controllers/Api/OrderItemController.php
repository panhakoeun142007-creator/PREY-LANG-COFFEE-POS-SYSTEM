<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderItemResource;
use App\Models\OrderItem;
use App\Services\OrderItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function __construct(private readonly OrderItemService $orderItemService)
    {
    }

    /**
     * Display a listing of order items.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->orderItemService->list($request);
        $paginator->setCollection(OrderItemResource::collection($paginator->getCollection())->collection);

        return response()->json($paginator);
    }

    /**
     * Store a newly created order item.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->orderItemService->validateStore($request);
        $item = $this->orderItemService->create($validated);

        return response()->json(new OrderItemResource($item), 201);
    }

    /**
     * Display the specified order item.
     */
    public function show(OrderItem $orderItem): JsonResponse
    {
        return response()->json(new OrderItemResource($orderItem->load(['order', 'product'])));
    }

    /**
     * Update the specified order item.
     */
    public function update(Request $request, OrderItem $orderItem): JsonResponse
    {
        $validated = $this->orderItemService->validateUpdate($request);
        $updated = $this->orderItemService->update($orderItem, $validated);

        return response()->json(new OrderItemResource($updated));
    }

    /**
     * Remove the specified order item.
     */
    public function destroy(OrderItem $orderItem): JsonResponse
    {
        $this->orderItemService->delete($orderItem);

        return response()->json(['message' => 'Order item deleted']);
    }
}
