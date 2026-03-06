<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Purchase::query()->with('ingredient')->latest('date');

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->integer('ingredient_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ingredient_id' => ['required', 'exists:ingredients,id'],
            'qty' => ['required', 'numeric', 'min:0.01'],
            'cost' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $purchase = DB::transaction(function () use ($validated) {
            $purchase = Purchase::create($validated);

            Ingredient::query()
                ->where('id', $validated['ingredient_id'])
                ->increment('stock_qty', (float) $validated['qty']);

            return $purchase->load('ingredient');
        });

        return response()->json($purchase, 201);
    }

    /**
     * Display the specified purchase.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json($purchase->load('ingredient'));
    }

    /**
     * Update the specified purchase.
     */
    public function update(Request $request, Purchase $purchase): JsonResponse
    {
        $validated = $request->validate([
            'ingredient_id' => ['sometimes', 'required', 'exists:ingredients,id'],
            'qty' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'cost' => ['sometimes', 'required', 'numeric', 'min:0'],
            'date' => ['sometimes', 'required', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $purchase->update($validated);

        return response()->json($purchase->fresh()->load('ingredient'));
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy(Purchase $purchase): JsonResponse
    {
        $purchase->delete();

        return response()->json(['message' => 'Purchase deleted']);
    }
}
