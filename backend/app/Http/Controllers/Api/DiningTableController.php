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
    private const CUSTOMER_APP_URL_FALLBACK = 'http://localhost:5174';

    private function customerAppUrl(): string
    {
        $configured = (string) (config('app.customer_app_url') ?? '');
        $value = trim($configured) !== '' ? $configured : self::CUSTOMER_APP_URL_FALLBACK;
        return rtrim($value, '/');
    }

    private function buildCustomerMenuUrl(DiningTable $table): string
    {
        return $this->customerAppUrl()
            . '/menu?table='
            . $table->id
            . '&name='
            . urlencode($table->name);
    }

    private function isAbsoluteUrl(?string $value): bool
    {
        if (!$value) {
            return false;
        }

        return Str::startsWith($value, ['http://', 'https://']);
    }

    private function transform(DiningTable $table): array
    {
        $qrRaw = $table->qr_code ?: null;
        $qrUrl = $this->isAbsoluteUrl($qrRaw)
            ? (string) $qrRaw
            : $this->buildCustomerMenuUrl($table);

        return [
            'id' => (int) $table->id,
            'name' => $table->name,
            'capacity' => (int) $table->seats,
            'status' => $table->is_active ? 'active' : 'inactive',
            // qrCode remains the raw value for compatibility (can be "QR-..." or a URL).
            'qrCode' => $qrRaw ?? $qrUrl,
            // qrUrl is always a URL that opens the customer menu.
            'qrUrl' => $qrUrl,
            'qr_url' => $qrUrl,
            // Keep raw fields for compatibility with existing consumers.
            'seats' => (int) $table->seats,
            'is_active' => (bool) $table->is_active,
            'qr_code' => $qrRaw,
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
        
        // Create table first to get ID
        $table = DiningTable::create([
            'name' => $validated['name'],
            'seats' => $seats,
            'status' => $validated['status'] ?? 'available',
            'is_active' => $validated['is_active'] ?? true,
            'qr_code' => $validated['qr_code'] ?? '', // Temporary, will update below
        ]);
        
        // Generate URL-based QR code for customer app
        if (empty($validated['qr_code'])) {
            $table->qr_code = $this->buildCustomerMenuUrl($table);
            $table->save();
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
