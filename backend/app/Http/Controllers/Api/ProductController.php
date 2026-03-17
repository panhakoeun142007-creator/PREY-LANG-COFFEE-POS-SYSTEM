<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Cache TTL for products (5 minutes).
     */
    private const CACHE_TTL = 300;
          
    /**
     * Allowed image MIME types.
     */
    private const ALLOWED_IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];

    /**
     * Maximum image size in bytes (5MB).
     */
    private const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
            $query = Product::select([
                'id', 
                'category_id', 
                'name', 
                'sku', 
                'price_small', 
                'price_medium', 
                'price_large', 
                'image', 
                'is_available', 
                'created_at', 
                'updated_at'
            ])->with('category:id,name,description,quantity,is_active');

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('is_available')) {
                $query->where('is_available', $request->boolean('is_available'));
            }

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
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
            'image' => 'nullable',
            'image_file' => 'nullable|file|mimes:jpeg,png,gif,webp,svg|max:5120',
            'image_url' => 'nullable|string|url',
            'is_available' => 'nullable',
        ]);

        // Convert is_available to boolean (handles JSON boolean, FormData string "true"/"false")
        if (isset($validated['is_available'])) {
            $v = $validated['is_available'];
            $validated['is_available'] = is_bool($v) ? $v : in_array($v, ['true', '1', 'on', 'yes'], true);
        } else {
            $validated['is_available'] = true;
        }

        // Handle image upload
        $imagePath = $this->handleImageUpload($request);

        $productData = [
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'sku' => $validated['sku'] ?? null,
            'price_small' => $validated['price_small'],
            'price_medium' => $validated['price_medium'],
            'price_large' => $validated['price_large'],
            'is_available' => $validated['is_available'] ?? true,
        ];

        // Set image - priority: uploaded file > URL > existing
        if ($imagePath) {
            $productData['image'] = $imagePath;
        } elseif (isset($validated['image_url']) && $validated['image_url']) {
            $productData['image'] = $validated['image_url'];
        } elseif (isset($validated['image']) && $validated['image']) {
            $productData['image'] = $validated['image'];
        }

        $product = Product::create($productData);
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
            'image_file' => 'nullable|file|mimes:jpeg,png,gif,webp,svg|max:5120',
            'image_url' => 'nullable|string|url',
            'is_available' => 'nullable',
        ]);

        // Convert is_available to boolean (handles JSON boolean, FormData string "true"/"false")
        if (isset($validated['is_available'])) {
            $v = $validated['is_available'];
            $validated['is_available'] = is_bool($v) ? $v : in_array($v, ['true', '1', 'on', 'yes'], true);
        }

        $updateData = $validated;

        // Handle image upload
        $imagePath = $this->handleImageUpload($request);

        // Set image - priority: uploaded file > URL > existing string
        if ($imagePath) {
            // Delete old image if it's a local file
            if ($product->image && !str_starts_with($product->image, 'http')) {
                $this->deleteImage($product->image);
            }
            $updateData['image'] = $imagePath;
        } elseif (isset($validated['image_url']) && $validated['image_url']) {
            // If URL is explicitly provided, use it
            if ($product->image && !str_starts_with($product->image, 'http')) {
                $this->deleteImage($product->image);
            }
            $updateData['image'] = $validated['image_url'];
        }
        // If only 'image' is provided (string), use it
        // If none provided, keep existing image

        // Remove file and URL fields from update data (they're not model fields)
        unset($updateData['image_file'], $updateData['image_url']);

        $product->update($updateData);
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
        // Delete associated image if it's a local file
        if ($product->image && !str_starts_with($product->image, 'http')) {
            $this->deleteImage($product->image);
        }
        
        $product->delete();
        
        // Clear product cache on delete
        $this->clearProductsCache();
        
        return response()->json(['message' => 'Product deleted successfully']);
    }

    /**
     * Handle image upload from file.
     */
    private function handleImageUpload(Request $request): ?string
    {
        if (!$request->hasFile('image_file')) {
            return null;
        }

        $file = $request->file('image_file');

        // Validate file type
        if (!in_array($file->getMimeType(), self::ALLOWED_IMAGE_TYPES)) {
            throw new \InvalidArgumentException('Invalid image type. Allowed types: JPEG, PNG, GIF, WebP, SVG.');
        }

        // Validate file size
        if ($file->getSize() > self::MAX_IMAGE_SIZE) {
            throw new \InvalidArgumentException('Image size exceeds maximum allowed size of 5MB.');
        }

        try {
            // Store in public disk under product-images folder
            $path = $file->store('product-images', 'public');
            
            Log::info('Product image uploaded successfully', [
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize()
            ]);

            return $path;
        } catch (\Exception $e) {
            Log::error('Failed to upload product image', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName()
            ]);
            throw $e;
        }
    }

    /**
     * Delete image file from storage.
     */
    private function deleteImage(?string $imagePath): void
    {
        if (!$imagePath) {
            return;
        }

        try {
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
                Log::info('Product image deleted', ['path' => $imagePath]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete product image', [
                'error' => $e->getMessage(),
                'path' => $imagePath
            ]);
        }
    }

    /**
     * Clear all products cache.
     */
    private function clearProductsCache(): void
    {
        Cache::forget('products_list');
        Cache::forget('products_list_avail_1');
        Cache::forget('products_list_avail_0');
        Cache::forget('categories_list');

        // Clear per-category product caches
        $categoryIds = \App\Models\Category::pluck('id');
        foreach ($categoryIds as $id) {
            Cache::forget("products_list_cat_{$id}");
            Cache::forget("products_list_cat_{$id}_avail_1");
            Cache::forget("products_list_cat_{$id}_avail_0");
        }
    }
}
