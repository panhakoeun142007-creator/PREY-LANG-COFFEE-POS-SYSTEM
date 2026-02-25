<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * Display a listing of recipes.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::query()->with(['product', 'ingredient'])->latest();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created recipe row.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'ingredient_id' => ['required', 'exists:ingredients,id'],
            'amount_small' => ['required', 'numeric', 'min:0'],
            'amount_medium' => ['required', 'numeric', 'min:0'],
            'amount_large' => ['required', 'numeric', 'min:0'],
        ]);

        $recipe = Recipe::create($validated)->load(['product', 'ingredient']);

        return response()->json($recipe, 201);
    }

    /**
     * Display the specified recipe row.
     */
    public function show(Recipe $recipe): JsonResponse
    {
        return response()->json($recipe->load(['product', 'ingredient']));
    }

    /**
     * Update the specified recipe row.
     */
    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'ingredient_id' => ['sometimes', 'required', 'exists:ingredients,id'],
            'amount_small' => ['sometimes', 'required', 'numeric', 'min:0'],
            'amount_medium' => ['sometimes', 'required', 'numeric', 'min:0'],
            'amount_large' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $recipe->update($validated);

        return response()->json($recipe->fresh()->load(['product', 'ingredient']));
    }

    /**
     * Remove the specified recipe row.
     */
    public function destroy(Recipe $recipe): JsonResponse
    {
        $recipe->delete();

        return response()->json(['message' => 'Recipe deleted']);
    }
}
