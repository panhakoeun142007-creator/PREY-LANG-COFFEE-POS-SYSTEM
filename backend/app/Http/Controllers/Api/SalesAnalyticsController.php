<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class SalesAnalyticsController extends Controller
{
    /**
     * Return sales analytics datasets for charts.
     */
    public function index(): JsonResponse
    {
        $monthRows = [];
        $startMonth = now()->startOfMonth()->subMonths(11);

        for ($i = 0; $i < 12; $i++) {
            $monthStart = (clone $startMonth)->addMonths($i)->startOfMonth();
            $monthEnd = (clone $monthStart)->endOfMonth();

            $sales = (float) Order::query()
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', '!=', 'cancelled')
                ->sum('total_price');

            $orders = Order::query()
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', '!=', 'cancelled')
                ->count();

            $monthRows[] = [
                'month' => $monthStart->format('M'),
                'sales' => round($sales, 2),
                'orders' => $orders,
            ];
        }

        $hourRows = [];
        $today = now()->startOfDay();
        for ($hour = 6; $hour <= 17; $hour++) {
            $hourLabel = Carbon::createFromTime($hour)->format('g A');
            $hourStart = (clone $today)->setTime($hour, 0, 0);
            $hourEnd = (clone $today)->setTime($hour, 59, 59);
            $orders = Order::query()
                ->whereBetween('created_at', [$hourStart, $hourEnd])
                ->where('status', '!=', 'cancelled')
                ->count();

            $hourRows[] = [
                'hour' => $hourLabel,
                'orders' => $orders,
            ];
        }

        return response()->json([
            'monthlyTrendData' => $monthRows,
            'peakHoursData' => $hourRows,
            'monthlyPerformanceData' => $monthRows,
        ]);
    }
}
