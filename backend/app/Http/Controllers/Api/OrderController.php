<?php

namespace App\Http\Controllers\Api;

use App\Models\DiningTable;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Order management controller.
 */
class OrderController extends BaseController
{
    private OrderService $orderService;

    public function __construct()
    {
        parent::__construct();
        $this->orderService = new OrderService();
    }

    /**
     * List orders with pagination and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->select($this->orderService->getOrderColumns())
            ->with($this->orderService->getOrderRelations())
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->integer('table_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Create new order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateOrderPayload($request, false);
        $order = $this->orderService->create($validated);
        
        $this->orderService->clearCache();

        return response()->json(
            Order::select($this->orderService->getOrderColumns())
                ->with($this->orderService->getOrderRelations())
                ->findOrFail($order->id),
            201
        );
    }

    /**
     * Create customer order with table fallback.
     */
    public function customerStore(Request $request): JsonResponse
    {
        $validated = $this->validateOrderPayload($request, true);
        $order = $this->orderService->create($validated);
        
        $this->orderService->clearCache();

        return response()->json(
            Order::select($this->orderService->getOrderColumns())
                ->with($this->orderService->getOrderRelations())
                ->findOrFail($order->id),
            201
        );
    }

    /**
     * Get single order.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load($this->orderService->getOrderRelations()));
    }

    /**
     * Update order.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $enabledPaymentTypes = array_keys($this->getEnabledPaymentTypes());
        
        $validated = $request->validate([
            'table_id' => ['sometimes', 'required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['sometimes', 'required', Rule::in($enabledPaymentTypes)],
            'queue_number' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'total_price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $order->update($validated);
        $this->orderService->clearCache();

        return response()->json($order->fresh()->load($this->orderService->getOrderRelations()));
    }

    /**
     * Delete order.
     */
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        $this->orderService->clearCache();

        return response()->json(['message' => 'Order deleted']);
    }

    /**
     * Get live orders (cached).
     */
    public function live(): JsonResponse
    {
        $orders = Cache::remember('orders_live_active', 5, function () {
            return Order::query()
                ->select($this->orderService->getOrderColumns())
                ->with($this->orderService->getOrderRelations())
                ->whereIn('status', ['pending', 'preparing', 'ready'])
                ->orderBy('created_at', 'asc')
                ->get();
        });

        return response()->json($orders);
    }

    /**
     * Get order history with filters.
     */
    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate($this->historyFilterRules());

        $query = Order::query()
            ->select($this->orderService->getOrderColumns())
            ->with($this->orderService->getOrderRelations())
            ->whereIn('status', ['completed', 'cancelled']);
        
        $this->applyHistoryFilters($query, $validated);

        // Sorting
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';
        $allowedSorts = ['created_at', 'updated_at', 'total_price', 'queue_number'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('created_at');
        }

        // Summary stats (separate query to avoid GROUP BY conflict)
        $summaryStats = Order::query()
            ->whereIn('status', ['completed', 'cancelled'])
            ->when($validated['date_from'] ?? null, fn($q, $v) => $q->where('created_at', '>=', $v))
            ->when($validated['date_to'] ?? null, fn($q, $v) => $q->where('created_at', '<=', $v . ' 23:59:59'))
            ->selectRaw('
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_count,
                SUM(CASE WHEN status = "completed" THEN total_price ELSE 0 END) as total_revenue
            ')
            ->first();

        $paginator = $query->paginate(20);
        $payload = $paginator->toArray();
        $payload['summary'] = [
            'completed_count' => (int) ($summaryStats->completed_count ?? 0),
            'cancelled_count' => (int) ($summaryStats->cancelled_count ?? 0),
            'total_revenue' => round((float) ($summaryStats->total_revenue ?? 0), 2),
        ];

        return response()->json($payload);
    }

    /**
     * Update order status.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'cancellation_message' => 'nullable|string|max:500',
        ]);

        $this->orderService->updateStatus($order, $validated['status']);
        
        // If cancelling, save the cancellation message
        if ($validated['status'] === 'cancelled' && !empty($validated['cancellation_message'])) {
            $order->cancellation_message = $validated['cancellation_message'];
            $order->save();
        }
        
        $this->orderService->clearCache();

        return response()->json($order->fresh()->load($this->orderService->getOrderRelations()));
    }

    /**
     * Customer pickup confirmation.
     */
    public function pickup(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Order has been cancelled.'], 409);
        }

        if ($order->status === 'completed') {
            return response()->json($order->fresh()->load($this->orderService->getOrderRelations()));
        }

        if ($order->status !== 'ready') {
            return response()->json(['message' => 'Order is not ready for pickup yet.'], 409);
        }

        $this->orderService->updateStatus($order, 'completed');
        $this->orderService->clearCache();

        return response()->json($order->fresh()->load($this->orderService->getOrderRelations()));
    }

    /**
     * Get customer order status (public).
     */
    public function customerStatus(Order $order): JsonResponse
    {
        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'queue_number' => $order->queue_number,
            'table' => $order->table?->name,
            'updated_at' => $order->updated_at,
            'cancellation_message' => $order->cancellation_message,
        ]);
    }

    // ==================== Private Helpers ====================

    private function getEnabledPaymentTypes(): array
    {
        $types = \App\Support\AppSettings::enabledPaymentTypes();
        return $types ?: ['cash' => true];
    }

    private function validateOrderPayload(Request $request, bool $allowCustomerFallback): array
    {
        $enabledPaymentTypes = array_keys($this->getEnabledPaymentTypes());

        $rules = [
            'table_id' => $allowCustomerFallback
                ? ['nullable', 'integer', 'min:1']
                : ['required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['required', Rule::in($enabledPaymentTypes)],
            'queue_number' => ['nullable', 'integer', 'min:1'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
        ];

        $validated = $request->validate($rules);

        // Table fallback for customers
        if ($allowCustomerFallback) {
            $tableId = $validated['table_id'] ?? null;
            
            if (!$tableId || !DiningTable::query()->whereKey($tableId)->exists()) {
                $fallbackId = $this->orderService->getFallbackTableId();
                
                if (!$fallbackId) {
                    throw ValidationException::withMessages([
                        'table_id' => 'No dining table is available for customer ordering.',
                    ]);
                }
                
                $validated['table_id'] = $fallbackId;
            }
        }

        return $validated;
    }

    private function applyHistoryFilters($query, array $filters): void
    {
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['payment_type'])) {
            $query->where('payment_type', $filters['payment_type']);
        }

        if (empty($filters['search'])) {
            return;
        }

        $search = trim((string) $filters['search']);
        $query->where(function ($q) use ($search) {
            if (ctype_digit($search)) {
                $q->where('id', (int) $search)
                    ->orWhere('queue_number', (int) $search);
            } else {
                $q->where('queue_number', 'like', "%{$search}%")
                    ->orWhereHas('table', fn ($t) => $t->where('name', 'like', "%{$search}%"));
            }
        });
    }

    private function historyFilterRules(): array
    {
        $enabledPaymentTypes = array_keys($this->getEnabledPaymentTypes());

        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['completed', 'cancelled'])],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date', 'after_or_equal:date_from'],
            'payment_type' => ['sometimes', Rule::in($enabledPaymentTypes)],
            'search' => ['sometimes', 'string', 'max:100'],
            'sort_by' => ['sometimes', Rule::in(['created_at', 'updated_at', 'total_price', 'queue_number'])],
            'sort_order' => ['sometimes', Rule::in(['asc', 'desc'])],
        ];
    }
}
