<?php

namespace App\Services;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IngredientService
{
    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('ingredients', 'name')],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'unit' => ['required', 'string', 'max:20'],
            'stock_qty' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'unit_cost' => ['sometimes', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request, Ingredient $ingredient): array
    {
        return $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('ingredients', 'name')->ignore($ingredient->id)],
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'unit' => ['sometimes', 'required', 'string', 'max:20'],
            'stock_qty' => ['sometimes', 'required', 'numeric', 'min:0'],
            'min_stock' => ['sometimes', 'required', 'numeric', 'min:0'],
            'unit_cost' => ['sometimes', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): Ingredient
    {
        return Ingredient::create($payload)->load('category:id,name');
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(Ingredient $ingredient, array $payload): Ingredient
    {
        $ingredient->update($payload);

        return $ingredient->fresh()->load('category:id,name');
    }
}
