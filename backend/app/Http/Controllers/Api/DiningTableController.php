<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DiningTableController extends Controller
{
    /**
     * Display a listing of tables.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiningTable::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created table.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', Rule::unique('tables', 'name')],
            'token' => ['sometimes', 'string', 'max:100', Rule::unique('tables', 'token')],
            'capacity' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'reserved'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (! isset($validated['token'])) {
            $validated['token'] = Str::random(40);
        }

        $table = DiningTable::create($validated);

        return response()->json($table, 201);
    }

    /**
     * Display the specified table.
     */
    public function show(DiningTable $table): JsonResponse
    {
        return response()->json($table);
    }

    /**
     * Update the specified table.
     */
    public function update(Request $request, DiningTable $table): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('tables', 'name')->ignore($table->id)],
            'token' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('tables', 'token')->ignore($table->id)],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'reserved'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $table->update($validated);

        return response()->json($table->fresh());
    }

    /**
     * Remove the specified table.
     */
    public function destroy(DiningTable $table): JsonResponse
    {
        $table->delete();

        return response()->json(['message' => 'Table deleted']);
    }
}
