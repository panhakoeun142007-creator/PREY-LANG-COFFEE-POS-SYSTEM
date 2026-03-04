<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use App\Services\RecipeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function __construct(private readonly RecipeService $recipeService)
    {
    }

    /**
     * Display aggregated recipe rows for stock/recipe page.
     */
    public function boardIndex(Request $request): JsonResponse
    {
        $validated = $this->recipeService->validateBoardIndex($request);
        $rows = $this->recipeService->boardRows($validated);

        return response()->json(['data' => $rows]);
    }

    /**
     * Create a recipe row for a product size.
     */
    public function boardStore(Request $request): JsonResponse
    {
        $validated = $this->recipeService->validateBoardStore($request);
        $row = $this->recipeService->createBoardRow($validated);

        return response()->json($row, 201);
    }

    /**
     * Update recipe rows for a product size.
     */
    public function boardUpdate(Request $request, int $product): JsonResponse
    {
        $validated = $this->recipeService->validateBoardUpdate($request);
        $row = $this->recipeService->updateBoardRow($product, $validated);

        return response()->json($row);
    }

    /**
     * Toggle recipe row status (mapped to product availability).
     */
    public function boardUpdateStatus(Request $request, int $product): JsonResponse
    {
        $validated = $this->recipeService->validateBoardStatus($request);
        $payload = $this->recipeService->updateBoardStatus($product, (bool) $validated['is_active']);

        return response()->json($payload);
    }

    /**
     * Delete recipe rows for a specific product size.
     */
    public function boardDestroy(int $product, string $size): JsonResponse
    {
        if (!$this->recipeService->deleteBoardSize($product, $size)) {
            return response()->json(['message' => 'Invalid size'], 422);
        }

        return response()->json(['message' => 'Recipe removed']);
    }

    /**
     * Display a listing of recipes.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->recipeService->list($request);
        $paginator->setCollection(RecipeResource::collection($paginator->getCollection())->collection);

        return response()->json($paginator);
    }

    /**
     * Store a newly created recipe row.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->recipeService->validateStore($request);
        $recipe = $this->recipeService->create($validated);

        return response()->json(new RecipeResource($recipe), 201);
    }

    /**
     * Display the specified recipe row.
     */
    public function show(Recipe $recipe): JsonResponse
    {
        return response()->json(new RecipeResource($recipe->load(['product', 'ingredient'])));
    }

    /**
     * Update the specified recipe row.
     */
    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $this->recipeService->validateUpdate($request);
        $updated = $this->recipeService->update($recipe, $validated);

        return response()->json(new RecipeResource($updated));
    }

    /**
     * Remove the specified recipe row.
     */
    public function destroy(Recipe $recipe): JsonResponse
    {
        $this->recipeService->delete($recipe);

        return response()->json(['message' => 'Recipe deleted']);
    }
}
