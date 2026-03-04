<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CategoryService
{
    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate($this->rules());
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request, Category $category): array
    {
        return $request->validate($this->rules($category));
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): Category
    {
        return Category::create($payload)->loadCount('products');
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(Category $category, array $payload): Category
    {
        $category->update($payload);

        return $category->fresh()->loadCount('products');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Category $category = null): array
    {
        $nameRule = $category
            ? Rule::unique('categories', 'name')->ignore($category->id)
            : Rule::unique('categories', 'name');

        $nameBaseRules = ['string', 'max:120', $nameRule];

        $rules = [
            'name' => $category ? ['sometimes', 'required', ...$nameBaseRules] : ['required', ...$nameBaseRules],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];

        if (Schema::hasColumn('categories', 'quantity')) {
            $rules['quantity'] = ['sometimes', 'integer', 'min:0'];
        }

        return $rules;
    }
}
