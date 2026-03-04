<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with('category')->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->has('is_available')) {
            $request->merge([
                'is_available' => filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                    ?? $request->input('is_available'),
            ]);
        }

        $imageRules = $request->hasFile('image')
            ? ['nullable', 'file', 'image', 'max:5120']
            : ['nullable', 'string'];

        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:80', 'unique:products,sku'],
            'price_small' => ['required', 'numeric', 'min:0'],
            'price_medium' => ['required', 'numeric', 'min:0'],
            'price_large' => ['required', 'numeric', 'min:0'],
            'image' => $imageRules,
            'is_available' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        // Auto-generate SKU if not provided
        if (empty($validated['sku'])) {
            $validated['sku'] = 'SKU-' . strtoupper(uniqid());
        }

        try {
            $product = Product::create($validated)->load('category');
            return response()->json($product, 201);
        } catch (QueryException $e) {
            Log::error('Product create failed', [
                'error' => $e->getMessage(),
                'payload_keys' => array_keys($validated),
            ]);

            return response()->json([
                'message' => 'Unable to create product. Please check image size and required fields.',
            ], 422);
        }
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load('category'));
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        if ($request->has('is_available')) {
            $request->merge([
                'is_available' => filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                    ?? $request->input('is_available'),
            ]);
        }

        $imageRules = $request->hasFile('image')
            ? ['nullable', 'file', 'image', 'max:5120']
            : ['nullable', 'string'];

        $validated = $request->validate([
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:80', 'unique:products,sku,' . $product->id],
            'price_small' => ['sometimes', 'required', 'numeric', 'min:0'],
            'price_medium' => ['sometimes', 'required', 'numeric', 'min:0'],
            'price_large' => ['sometimes', 'required', 'numeric', 'min:0'],
            'image' => $imageRules,
            'is_available' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            $storedImage = $product->getRawOriginal('image');

            if ($storedImage && Str::startsWith($storedImage, 'products/')) {
                Storage::disk('public')->delete($storedImage);
            }

            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        try {
            $product->update($validated);
            return response()->json($product->fresh()->load('category'));
        } catch (QueryException $e) {
            Log::error('Product update failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'payload_keys' => array_keys($validated),
            ]);

            return response()->json([
                'message' => 'Unable to update product. Please check image size and field values.',
            ], 422);
        }
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
