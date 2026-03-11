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
        $query = Ingredient::query()->with('category:id,name')->latest();

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock_qty', '<=', 'min_stock');
        }

        // If paginate parameter is explicitly set to false or not provided, return all
        if ($request->has('paginate') && $request->boolean('paginate') === false) {
            $ingredients = $query->get();
            return response()->json(
                $ingredients->map(fn (Ingredient $ingredient) => $this->transformIngredient($ingredient))
            );
        }

        // Default: return all ingredients without pagination for simplicity
        $ingredients = $query->get();
        return response()->json(
            $ingredients->map(fn (Ingredient $ingredient) => $this->transformIngredient($ingredient))
        );
    }

    /**
     * Store a newly created ingredient.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('ingredients', 'name')],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'unit' => ['required', 'string', 'max:20'],
            'stock_qty' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'unit_cost' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $ingredient = Ingredient::create($validated)->load('category:id,name');

        return response()->json($this->transformIngredient($ingredient), 201);
    }

    /**
     * Display the specified ingredient.
     */
    public function show(Ingredient $ingredient): JsonResponse
    {
        return response()->json($this->transformIngredient($ingredient->load('category:id,name')));
    }

    /**
     * Update the specified ingredient.
     */
    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('ingredients', 'name')->ignore($ingredient->id)],
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'unit' => ['sometimes', 'required', 'string', 'max:20'],
            'stock_qty' => ['sometimes', 'required', 'numeric', 'min:0'],
            'min_stock' => ['sometimes', 'required', 'numeric', 'min:0'],
            'unit_cost' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $ingredient->update($validated);

        return response()->json($this->transformIngredient($ingredient->fresh()->load('category:id,name')));
    }

    /**
     * Remove the specified ingredient.
     */
    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $ingredient->delete();

        return response()->json(['message' => 'Ingredient deleted']);
    }

    /**
     * Normalize ingredient payload for frontend.
     */
    private function transformIngredient(Ingredient $ingredient): array
    {
        return [
            'id' => $ingredient->id,
            'name' => $ingredient->name,
            'category_id' => $ingredient->category_id,
            'category' => $ingredient->category?->name,
            'unit' => $ingredient->unit,
            'stock_qty' => (float) $ingredient->stock_qty,
            'min_stock' => (float) $ingredient->min_stock,
            'unit_cost' => $ingredient->unit_cost !== null ? (float) $ingredient->unit_cost : null,
            'created_at' => $ingredient->created_at,
            'updated_at' => $ingredient->updated_at,
        ];
    }
}
