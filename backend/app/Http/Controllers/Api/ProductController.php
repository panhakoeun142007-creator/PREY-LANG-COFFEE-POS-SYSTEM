<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $products = $query->get();

        return response()->json([
            'data' => $products,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $products->count(),
            'total' => $products->count(),
        ]);
    }

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

        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load('category');
        return response()->json($product);
    }

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

        return response()->json($product);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
