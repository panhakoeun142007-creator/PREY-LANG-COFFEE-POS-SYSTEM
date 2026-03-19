<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiningTableController extends Controller
{
    private function customerMenuBaseUrl(): string
    {
        return rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');
    }

    private function buildCustomerMenuUrl(int $tableId, string $tableName): string
    {
        return $this->customerMenuBaseUrl() . '/menu?table=' . $tableId . '&name=' . rawurlencode($tableName);
    }

    private function resolveQrCode(DiningTable $table): string
    {
        $qrCode = $table->qr_code;

        if (is_string($qrCode) && $qrCode !== '') {
            return $qrCode;
        }

        return $this->buildCustomerMenuUrl((int) $table->id, $table->name);
    }

    /**
     * Map DB table shape to frontend table shape.
     *
     * @return array<string, mixed>
     */
    private function transform(DiningTable $table): array
    {
        return [
            'id' => (int) $table->id,
            'name' => $table->name,
            'capacity' => (int) $table->seats,
            'status' => $table->is_active ? 'active' : 'inactive',
            'qrCode' => $this->resolveQrCode($table),
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
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'reserved', 'active', 'inactive'])],
            'is_active' => ['sometimes', 'boolean'],
            'qrCode' => ['sometimes', 'string', 'max:191', Rule::unique('dining_tables', 'qr_code')],
            'qr_code' => ['sometimes', 'string', 'max:191', Rule::unique('dining_tables', 'qr_code')],
        ]);

        if (array_key_exists('qrCode', $validated) && !array_key_exists('qr_code', $validated)) {
            $validated['qr_code'] = $validated['qrCode'];
            unset($validated['qrCode']);
        }

        if (array_key_exists('status', $validated) && in_array($validated['status'], ['active', 'inactive'], true)) {
            $validated['is_active'] = $validated['status'] === 'active';
            unset($validated['status']);
        }

        $seats = $validated['capacity'] ?? $validated['seats'] ?? 2;
        $table = DiningTable::create([
            'name' => $validated['name'],
            'seats' => $seats,
            'status' => $validated['status'] ?? 'available',
            'is_active' => $validated['is_active'] ?? true,
            'qr_code' => $validated['qr_code'] ?? '',
        ]);

        if (blank($table->qr_code)) {
            $table->forceFill([
                'qr_code' => $this->buildCustomerMenuUrl((int) $table->id, $table->name),
            ])->save();
        }

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
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'reserved', 'active', 'inactive'])],
            'is_active' => ['sometimes', 'boolean'],
            'qrCode' => ['sometimes', 'required', 'string', 'max:191', Rule::unique('dining_tables', 'qr_code')->ignore($table->id)],
            'qr_code' => ['sometimes', 'required', 'string', 'max:191', Rule::unique('dining_tables', 'qr_code')->ignore($table->id)],
        ]);

        if (array_key_exists('capacity', $validated)) {
            $validated['seats'] = $validated['capacity'];
            unset($validated['capacity']);
        }

        if (array_key_exists('qrCode', $validated) && !array_key_exists('qr_code', $validated)) {
            $validated['qr_code'] = $validated['qrCode'];
            unset($validated['qrCode']);
        }

        if (array_key_exists('status', $validated) && in_array($validated['status'], ['active', 'inactive'], true)) {
            $validated['is_active'] = $validated['status'] === 'active';
            unset($validated['status']);
        }

        if (
            ! array_key_exists('qr_code', $validated)
            && array_key_exists('name', $validated)
        ) {
            $validated['qr_code'] = $this->buildCustomerMenuUrl((int) $table->id, $validated['name']);
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
