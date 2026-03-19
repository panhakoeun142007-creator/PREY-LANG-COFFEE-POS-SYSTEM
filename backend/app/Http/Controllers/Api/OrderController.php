<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Support\AppSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Cache TTL for live orders (30 seconds).
     */
    private const CACHE_TTL_LIVE = 5;

    /**
     * Cache TTL for order history (2 minutes).
     */
    private const CACHE_TTL_HISTORY = 120;

    /**
     * Display a listing of orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->with(['table', 'items.product'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->integer('table_id'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request): JsonResponse
    {
        $enabledPaymentTypes = array_keys(AppSettings::enabledPaymentTypes());
        if (count($enabledPaymentTypes) === 0) {
            // Fallback for misconfigured settings
            $enabledPaymentTypes = ['cash'];
        }

        $validated = $request->validate([
            'table_id' => ['required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['required', Rule::in($enabledPaymentTypes)],
            'queue_number' => ['nullable', 'integer', 'min:1'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $order = DB::transaction(function () use ($validated) {
            $nextQueue = Order::max('queue_number') ?? 0;
            $order = Order::create([
                'table_id' => $validated['table_id'],
                'status' => $validated['status'] ?? 'pending',
                'payment_type' => $validated['payment_type'],
                'queue_number' => $validated['queue_number'] ?? ($nextQueue + 1),
                'total_price' => 0,
            ]);

            // Pre-fetch all product prices in a single query to avoid N+1
            $productIds = array_column($validated['items'], 'product_id');
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            $total = 0;
            foreach ($validated['items'] as $item) {
                // Use provided price or get from pre-fetched product
                if (isset($item['price'])) {
                    $price = $item['price'];
                } else {
                    $product = $products->get($item['product_id']);
                    $price = match ($item['size']) {
                        'small' => (float) $product->price_small,
                        'medium' => (float) $product->price_medium,
                        'large' => (float) $product->price_large,
                    };
                }
                
                $total += ((float) $price * (int) $item['qty']);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'size' => $item['size'],
                    'qty' => $item['qty'],
                    'price' => $price,
                ]);
            }

            $settings = AppSettings::getMerged();
            $taxRate = (float) (($settings['payment']['tax_rate'] ?? 0));
            $taxAmount = round($total * ($taxRate / 100), 2);
            $computedTotal = round($total + $taxAmount, 2);

            $order->update([
                'total_price' => $validated['total_price'] ?? $computedTotal,
            ]);

            return $order->fresh()->load(['table', 'items.product']);
        });

        return response()->json($order, 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['table', 'items.product']));
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $enabledPaymentTypes = array_keys(AppSettings::enabledPaymentTypes());
        if (count($enabledPaymentTypes) === 0) {
            $enabledPaymentTypes = ['cash'];
        }

        $validated = $request->validate([
            'table_id' => ['sometimes', 'required', 'exists:dining_tables,id'],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_type' => ['sometimes', 'required', Rule::in($enabledPaymentTypes)],
            'queue_number' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'total_price' => ['sometimes', 'required', 'numeric', 'min:0'],
        ]);

        $order->update($validated);

        return response()->json($order->fresh()->load(['table', 'items.product']));
    }

    /**
     * Remove the specified order.
     */
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json(['message' => 'Order deleted']);
    }

    /**
     * Display live (active) orders.
     */
    public function live(): JsonResponse
    {
        // Cache live orders briefly to reduce database load
        $cacheKey = 'orders_live_' . now()->format('Y-m-d-H-i-s');
        
        $orders = Cache::remember($cacheKey, self::CACHE_TTL_LIVE, function () {
            return Order::query()
                ->with(['table', 'items.product'])
                ->whereIn('status', ['pending', 'preparing', 'ready'])
                ->orderBy('created_at', 'asc')
                ->get();
        });

        return response()->json($orders);
    }

    /**
     * Display order history (completed and cancelled orders).
     */
    public function history(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['table', 'items.product'])
            ->whereIn('status', ['completed', 'cancelled']);

        // Filter by status (completed or cancelled)
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to'));
        }

        // Filter by payment type
        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->string('payment_type'));
        }

        // Search by order ID or queue number
        if ($request->filled('search')) {
            $search = trim((string) $request->string('search'));
            $query->where(function ($q) use ($search) {
                if (ctype_digit($search)) {
                    $q->orWhere('id', (int) $search)
                        ->orWhere('queue_number', (int) $search);
                } else {
                    $q->orWhere('queue_number', 'like', "%{$search}%");
                }

                $q->orWhereHas('table', function ($tableQuery) use ($search) {
                    $tableQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Sorting
        $sortBy = $request->string('sort_by', 'created_at');
        $sortOrder = $request->string('sort_order', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'total_price', 'queue_number'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('created_at');
        }

        // Optimized summary calculation - single query with conditional counts
        $summaryBase = Order::query()
            ->whereIn('status', ['completed', 'cancelled']);
            
        // Apply same filters as main query
        if ($request->filled('status')) {
            $summaryBase->where('status', $request->string('status'));
        }
        if ($request->filled('date_from')) {
            $summaryBase->whereDate('created_at', '>=', $request->string('date_from'));
        }
        if ($request->filled('date_to')) {
            $summaryBase->whereDate('created_at', '<=', $request->string('date_to'));
        }
        if ($request->filled('payment_type')) {
            $summaryBase->where('payment_type', $request->string('payment_type'));
        }

        // Single query to get all summary stats
        $summaryStats = (clone $summaryBase)
            ->selectRaw('
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_count,
                SUM(CASE WHEN status = "completed" THEN total_price ELSE 0 END) as total_revenue
            ')
            ->first();

        $completedCount = (int) ($summaryStats->completed_count ?? 0);
        $cancelledCount = (int) ($summaryStats->cancelled_count ?? 0);
        $totalRevenue = round((float) ($summaryStats->total_revenue ?? 0), 2);

        $paginator = $query->paginate(20);
        $payload = $paginator->toArray();
        $payload['summary'] = [
            'completed_count' => $completedCount,
            'cancelled_count' => $cancelledCount,
            'total_revenue' => $totalRevenue,
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
        ]);

        $order->update(['status' => $validated['status']]);

        return response()->json($order->fresh()->load(['table', 'items.product']));
    }

    /**
     * Customer pickup confirmation (public).
     */
    public function pickup(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Order has been cancelled.'], 409);
        }

        if ($order->status === 'completed') {
            return response()->json($order->fresh()->load(['table', 'items.product']));
        }

        if ($order->status !== 'ready') {
            return response()->json(['message' => 'Order is not ready for pickup yet.'], 409);
        }

        $order->update(['status' => 'completed']);

        return response()->json($order->fresh()->load(['table', 'items.product']));
    }

    /**
     * Customer order status (public).
     */
    public function customerStatus(Order $order): JsonResponse
    {
        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'queue_number' => $order->queue_number,
            'table' => $order->table?->name,
            'updated_at' => $order->updated_at,
        ]);
    }
}
