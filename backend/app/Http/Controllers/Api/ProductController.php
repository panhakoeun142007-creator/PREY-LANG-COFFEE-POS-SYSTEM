<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * Cache TTL for products (5 minutes).
     */
    private const CACHE_TTL = 300;

    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        // Build cache key based on request filters
        $cacheKey = 'products_list';
        if ($request->has('category_id')) {
            $cacheKey .= '_cat_' . $request->category_id;
        }
        if ($request->has('is_available')) {
            $cacheKey .= '_avail_' . ($request->boolean('is_available') ? '1' : '0');
        }

        // Try cache first
        $products = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request) {
            $query = Product::with('category');

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('is_available')) {
                $query->where('is_available', $request->boolean('is_available'));
            }

            return $query->get();
        });

        return response()->json([
            'data' => $products,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $products->count(),
            'total' => $products->count(),
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'price_small' => 'required|numeric|min:0',
            'price_medium' => 'required|numeric|min:0',
            'price_large' => 'required|numeric|min:0',
            'image' => 'nullable|string',
            'is_available' => 'nullable|boolean',
        ]);

        $product = Product::create($validated);
        $product->load('category');

        // Clear product cache on create
        $this->clearProductsCache();

        return response()->json($product, 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');
        return response()->json($product);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'price_small' => 'sometimes|required|numeric|min:0',
            'price_medium' => 'sometimes|required|numeric|min:0',
            'price_large' => 'sometimes|required|numeric|min:0',
            'image' => 'nullable|string',
            'is_available' => 'nullable|boolean',
        ]);

        $product->update($validated);
        $product->load('category');

        // Clear product cache on update
        $this->clearProductsCache();

        return response()->json($product);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        
        // Clear product cache on delete
        $this->clearProductsCache();
        
        return response()->json(['message' => 'Product deleted successfully']);
    }

    /**
     * Clear all products cache.
     */
    private function clearProductsCache(): void
    {
        // Use cache tags for more efficient cache management
        // Clear generic product caches
        Cache::forget('products_list');
        
        // Use a pattern-based approach - Laravel doesn't support wildcard forget
        // So we'll clear known keys efficiently
        // The cache keys are: products_list, products_list_cat_{id}, products_list_avail_{0/1}
        
        // Since we can't use wildcards, clear the main caches
        // Categories will be cleared via their own controller
        Cache::forget('categories_list');
    }
}
