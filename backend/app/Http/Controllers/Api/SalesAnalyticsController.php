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
        $startMonth = now()->startOfYear();

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

        // Aggregate order counts grouped by hour (6 AM – 5 PM) across all history
        $hourCounts = Order::query()
            ->selectRaw('HOUR(created_at) as hr, COUNT(*) as total')
            ->whereRaw('HOUR(created_at) BETWEEN 6 AND 17')
            ->where('status', '!=', 'cancelled')
            ->groupByRaw('HOUR(created_at)')
            ->pluck('total', 'hr')
            ->toArray();

        $hourRows = [];
        for ($hour = 6; $hour <= 17; $hour++) {
            $hourRows[] = [
                'hour' => Carbon::createFromTime($hour)->format('g A'),
                'orders' => (int) ($hourCounts[$hour] ?? 0),
            ];
        }

        return response()->json([
            'monthlyTrendData' => $monthRows,
            'peakHoursData' => $hourRows,
            'monthlyPerformanceData' => $monthRows,
        ]);
    }
}
