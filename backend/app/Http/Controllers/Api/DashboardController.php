<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Ingredient;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get all dashboard statistics.
     */
    public function index(): JsonResponse
    {
        $today = now()->startOfDay();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        // Today's revenue
        $todayRevenue = Order::whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        // Today's orders count
        $todayOrders = Order::whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->count();

        // Low stock items (stock_qty <= min_stock)
        $lowStockCount = Ingredient::whereRaw('stock_qty <= min_stock')
            ->where('min_stock', '>', 0)
            ->count();

        // Monthly revenue
        $monthlyRevenue = Order::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        // Monthly expenses
        $monthlyExpenses = Expense::whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->sum('amount');

        // Monthly profit
        $monthlyProfit = $monthlyRevenue - $monthlyExpenses;

        // Revenue last 7 days
        $revenueData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $revenue = Order::whereDate('created_at', $date)
                ->where('status', '!=', 'cancelled')
                ->sum('total_price');
            
            $revenueData[] = [
                'name' => $date->format('D'),
                'revenue' => (float) $revenue,
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

        // Recent orders (last 10)
        $recentOrders = Order::with('table')
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

        // Low stock items with percentage
        $lowStockItems = Ingredient::whereRaw('stock_qty <= min_stock')
            ->where('min_stock', '>', 0)
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

        return response()->json([
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
            'revenueData' => $revenueData,
            'categoryData' => $categoryData,
            'recentOrders' => $recentOrders,
            'lowStockItems' => $lowStockItems,
            'notifications' => $this->getNotifications(),
        ]);
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
     * Generate notifications from database.
     */
    private function getNotifications(): array
    {
        $notifications = [];

        // New pending orders
        $pendingOrders = Order::where('status', 'pending')
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

        // Orders ready for pickup
        $readyOrders = Order::where('status', 'ready')
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

        // Low stock alerts
        $lowStockItems = Ingredient::whereRaw('stock_qty <= min_stock')
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

        // Near stock warnings (stock between 100% and 150% of min_stock)
        $nearStockItems = Ingredient::whereRaw('stock_qty > min_stock AND stock_qty <= (min_stock * 1.5)')
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
     * Get revenue trend compared to yesterday.
     */
    private function getTodayTrend(): string
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $todayRevenue = Order::whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        $yesterdayRevenue = Order::whereDate('created_at', $yesterday)
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        if ($yesterdayRevenue == 0) {
            return $todayRevenue > 0 ? '↑ New records' : 'No data';
        }

        $change = (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100;
        $direction = $change >= 0 ? '↑' : '↓';

        return $direction . ' ' . abs(round($change, 1)) . '%';
    }

    /**
     * Get orders trend compared to yesterday.
     */
    private function getOrdersTrend(): string
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $todayOrders = Order::whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->count();

        $yesterdayOrders = Order::whereDate('created_at', $yesterday)
            ->where('status', '!=', 'cancelled')
            ->count();

        if ($yesterdayOrders == 0) {
            return $todayOrders > 0 ? '↑ New records' : 'No data';
        }

        $change = (($todayOrders - $yesterdayOrders) / $yesterdayOrders) * 100;
        $direction = $change >= 0 ? '↑' : '↓';

        return $direction . ' ' . abs(round($change, 1)) . '%';
    }
}
