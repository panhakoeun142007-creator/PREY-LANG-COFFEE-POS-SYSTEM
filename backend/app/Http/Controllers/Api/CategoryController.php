<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    /**
     * Cache TTL for categories (5 minutes).
     */
    private const CACHE_TTL = 300;

    public function index(): JsonResponse
    {
        $categories = Cache::remember('categories_list', self::CACHE_TTL, function () {
            return Category::withCount('products')->get();
        });
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $category = Category::create($validated);
        
        // Clear category cache
        Cache::forget('categories_list');
        
        return response()->json($category, 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->loadCount('products');
        return response()->json($category);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $category->update($validated);
        
        // Clear category cache
        Cache::forget('categories_list');
        
        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        
        // Clear category cache
        Cache::forget('categories_list');
        
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
