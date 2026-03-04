<?php

namespace App\Services;

use App\Models\DiningTable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DiningTableService
{
    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
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

        return $this->normalizePayload($validated);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request, DiningTable $table): array
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

        return $this->normalizePayload($validated);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): DiningTable
    {
        $seats = $payload['capacity'] ?? $payload['seats'] ?? 2;

        return DiningTable::create([
            'name' => $payload['name'],
            'seats' => $seats,
            'status' => $payload['status'] ?? 'available',
            'is_active' => $payload['is_active'] ?? true,
            'qr_code' => $payload['qr_code'] ?? ('QR-' . Str::upper(Str::random(10))),
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(DiningTable $table, array $payload): DiningTable
    {
        $table->update($payload);

        return $table->fresh();
    }

    /**
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function normalizePayload(array $validated): array
    {
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

        return $validated;
    }
}
