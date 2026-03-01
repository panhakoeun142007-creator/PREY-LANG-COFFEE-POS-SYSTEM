<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IngredientController extends Controller
{
    /**
     * Display a listing of ingredients.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::query()->latest();

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock_qty', '<=', 'min_stock');
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created ingredient.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('ingredients', 'name')],
            'unit' => ['required', 'string', 'max:20'],
            'stock_qty' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'unit_cost' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $ingredient = Ingredient::create($validated);

        return response()->json($ingredient, 201);
    }

    /**
     * Display the specified ingredient.
     */
    public function show(Ingredient $ingredient): JsonResponse
    {
        return response()->json($ingredient);
    }

    /**
     * Update the specified ingredient.
     */
    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('ingredients', 'name')->ignore($ingredient->id)],
            'unit' => ['sometimes', 'required', 'string', 'max:20'],
            'stock_qty' => ['sometimes', 'required', 'numeric', 'min:0'],
            'min_stock' => ['sometimes', 'required', 'numeric', 'min:0'],
            'unit_cost' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $ingredient->update($validated);

        return response()->json($ingredient->fresh());
    }

    /**
     * Remove the specified ingredient.
     */
    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $ingredient->delete();

        return response()->json(['message' => 'Ingredient deleted']);
    }
}
