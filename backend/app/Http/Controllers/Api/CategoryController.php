<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()
            ->withCount('products')
            ->latest();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $rules = [
            'name' => ['required', 'string', 'max:120', Rule::unique('categories', 'name')],
            'is_active' => ['sometimes', 'boolean'],
        ];

        if (Schema::hasColumn('categories', 'quantity')) {
            $rules['quantity'] = ['sometimes', 'integer', 'min:0'];
        }

        $validated = $request->validate($rules);

        $category = Category::create($validated)->loadCount('products');

        return response()->json($category, 201);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json($category->loadCount('products'));
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:120', Rule::unique('categories', 'name')->ignore($category->id)],
            'is_active' => ['sometimes', 'boolean'],
        ];

        if (Schema::hasColumn('categories', 'quantity')) {
            $rules['quantity'] = ['sometimes', 'integer', 'min:0'];
        }

        $validated = $request->validate($rules);

        $category->update($validated);

        return response()->json($category->fresh()->loadCount('products'));
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
