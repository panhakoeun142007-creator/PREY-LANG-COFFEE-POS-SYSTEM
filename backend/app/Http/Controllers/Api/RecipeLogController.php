<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecipeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RecipeLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = RecipeLog::orderByDesc('created_at')->get();
        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|string|exists:orders,id',
            'table_no' => 'required|string|max:255',
            'name' => 'required|string|max:255',
        ]);

        $log = RecipeLog::create($validated);

        return response()->json($log, 201);
    }

    public function destroy(string $id): Response
    {
        $log = RecipeLog::findOrFail($id);
        $log->delete();

        return response()->noContent();
    }
}
