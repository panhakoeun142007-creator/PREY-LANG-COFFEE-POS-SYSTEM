<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rule;

class RecipeService
{
    /**
     * @return array<string, mixed>
     */
    public function validateBoardIndex(Request $request): array
    {
        return $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'status' => ['nullable', Rule::in(['all', 'active', 'inactive'])],
        ]);
    }

    /**
     * @param array<string, mixed> $validated
     * @return array<int, array<string, mixed>>
     */
    public function boardRows(array $validated): array
    {
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

        return $rows;
    }

    /**
     * @return array<string, mixed>
     */
    public function validateBoardStore(Request $request): array
    {
        return $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'ingredients.*.amount' => ['required', 'numeric', 'gt:0'],
        ]);
    }

    /**
     * @param array<string, mixed> $validated
     * @return array<string, mixed>|null
     */
    public function createBoardRow(array $validated): ?array
    {
        $productId = (int) $validated['product_id'];
        $size = (string) $validated['size'];

        $this->syncRecipeSize($productId, $size, $validated['ingredients']);

        $product = Product::query()->with(['category', 'recipes.ingredient'])->findOrFail($productId);

        return $this->buildBoardRow($product, $size);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateBoardUpdate(Request $request): array
    {
        return $request->validate([
            'size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'ingredients.*.amount' => ['required', 'numeric', 'gt:0'],
        ]);
    }

    /**
     * @param array<string, mixed> $validated
     * @return array<string, mixed>|null
     */
    public function updateBoardRow(int $productId, array $validated): ?array
    {
        Product::query()->findOrFail($productId);
        $size = (string) $validated['size'];

        $this->syncRecipeSize($productId, $size, $validated['ingredients']);

        $refreshedProduct = Product::query()->with(['category', 'recipes.ingredient'])->findOrFail($productId);

        return $this->buildBoardRow($refreshedProduct, $size);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateBoardStatus(Request $request): array
    {
        return $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function updateBoardStatus(int $productId, bool $isActive): array
    {
        $record = Product::query()->findOrFail($productId);
        $record->update(['is_available' => $isActive]);

        return [
            'product_id' => $record->id,
            'status' => $record->is_available ? 'active' : 'inactive',
        ];
    }

    public function deleteBoardSize(int $productId, string $size): bool
    {
        Product::query()->findOrFail($productId);

        $normalizedSize = strtolower($size);
        if (!in_array($normalizedSize, ['small', 'medium', 'large'], true)) {
            return false;
        }

        $column = $this->sizeColumn($normalizedSize);

        Recipe::query()
            ->where('product_id', $productId)
            ->update([$column => 0]);

        Recipe::query()
            ->where('product_id', $productId)
            ->where('amount_small', 0)
            ->where('amount_medium', 0)
            ->where('amount_large', 0)
            ->delete();

        return true;
    }

    public function list(Request $request): LengthAwarePaginator
    {
        $query = Recipe::query()->with(['product', 'ingredient'])->latest();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        return $query->paginate(20);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'ingredient_id' => ['required', 'exists:ingredients,id'],
            'amount_small' => ['required', 'numeric', 'min:0'],
            'amount_medium' => ['required', 'numeric', 'min:0'],
            'amount_large' => ['required', 'numeric', 'min:0'],
        ]);
    }

    public function create(array $validated): Recipe
    {
        return Recipe::create($validated)->load(['product', 'ingredient']);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request): array
    {
        return $request->validate([
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'ingredient_id' => ['sometimes', 'required', 'exists:ingredients,id'],
            'amount_small' => ['sometimes', 'required', 'numeric', 'min:0'],
            'amount_medium' => ['sometimes', 'required', 'numeric', 'min:0'],
            'amount_large' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);
    }

    public function update(Recipe $recipe, array $validated): Recipe
    {
        $recipe->update($validated);

        return $recipe->fresh()->load(['product', 'ingredient']);
    }

    public function delete(Recipe $recipe): void
    {
        $recipe->delete();
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
