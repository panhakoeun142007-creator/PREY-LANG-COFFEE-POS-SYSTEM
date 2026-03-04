<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct(private readonly PurchaseService $purchaseService)
    {
    }

    /**
     * Display a listing of purchases.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->purchaseService->list($request);
        $paginator->setCollection(PurchaseResource::collection($paginator->getCollection())->collection);

        return response()->json($paginator);
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->purchaseService->validateStore($request);
        $purchase = $this->purchaseService->create($validated);

        return response()->json(new PurchaseResource($purchase), 201);
    }

    /**
     * Display the specified purchase.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json(new PurchaseResource($purchase->load('ingredient')));
    }

    /**
     * Update the specified purchase.
     */
    public function update(Request $request, Purchase $purchase): JsonResponse
    {
        $validated = $this->purchaseService->validateUpdate($request);
        $updated = $this->purchaseService->update($purchase, $validated);

        return response()->json(new PurchaseResource($updated));
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy(Purchase $purchase): JsonResponse
    {
        $this->purchaseService->delete($purchase);

        return response()->json(['message' => 'Purchase deleted']);
    }
}
