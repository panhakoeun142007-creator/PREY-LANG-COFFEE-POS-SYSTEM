<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $productService)
    {
    }

    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with('category')->latest();
        $perPage = max(1, min(100, $request->integer('per_page', 10)));

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $paginator = $query->paginate($perPage);
        $paginator->setCollection(ProductResource::collection($paginator->getCollection())->collection);

        return response()->json($paginator);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->productService->prepareStorePayload($request);

        try {
            $product = $this->productService->create($validated);

            return response()->json(new ProductResource($product), 201);
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
        return response()->json(new ProductResource($product->load('category')));
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->productService->prepareUpdatePayload($request, $product);

        try {
            return response()->json(new ProductResource($this->productService->update($product, $validated)));
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
