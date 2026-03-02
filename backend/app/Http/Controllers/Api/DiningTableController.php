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
     * Map DB table shape to frontend table shape.
     *
     * @return array<string, mixed>
     */
    private function transform(DiningTable $table): array
    {
        return [
            'id' => (string) $table->id,
            'name' => $table->name,
            'capacity' => (int) $table->seats,
            'status' => $table->is_active ? 'active' : 'inactive',
            'qrCode' => $table->qr_code ?: ('QR-TBL-' . str_pad((string) $table->id, 3, '0', STR_PAD_LEFT)),
            // Keep raw fields for compatibility with existing consumers.
            'seats' => (int) $table->seats,
            'is_active' => (bool) $table->is_active,
            'qr_code' => $table->qr_code,
            'db_status' => $table->status,
        ];
    }

    /**
     * Display a listing of tables.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiningTable::query()->latest();

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if (in_array($status, ['active', 'inactive'], true)) {
                $query->where('is_active', $status === 'active');
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $paginated = $query->paginate(20);
        $paginated->getCollection()->transform(fn (DiningTable $table) => $this->transform($table));

        return response()->json($paginated);
    }

    /**
     * Store a newly created table.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('dining_tables', 'name')],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'seats' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'reserved'])],
            'is_active' => ['sometimes', 'boolean'],
            'qr_code' => ['sometimes', 'string', 'max:191', Rule::unique('dining_tables', 'qr_code')],
        ]);

        $seats = $validated['capacity'] ?? $validated['seats'] ?? 2;
        $table = DiningTable::create([
            'name' => $validated['name'],
            'seats' => $seats,
            'status' => $validated['status'] ?? 'available',
            'is_active' => $validated['is_active'] ?? true,
            'qr_code' => $validated['qr_code'] ?? ('QR-' . Str::upper(Str::random(10))),
        ]);

        return response()->json($this->transform($table), 201);
    }

    /**
     * Display the specified table.
     */
    public function show(DiningTable $table): JsonResponse
    {
        return response()->json($this->transform($table));
    }

    /**
     * Update the specified table.
     */
    public function update(Request $request, DiningTable $table): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('dining_tables', 'name')->ignore($table->id)],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'seats' => ['sometimes', 'required', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'reserved'])],
            'is_active' => ['sometimes', 'boolean'],
            'qr_code' => ['sometimes', 'required', 'string', 'max:191', Rule::unique('dining_tables', 'qr_code')->ignore($table->id)],
        ]);

        if (array_key_exists('capacity', $validated)) {
            $validated['seats'] = $validated['capacity'];
            unset($validated['capacity']);
        }

        $table->update($validated);

        return response()->json($this->transform($table->fresh()));
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
