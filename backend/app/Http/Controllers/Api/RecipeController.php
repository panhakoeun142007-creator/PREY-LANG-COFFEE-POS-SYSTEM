<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecipeController extends Controller
{
    /**
     * Display aggregated recipe rows for stock/recipe page.
     */
    public function boardIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'status' => ['nullable', Rule::in(['all', 'active', 'inactive'])],
        ]);

        $query = Product::query()->with(['category', 'recipes.ingredient']);

        if (!empty($validated['search'])) {
            $query->where('name', 'like', '%' . $validated['search'] . '%');
        }

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        if (($validated['status'] ?? 'all') !== 'all') {
            $query->where('is_available', ($validated['status'] ?? 'all') === 'active');
        }

        $products = $query->get();
        $rows = [];

        foreach ($products as $product) {
            foreach (['small', 'medium', 'large'] as $size) {
                $row = $this->buildBoardRow($product, $size);
                if ($row !== null) {
                    $rows[] = $row;
                }
            }
        }

        return response()->json(['data' => $rows]);
    }

    /**
     * Create a recipe row for a product size.
     */
    public function boardStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'ingredients.*.amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $productId = (int) $validated['product_id'];
        $size = $validated['size'];

        $this->syncRecipeSize($productId, $size, $validated['ingredients']);

        $product = Product::query()->with(['category', 'recipes.ingredient'])->findOrFail($productId);
        $row = $this->buildBoardRow($product, $size);

        return response()->json($row, 201);
    }

    /**
     * Update recipe rows for a product size.
     */
    public function boardUpdate(Request $request, int $product): JsonResponse
    {
        $validated = $request->validate([
            'size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'ingredients.*.amount' => ['required', 'numeric', 'gt:0'],
        ]);

        Product::query()->findOrFail($product);
        $size = $validated['size'];

        $this->syncRecipeSize($product, $size, $validated['ingredients']);

        $refreshedProduct = Product::query()->with(['category', 'recipes.ingredient'])->findOrFail($product);
        $row = $this->buildBoardRow($refreshedProduct, $size);

        return response()->json($row);
    }

    /**
     * Toggle recipe row status (mapped to product availability).
     */
    public function boardUpdateStatus(Request $request, int $product): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $record = Product::query()->findOrFail($product);
        $record->update(['is_available' => $validated['is_active']]);

        return response()->json([
            'product_id' => $record->id,
            'status' => $record->is_available ? 'active' : 'inactive',
        ]);
    }

    /**
     * Delete recipe rows for a specific product size.
     */
    public function boardDestroy(int $product, string $size): JsonResponse
    {
        Product::query()->findOrFail($product);

        $normalizedSize = strtolower($size);
        if (!in_array($normalizedSize, ['small', 'medium', 'large'], true)) {
            return response()->json(['message' => 'Invalid size'], 422);
        }

        $column = $this->sizeColumn($normalizedSize);

        Recipe::query()
            ->where('product_id', $product)
            ->update([$column => 0]);

        Recipe::query()
            ->where('product_id', $product)
            ->where('amount_small', 0)
            ->where('amount_medium', 0)
            ->where('amount_large', 0)
            ->delete();

        return response()->json(['message' => 'Recipe removed']);
    }

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

    /**
     * Build a recipe board row for one product-size variant.
     *
     * @return array<string, mixed>|null
     */
    private function buildBoardRow(Product $product, string $size): ?array
    {
        $column = $this->sizeColumn($size);

        /** @var Collection<int, Recipe> $rows */
        $rows = $product->recipes->filter(function (Recipe $recipe) use ($column) {
            return (float) $recipe->{$column} > 0;
        });

        if ($rows->isEmpty()) {
            return null;
        }

        $estCost = $rows->sum(function (Recipe $recipe) use ($column) {
            $amount = (float) $recipe->{$column};
            $unitCost = (float) ($recipe->ingredient?->unit_cost ?? 0);
            return $amount * $unitCost;
        });

        return [
            'id' => $product->id . '-' . $size,
            'product_id' => $product->id,
            'product' => $product->name,
            'category_id' => $product->category_id,
            'category' => $product->category?->name ?? 'Uncategorized',
            'size' => ucfirst($size),
            'ingredients_count' => $rows->count(),
            'est_cost' => round($estCost, 2),
            'status' => $product->is_available ? 'active' : 'inactive',
            'ingredients' => $rows
                ->map(function (Recipe $recipe) use ($column) {
                    return [
                        'ingredient_id' => $recipe->ingredient_id,
                        'ingredient_name' => $recipe->ingredient?->name,
                        'amount' => (float) $recipe->{$column},
                    ];
                })
                ->values(),
        ];
    }

    /**
     * Replace all ingredient amounts for a product-size recipe.
     *
     * @param array<int, array<string, mixed>> $ingredients
     */
    private function syncRecipeSize(int $productId, string $size, array $ingredients): void
    {
        $column = $this->sizeColumn($size);

        Recipe::query()
            ->where('product_id', $productId)
            ->update([$column => 0]);

        foreach ($ingredients as $ingredientPayload) {
            $ingredientId = (int) $ingredientPayload['ingredient_id'];
            $amount = (float) $ingredientPayload['amount'];

            $recipe = Recipe::query()->firstOrNew([
                'product_id' => $productId,
                'ingredient_id' => $ingredientId,
            ]);

            if (!$recipe->exists) {
                $recipe->amount_small = 0;
                $recipe->amount_medium = 0;
                $recipe->amount_large = 0;
            }

            $recipe->{$column} = $amount;
            $recipe->save();
        }

        Recipe::query()
            ->where('product_id', $productId)
            ->where('amount_small', 0)
            ->where('amount_medium', 0)
            ->where('amount_large', 0)
            ->delete();
    }

    /**
     * Resolve recipe amount column for selected size.
     */
    private function sizeColumn(string $size): string
    {
        return match (strtolower($size)) {
            'small' => 'amount_small',
            'medium' => 'amount_medium',
            'large' => 'amount_large',
            default => 'amount_medium',
        };
    }
}
