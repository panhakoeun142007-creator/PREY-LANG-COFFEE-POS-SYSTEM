<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Ingredient;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes).
     */
    private const CACHE_TTL = 300;

    /**
     * Cache TTL for notifications in seconds.
     */
    private const NOTIFICATIONS_CACHE_TTL = 15;

    /**
     * Get all dashboard statistics.
     */
    public function index(): JsonResponse
    {
        $cacheKey = 'dashboard_' . now()->format('Y-m-d-H');

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return $this->buildDashboardData();
        });

        return response()->json(array_merge($data, $this->getCachedNotificationPayload()));
    }

    /**
     * Build the cached dashboard data.
     */
    private function buildDashboardData(): array
    {
        $today = now()->startOfDay();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $todayStats = Order::query()
            ->whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('SUM(total_price) as revenue, COUNT(*) as orders')
            ->first();

        $todayRevenue = (float) ($todayStats->revenue ?? 0);
        $todayOrders = (int) ($todayStats->orders ?? 0);

        $lowStockCount = Ingredient::query()
            ->whereColumn('stock_qty', '<=', 'min_stock')
            ->where('min_stock', '>', 0)
            ->count();

        $monthlyStats = Order::query()
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('SUM(total_price) as revenue')
            ->first();

        $monthlyRevenue = (float) ($monthlyStats->revenue ?? 0);
        $monthlyExpenses = (float) Expense::query()
            ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->sum('amount');
        $monthlyProfit = $monthlyRevenue - $monthlyExpenses;

        $startOfWeek = now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $endOfWeek = now()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $revenueData = Order::query()
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn ($row) => (float) $row->revenue);

        $formattedRevenueData = [];
        for ($i = 0; $i <= 6; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $formattedRevenueData[] = [
                'name' => $date->format('D'),
                'revenue' => $revenueData->get($date->format('Y-m-d'), 0),
            ];
        }

        $thirtyDaysAgo = now()->subDays(30);
        $categoryData = DB::table('categories')
            ->leftJoin('products', 'categories.id', '=', 'products.category_id')
            ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('orders', function ($join) use ($thirtyDaysAgo) {
                $join->on('order_items.order_id', '=', 'orders.id')
                    ->where('orders.status', '!=', 'cancelled')
                    ->where('orders.created_at', '>=', $thirtyDaysAgo);
            })
            ->select('categories.id', 'categories.name')
            ->selectRaw('COUNT(order_items.id) as total_orders')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_orders')
            ->get()
            ->map(fn ($category) => [
                'category' => $category->name,
                'orders' => (int) $category->total_orders,
            ]);

        $recentOrders = Order::query()
            ->select(['id', 'table_id', 'total_price', 'status', 'created_at'])
            ->with('table:id,name')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($order) => [
                'id' => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'table' => $order->table?->name ?? 'Takeaway',
                'total' => '$' . number_format((float) $order->total_price, 2),
                'status' => $order->status,
            ]);

        $lowStockItems = Ingredient::query()
            ->select(['name', 'stock_qty', 'min_stock'])
            ->whereColumn('stock_qty', '<=', 'min_stock')
            ->where('min_stock', '>', 0)
            ->limit(10)
            ->get()
            ->map(function ($ingredient) {
                $level = $ingredient->min_stock > 0
                    ? ($ingredient->stock_qty / $ingredient->min_stock) * 100
                    : 0;

                return [
                    'name' => $ingredient->name,
                    'level' => min(100, round($level)),
                ];
            });

        return [
            'stats' => [
                ['label' => 'Total Revenue Today', 'value' => '$' . number_format($todayRevenue, 2), 'trend' => $this->getTodayTrend(), 'accent' => 'text-emerald-600'],
                ['label' => 'Total Orders Today', 'value' => $todayOrders, 'trend' => $this->getOrdersTrend(), 'accent' => 'text-emerald-600'],
                ['label' => 'Low Stock Items', 'value' => $lowStockCount, 'trend' => $lowStockCount > 0 ? 'Needs attention' : 'All good', 'accent' => $lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'],
                ['label' => 'Monthly Profit', 'value' => '$' . number_format($monthlyProfit, 2), 'trend' => $monthlyProfit >= 0 ? 'Profit' : 'Loss', 'accent' => $monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'],
            ],
            'revenueData' => $formattedRevenueData,
            'categoryData' => $categoryData,
            'recentOrders' => $recentOrders,
            'lowStockItems' => $lowStockItems,
        ];
    }

    /**
     * Get real-time notifications.
     */
    public function notifications(): JsonResponse
    {
        return response()->json($this->getCachedNotificationPayload());
    }

    /**
     * Generate notifications from database.
     */
    private function getNotifications(): array
    {
        $notifications = [];

        $pendingOrders = Order::query()
            ->select(['id', 'table_id', 'total_price', 'created_at'])
            ->with('table:id,name')
            ->where('status', 'pending')
            ->latest('created_at')
            ->limit(5)
            ->get();

        foreach ($pendingOrders as $order) {
            $notifications[] = [
                'id' => 'order-' . $order->id,
                'type' => 'order',
                'title' => 'New Order #' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'message' => ($order->table?->name ?? 'Takeaway') . ' - $' . number_format((float) $order->total_price, 2),
                'time' => $order->created_at->diffForHumans(),
                'read' => false,
            ];
        }

        $readyOrders = Order::query()
            ->select(['id', 'table_id', 'updated_at'])
            ->with('table:id,name')
            ->where('status', 'ready')
            ->latest('updated_at')
            ->limit(3)
            ->get();

        foreach ($readyOrders as $order) {
            $notifications[] = [
                'id' => 'ready-' . $order->id,
                'type' => 'ready',
                'title' => 'Order Ready!',
                'message' => '#' . str_pad($order->id, 4, '0', STR_PAD_LEFT) . ' from ' . ($order->table?->name ?? 'Takeaway'),
                'time' => $order->updated_at->diffForHumans(),
                'read' => false,
            ];
        }

        $lowStockItems = Ingredient::query()
            ->select(['id', 'name', 'stock_qty', 'unit', 'updated_at'])
            ->whereColumn('stock_qty', '<=', 'min_stock')
            ->where('min_stock', '>', 0)
            ->limit(3)
            ->get();

        foreach ($lowStockItems as $item) {
            $notifications[] = [
                'id' => 'stock-' . $item->id,
                'type' => 'stock',
                'title' => 'Low Stock Alert',
                'message' => $item->name . ' is running low (' . $item->stock_qty . ' ' . $item->unit . ' left)',
                'time' => $item->updated_at->diffForHumans(),
                'read' => false,
            ];
        }

        $nearStockItems = Ingredient::query()
            ->select(['id', 'name', 'stock_qty', 'unit', 'updated_at'])
            ->whereColumn('stock_qty', '>', 'min_stock')
            ->whereColumn('stock_qty', '<=', DB::raw('min_stock * 1.5'))
            ->where('min_stock', '>', 0)
            ->limit(3)
            ->get();

        foreach ($nearStockItems as $item) {
            $notifications[] = [
                'id' => 'near-stock-' . $item->id,
                'type' => 'near_stock',
                'title' => 'Near Stock Warning',
                'message' => $item->name . ' is getting low (' . $item->stock_qty . ' ' . $item->unit . ' left)',
                'time' => $item->updated_at->diffForHumans(),
                'read' => false,
            ];
        }

        return $notifications;
    }

    /**
     * Get the total count of unread notifications.
     */
    private function getNotificationCount(): int
    {
        $orderCounts = Order::query()
            ->whereIn('status', ['pending', 'ready'])
            ->selectRaw('
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = "ready" THEN 1 ELSE 0 END) as ready_count
            ')
            ->first();

        $ingredientCounts = Ingredient::query()
            ->where('min_stock', '>', 0)
            ->selectRaw('
                SUM(CASE WHEN stock_qty <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN stock_qty > min_stock AND stock_qty <= min_stock * 1.5 THEN 1 ELSE 0 END) as near_stock_count
            ')
            ->first();

        return (int) ($orderCounts->pending_count ?? 0)
            + (int) ($orderCounts->ready_count ?? 0)
            + (int) ($ingredientCounts->low_stock_count ?? 0)
            + (int) ($ingredientCounts->near_stock_count ?? 0);
    }

    /**
     * Get revenue trend compared to yesterday.
     */
    private function getTodayTrend(): string
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $revenues = Order::query()
            ->whereBetween('created_at', [$yesterday, now()->endOfDay()])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as revenue')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $todayRevenue = (float) ($revenues->get($today->format('Y-m-d'))?->revenue ?? 0);
        $yesterdayRevenue = (float) ($revenues->get($yesterday->format('Y-m-d'))?->revenue ?? 0);

        if ($yesterdayRevenue == 0) {
            return $todayRevenue > 0 ? 'Up from zero' : 'No data';
        }

        $change = (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100;

        return ($change >= 0 ? 'Up ' : 'Down ') . abs(round($change, 1)) . '%';
    }

    /**
     * Get orders trend compared to yesterday.
     */
    private function getOrdersTrend(): string
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $counts = Order::query()
            ->whereBetween('created_at', [$yesterday, now()->endOfDay()])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $todayOrders = (int) ($counts->get($today->format('Y-m-d'))?->orders ?? 0);
        $yesterdayOrders = (int) ($counts->get($yesterday->format('Y-m-d'))?->orders ?? 0);

        if ($yesterdayOrders == 0) {
            return $todayOrders > 0 ? 'Up from zero' : 'No data';
        }

        $change = (($todayOrders - $yesterdayOrders) / $yesterdayOrders) * 100;

        return ($change >= 0 ? 'Up ' : 'Down ') . abs(round($change, 1)) . '%';
    }

    /**
     * Clear dashboard cache (called when data changes).
     */
    public static function clearCache(): void
    {
        Cache::forget('dashboard_notifications');

        for ($hour = 0; $hour <= now()->hour; $hour++) {
            Cache::forget('dashboard_' . now()->format('Y-m-d-') . sprintf('%02d', $hour));
        }
    }

    private function getCachedNotificationPayload(): array
    {
        return Cache::remember('dashboard_notifications', self::NOTIFICATIONS_CACHE_TTL, function () {
            return [
                'notifications' => $this->getNotifications(),
                'notification_count' => $this->getNotificationCount(),
            ];
        });
    }
}
