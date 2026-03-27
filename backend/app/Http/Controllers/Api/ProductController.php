<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

/**
 * Product management controller.
 */
class ProductController extends BaseController
{
    private const CACHE_TTL = 300;
    private const CACHE_VERSION_KEY = 'products_cache_version';

    /**
     * List products with caching.
     */
    public function index(Request $request): JsonResponse
    {
        $cacheKey = $this->buildProductsCacheKey($request);

        $products = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request) {
            $query = Product::select($this->productSelectColumns())
                ->with('category:id,name,description,quantity,is_active');

            if ($request->has('category_id')) {
                $query->where('category_id', $request->integer('category_id'));
            }

            if ($request->has('is_available')) {
                $query->where('is_available', $request->boolean('is_available'));
            }

            if ($request->boolean('is_popular')) {
                $query->where('is_popular', true);
            }

            if ($request->filled('search')) {
                $search = trim((string) $request->string('search'));
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            }

            return $query->orderBy('name')->get();
        });

        $serializedProducts = $products->map(fn (Product $p) => $this->serializeProduct($p));

        return response()->json([
            'data' => $serializedProducts,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $serializedProducts->count(),
            'total' => $serializedProducts->count(),
        ]);
    }

    /**
     * Get popular products (for customer menu highlighting).
     */
    public function popular(Request $request): JsonResponse
    {
        $products = Product::select($this->productSelectColumns())
            ->with('category:id,name,description,quantity,is_active')
            ->where('is_popular', true)
            ->where('is_available', true)
            ->orderBy('name')
            ->get();

        $serializedProducts = $products->map(fn (Product $p) => $this->serializeProduct($p));

        return response()->json([
            'data' => $serializedProducts,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $serializedProducts->count(),
            'total' => $serializedProducts->count(),
        ]);
    }

    /**
     * Toggle product as popular.
     */
    public function togglePopular(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'is_popular' => 'required|boolean',
        ]);

        $product->update(['is_popular' => $request->boolean('is_popular')]);
        $product->load('category');

        $this->clearProductsCache();

        return response()->json($this->serializeProduct($product));
    }

    /**
     * Create product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProductRequest($request);

        // Handle image
        $imagePath = $this->imageService->handleUpload($request, 'image_file', 'product-images');
        
        $productData = [
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'sku' => $validated['sku'] ?? null,
            'price_small' => $validated['price_small'],
            'price_medium' => $validated['price_medium'],
            'price_large' => $validated['price_large'],
            'is_available' => $validated['is_available'] ?? true,
            'is_popular' => $validated['is_popular'] ?? false,
        ];

        // Set image - priority: uploaded file > URL > existing
        if ($imagePath) {
            $productData['image'] = $imagePath;
        } elseif (!empty($validated['image_url'])) {
            $productData['image'] = $validated['image_url'];
        } elseif (!empty($validated['image'])) {
            $productData['image'] = $validated['image'];
        }

        $product = Product::create($productData);
        $product->load('category');

        $this->clearProductsCache();

        return response()->json($this->serializeProduct($product), 201);
    }

    /**
     * Get single product.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');
        return response()->json($this->serializeProduct($product));
    }

    /**
     * Update product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validateProductRequest($request, true);

        $updateData = $validated;

        // Handle image upload
        $imagePath = $this->imageService->handleUpload($request, 'image_file', 'product-images');

        if ($imagePath) {
            // Delete old local image
            $this->imageService->delete($product->image);
            $updateData['image'] = $imagePath;
        } elseif (!empty($validated['image_url'])) {
            $this->imageService->delete($product->image);
            $updateData['image'] = $validated['image_url'];
        }

        // Remove file fields from update
        unset($updateData['image_file'], $updateData['image_url']);

        $product->update($updateData);
        $product->load('category');

        $this->clearProductsCache();

        return response()->json($this->serializeProduct($product));
    }

    /**
     * Delete product.
     */
    public function destroy(Product $product): JsonResponse
    {
        // Delete associated image
        $this->imageService->delete($product->image);
        
        $product->delete();
        $this->clearProductsCache();
        
        return response()->json(['message' => 'Product deleted successfully']);
    }

    // ==================== Private Helpers ====================

    private function validateProductRequest(Request $request, bool $isUpdate = false): array
    {
        $baseRules = [
            'category_id' => $isUpdate ? 'sometimes|required|exists:categories,id' : 'required|exists:categories,id',
            'name' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'price_small' => $isUpdate ? 'sometimes|required|numeric|min:0' : 'required|numeric|min:0',
            'price_medium' => $isUpdate ? 'sometimes|required|numeric|min:0' : 'required|numeric|min:0',
            'price_large' => $isUpdate ? 'sometimes|required|numeric|min:0' : 'required|numeric|min:0',
            'image' => 'nullable|string',
            'image_file' => 'nullable|file|mimes:jpeg,png,gif,webp,svg|max:5120',
            'image_url' => 'nullable|string|url',
            'is_available' => 'nullable',
            'is_popular' => 'nullable|boolean',
            // Discount fields
            'discount_type' => 'nullable|string|in:percentage,fixed,promo',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_start_date' => 'nullable|date',
            'discount_end_date' => 'nullable|date|after:discount_start_date',
            'discount_active' => 'nullable|boolean',
        ];

        $validated = $request->validate($baseRules);

        // Parse boolean
        if (isset($validated['is_available'])) {
            $validated['is_available'] = $this->parseBoolean($validated['is_available']);
        } else {
            $validated['is_available'] = true;
        }

        if (isset($validated['is_popular'])) {
            $validated['is_popular'] = $this->parseBoolean($validated['is_popular']);
        }

        if (isset($validated['discount_active'])) {
            $validated['discount_active'] = $this->parseBoolean($validated['discount_active']);
        }

        return $validated;
    }

    private function serializeProduct(Product $product): array
    {
        $payload = $product->toArray();
        $payload['image_url'] = $this->imageService->buildUrl($product->image);
        
        // Add calculated discounted prices
        $payload['has_discount'] = $product->hasActiveDiscount();
        $payload['discounted_price_small'] = $product->getDiscountedPrice('small');
        $payload['discounted_price_medium'] = $product->getDiscountedPrice('medium');
        $payload['discounted_price_large'] = $product->getDiscountedPrice('large');
        
        return $payload;
    }

    private function buildProductsCacheKey(Request $request): string
    {
        $parts = [
            'products_list',
            'v' . (int) Cache::get(self::CACHE_VERSION_KEY, 1),
        ];

        if ($request->filled('category_id')) {
            $parts[] = 'cat_' . $request->integer('category_id');
        }

        if ($request->has('is_available')) {
            $parts[] = 'avail_' . ($request->boolean('is_available') ? '1' : '0');
        }

        if ($request->filled('search')) {
            $parts[] = 'search_' . md5(mb_strtolower(trim((string) $request->string('search'))));
        }

        return implode('_', $parts);
    }

    private function productSelectColumns(): array
    {
        return $this->filterExistingColumns('products', [
            'id', 'category_id', 'name', 'description', 'sku',
            'price_small', 'price_medium', 'price_large', 'cost',
            'supplier_id', 'image', 'is_available', 'is_popular',
            'discount_type', 'discount_value', 'discount_start_date', 'discount_end_date', 'discount_active',
            'created_at', 'updated_at',
        ]);
    }

    private function filterExistingColumns(string $table, array $columns): array
    {
        static $availableColumns = [];

        if (!isset($availableColumns[$table])) {
            $availableColumns[$table] = array_flip(Schema::getColumnListing($table));
        }

        return array_values(array_filter($columns, fn (string $c) => isset($availableColumns[$table][$c])));
    }

    private function clearProductsCache(): void
    {
        Cache::forget('categories_list');
        Cache::forever(self::CACHE_VERSION_KEY, ((int) Cache::get(self::CACHE_VERSION_KEY, 1)) + 1);
    }
}
