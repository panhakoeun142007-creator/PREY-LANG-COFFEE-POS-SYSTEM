<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Ingredient;
use App\Models\Order;
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
     * Get all dashboard statistics.
     */
    public function index(): JsonResponse
    {
        // Try to get cached dashboard data
        $cacheKey = 'dashboard_' . now()->format('Y-m-d-H');
        
        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return $this->buildDashboardData();
        });

        // Always get fresh notifications (don't cache orders that may change)
        $data['notifications'] = $this->getNotifications();

        return response()->json($data);
    }

    /**
     * Build the cached dashboard data.
     */
    private function buildDashboardData(): array
    {
        $today = now()->startOfDay();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        // Use single query with conditional sums for today's stats
        $todayStats = Order::whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('SUM(total_price) as revenue, COUNT(*) as orders')
            ->first();

        $todayRevenue = (float) ($todayStats->revenue ?? 0);
        $todayOrders = (int) ($todayStats->orders ?? 0);

        // Low stock items count - single query
        $lowStockCount = Ingredient::whereColumn('stock_qty', '<=', 'min_stock')
            ->where('min_stock', '>', 0)
            ->count();

        // Monthly stats - single query
        $monthlyStats = Order::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('SUM(total_price) as revenue')
            ->first();

        $monthlyRevenue = (float) ($monthlyStats->revenue ?? 0);

        // Monthly expenses - single query
        $monthlyExpenses = Expense::whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->sum('amount');

        // Monthly profit
        $monthlyProfit = $monthlyRevenue - (float) $monthlyExpenses;

        // Revenue last 7 days - single query with group by
        $revenueData = Order::where('created_at', '>=', now()->subDays(7)->startOfDay())
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(function ($row) {
                return (float) $row->revenue;
            });

        // Build complete 7-day array
        $formattedRevenueData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $dateKey = $date->format('Y-m-d');
            $formattedRevenueData[] = [
                'name' => $date->format('D'),
                'revenue' => $revenueData->get($dateKey, 0),
            ];
        }

        // Orders by category (last 30 days) - optimized single query
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
            ->map(function ($category) {
                return [
                    'category' => $category->name,
                    'orders' => (int) $category->total_orders,
                ];
            });

        // Recent orders (last 10) - optimized with eager loading
        $recentOrders = Order::with('table:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                    'table' => $order->table?->name ?? 'Takeaway',
                    'total' => '$' . number_format($order->total_price, 2),
                    'status' => $order->status,
                ];
            });

        // Low stock items with percentage - optimized query
        $lowStockItems = Ingredient::whereColumn('stock_qty', '<=', 'min_stock')
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
                [
                    'label' => 'Total Revenue Today',
                    'value' => '$' . number_format($todayRevenue, 2),
                    'trend' => $this->getTodayTrend(),
                    'accent' => 'text-emerald-600',
                ],
                [
                    'label' => 'Total Orders Today',
                    'value' => $todayOrders,
                    'trend' => $this->getOrdersTrend(),
                    'accent' => 'text-emerald-600',
                ],
                [
                    'label' => 'Low Stock Items',
                    'value' => $lowStockCount,
                    'trend' => $lowStockCount > 0 ? 'Needs attention' : 'All good',
                    'accent' => $lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600',
                ],
                [
                    'label' => 'Monthly Profit',
                    'value' => '$' . number_format($monthlyProfit, 2),
                    'trend' => $monthlyProfit >= 0 ? 'Profit' : 'Loss',
                    'accent' => $monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
                ],
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
        return response()->json([
            'notifications' => $this->getNotifications(),
        ]);
    }

    /**
     * Generate notifications from database - optimized.
     */
    private function getNotifications(): array
    {
        $notifications = [];

        // Get pending orders - with table eager loading
        $pendingOrders = Order::with('table:id,name')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($pendingOrders as $order) {
            $notifications[] = [
                'id' => 'order-' . $order->id,
                'type' => 'order',
                'title' => 'New Order #' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'message' => ($order->table?->name ?? 'Takeaway') . ' - $' . number_format($order->total_price, 2),
                'time' => $order->created_at->diffForHumans(),
                'read' => false,
            ];
        }

        // Get ready orders - with table eager loading
        $readyOrders = Order::with('table:id,name')
            ->where('status', 'ready')
            ->orderBy('updated_at', 'desc')
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

        // Get low stock alerts - optimized query
        $lowStockItems = Ingredient::whereColumn('stock_qty', '<=', 'min_stock')
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

        // Near stock warnings - optimized query
        $nearStockItems = Ingredient::whereColumn('stock_qty', '>', 'min_stock')
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
     * Get revenue trend compared to yesterday - optimized.
     */
    private function getTodayTrend(): string
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        // Single query with conditional sum
        $revenues = Order::whereDate('created_at', $today)
            ->orWhereDate('created_at', $yesterday)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as revenue')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $todayRevenue = (float) ($revenues->get($today->format('Y-m-d'))?->revenue ?? 0);
        $yesterdayRevenue = (float) ($revenues->get($yesterday->format('Y-m-d'))?->revenue ?? 0);

        if ($yesterdayRevenue == 0) {
            return $todayRevenue > 0 ? '↑ New records' : 'No data';
        }

        $change = (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100;
        $direction = $change >= 0 ? '↑' : '↓';

        return $direction . ' ' . abs(round($change, 1)) . '%';
    }

    /**
     * Get orders trend compared to yesterday - optimized.
     */
    private function getOrdersTrend(): string
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        // Single query with conditional count
        $counts = Order::whereDate('created_at', $today)
            ->orWhereDate('created_at', $yesterday)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $todayOrders = (int) ($counts->get($today->format('Y-m-d'))?->orders ?? 0);
        $yesterdayOrders = (int) ($counts->get($yesterday->format('Y-m-d'))?->orders ?? 0);

        if ($yesterdayOrders == 0) {
            return $todayOrders > 0 ? '↑ New records' : 'No data';
        }

        $change = (($todayOrders - $yesterdayOrders) / $yesterdayOrders) * 100;
        $direction = $change >= 0 ? '↑' : '↓';

        return $direction . ' ' . abs(round($change, 1)) . '%';
    }

    /**
     * Clear dashboard cache (called when data changes).
     */
    public static function clearCache(): void
    {
        // Clear all hourly dashboard caches for today
        for ($hour = 0; $hour <= now()->hour; $hour++) {
            Cache::forget('dashboard_' . now()->format("Y-m-d-{$hour}"));
        }
    }
}
