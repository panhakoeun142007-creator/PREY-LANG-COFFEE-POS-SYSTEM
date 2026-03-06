<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Staff;
use App\Models\User;
use App\Services\DifyService;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiAnalyticsController extends Controller
{
    public function __construct(private readonly DifyService $difyService)
    {
    }

    /**
     * Daily Summary Analysis
     */
    public function dailySummary(): JsonResponse
    {
        $today = Carbon::today();

        $totalOrders = Order::query()->whereDate('created_at', $today)->count();
        $totalRevenue = Order::query()
            ->whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('total_price');
        $totalExpenses = Expense::query()->whereDate('date', $today)->sum('amount');
        $grossProfit = (float) $totalRevenue - (float) $totalExpenses;
        $lowStock = Ingredient::query()->whereColumn('stock_qty', '<=', 'min_stock')->count();

        $query = "Analyze today's coffee shop performance:\n"
            . "- Total Orders: {$totalOrders}\n"
            . "- Total Revenue: \${$totalRevenue}\n"
            . "- Total Expenses: \${$totalExpenses}\n"
            . "- Gross Profit: \${$grossProfit}\n"
            . "- Low Stock Ingredients: {$lowStock}\n"
            . '- Date: '.$today->toDateString()."\n\n"
            . 'Provide a brief summary, key findings, and recommended actions for the admin.';

        $result = $this->difyService->chat($query, 'admin-system', [
            'date' => $today->toDateString(),
            'total_orders' => $totalOrders,
            'total_revenue' => (float) $totalRevenue,
            'total_expenses' => (float) $totalExpenses,
            'gross_profit' => $grossProfit,
            'low_stock' => $lowStock,
        ]);

        if (!$result['success']) {
            $message = $result['error'] ?? 'Unable to analyze daily summary';

            return response()->json([
                'message' => $message,
                'error' => $message,
            ], 500);
        }

        return response()->json([
            'analysis' => $result['answer'] ?? '',
            'data' => [
                'total_orders' => $totalOrders,
                'total_revenue' => (float) $totalRevenue,
                'total_expenses' => (float) $totalExpenses,
                'gross_profit' => $grossProfit,
                'low_stock' => $lowStock,
            ],
        ]);
    }

    /**
     * Stock Alert Analysis
     */
    public function stockAlert(): JsonResponse
    {
        $lowStockItems = Ingredient::query()
            ->whereColumn('stock_qty', '<=', 'min_stock')
            ->select('id', 'name', 'stock_qty', 'min_stock', 'unit')
            ->orderBy('stock_qty')
            ->get();

        if ($lowStockItems->isEmpty()) {
            return response()->json([
                'analysis' => 'All stock levels are healthy.',
                'items' => [],
            ]);
        }

        $itemList = $lowStockItems
            ->map(fn (Ingredient $ingredient) => "- {$ingredient->name}: {$ingredient->stock_qty}{$ingredient->unit} (min: {$ingredient->min_stock}{$ingredient->unit})")
            ->join("\n");

        $query = "These ingredients are low in stock:\n{$itemList}\n\n"
            . 'Recommend a purchase plan and urgency level for each item.';

        $result = $this->difyService->chat($query, 'admin-system', [
            'low_stock_items' => $lowStockItems->toArray(),
        ]);

        return response()->json([
            'analysis' => $result['success'] ? ($result['answer'] ?? '') : 'Unable to analyze stock alert right now.',
            'items' => $lowStockItems,
        ]);
    }

    /**
     * Ask AI a custom question
     */
    public function ask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:1000'],
            'inputs' => ['sometimes', 'array'],
        ]);

        $authUserId = Auth::id();
        $userId = $authUserId ? "user-{$authUserId}" : 'admin-system';
        $contextPayload = $this->buildAnalyticsContext();
        $groundedQuestion = $this->buildGroundedQuestion(
            $validated['question'],
            $contextPayload['analytics_context'] ?? [],
        );

        $result = $this->difyService->chat(
            $groundedQuestion,
            $userId,
            [
                ...((array) ($validated['inputs'] ?? [])),
                ...$contextPayload,
            ],
        );

        if (!$result['success']) {
            $message = $result['error'] ?? 'Unable to get AI response';

            return response()->json([
                'message' => $message,
                'error' => $message,
            ], 500);
        }

        return response()->json([
            'answer' => $result['answer'] ?? '',
            'data' => $result['data'] ?? [],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAnalyticsContext(): array
    {
        $today = Carbon::today();
        $startOfWeek = $today->copy()->startOfWeek(CarbonInterface::MONDAY);
        $endOfWeek = $today->copy()->endOfWeek(CarbonInterface::SUNDAY);
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth = $today->copy()->endOfMonth();

        $todayRevenue = (float) Order::query()
            ->whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('total_price');
        $todayOrders = Order::query()->whereDate('created_at', $today)->count();
        $todayExpenses = (float) Expense::query()->whereDate('date', $today)->sum('amount');

        $weekRevenue = (float) Order::query()
            ->whereBetween('created_at', [$startOfWeek->startOfDay(), $endOfWeek->endOfDay()])
            ->where('status', 'completed')
            ->sum('total_price');
        $weekOrders = Order::query()
            ->whereBetween('created_at', [$startOfWeek->startOfDay(), $endOfWeek->endOfDay()])
            ->count();
        $weekExpenses = (float) Expense::query()
            ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->sum('amount');

        $monthRevenue = (float) Order::query()
            ->whereBetween('created_at', [$startOfMonth->startOfDay(), $endOfMonth->endOfDay()])
            ->where('status', 'completed')
            ->sum('total_price');
        $monthOrders = Order::query()
            ->whereBetween('created_at', [$startOfMonth->startOfDay(), $endOfMonth->endOfDay()])
            ->count();
        $monthExpenses = (float) Expense::query()
            ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->sum('amount');

        $staffCount = Staff::query()->count();
        $activeStaffCount = Staff::query()->where('is_active', true)->count();
        $adminUserCount = User::query()->where('role', 'admin')->count();
        $staffUserCount = User::query()->where('role', 'staff')->count();

        $recentCompletedOrders = Order::query()
            ->where('status', 'completed')
            ->latest('created_at')
            ->limit(5)
            ->get(['id', 'queue_number', 'payment_type', 'total_price', 'created_at'])
            ->map(fn (Order $order) => [
                'id' => (int) $order->id,
                'queue_number' => (int) $order->queue_number,
                'payment_type' => (string) ($order->payment_type ?? 'unknown'),
                'total_price' => (float) $order->total_price,
                'created_at' => (string) $order->created_at,
            ])
            ->values()
            ->all();

        $lowStockItems = Ingredient::query()
            ->whereColumn('stock_qty', '<=', 'min_stock')
            ->orderBy('stock_qty')
            ->limit(10)
            ->get(['name', 'stock_qty', 'min_stock', 'unit'])
            ->map(fn (Ingredient $ingredient) => [
                'name' => $ingredient->name,
                'stock_qty' => (float) $ingredient->stock_qty,
                'min_stock' => (float) $ingredient->min_stock,
                'unit' => $ingredient->unit,
            ])
            ->values()
            ->all();

        return [
            'analytics_context' => [
                'generated_at' => now()->toDateTimeString(),
                'today' => [
                    'date' => $today->toDateString(),
                    'orders' => $todayOrders,
                    'revenue' => $todayRevenue,
                    'expenses' => $todayExpenses,
                    'gross_profit' => $todayRevenue - $todayExpenses,
                ],
                'week' => [
                    'from' => $startOfWeek->toDateString(),
                    'to' => $endOfWeek->toDateString(),
                    'orders' => $weekOrders,
                    'revenue' => $weekRevenue,
                    'expenses' => $weekExpenses,
                    'gross_profit' => $weekRevenue - $weekExpenses,
                ],
                'month' => [
                    'from' => $startOfMonth->toDateString(),
                    'to' => $endOfMonth->toDateString(),
                    'orders' => $monthOrders,
                    'revenue' => $monthRevenue,
                    'expenses' => $monthExpenses,
                    'gross_profit' => $monthRevenue - $monthExpenses,
                ],
                'low_stock_items' => $lowStockItems,
                'recent_completed_orders' => $recentCompletedOrders,
                'system_capabilities' => [
                    'roles' => [
                        'admin' => 'Full management access including staff accounts, products, categories, tables, recipes, ingredients, expenses, purchases, analytics, receipts.',
                        'staff' => 'Operational access for live orders and order history only.',
                        'customer' => 'Public menu browsing and ordering without login.',
                    ],
                    'staff_management' => [
                        'allowed_role' => 'admin',
                        'frontend_route' => '/staff-management',
                        'frontend_component' => 'frontend/src/pages/admin/CustomerManagementPage/index.tsx',
                        'api_base' => '/api/staffs',
                        'endpoints' => ['GET /api/staffs', 'POST /api/staffs', 'PUT /api/staffs/{id}', 'DELETE /api/staffs/{id}'],
                        'counts' => [
                            'staff_records' => $staffCount,
                            'active_staff_records' => $activeStaffCount,
                            'staff_users' => $staffUserCount,
                            'admin_users' => $adminUserCount,
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $analyticsContext
     */
    private function buildGroundedQuestion(string $question, array $analyticsContext): string
    {
        $contextJson = json_encode($analyticsContext, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($contextJson) || $contextJson === '') {
            $contextJson = '{}';
        }

        return "You are an internal Coffee POS assistant for PREY LANG Coffee. "
            . "Use ONLY the provided POS context JSON below (analytics + system capabilities). "
            . "Do NOT ask for stock/company symbols and do NOT switch to external finance market analysis. "
            . "If user asks analytics, use real numeric values from context. "
            . "If user asks workflow/permissions (for example adding staff accounts), answer using system_capabilities in context. "
            . "If data is missing in context, state what is missing clearly.\n\n"
            . "POS_CONTEXT_JSON:\n{$contextJson}\n\n"
            . "USER_QUESTION:\n{$question}\n\n"
            . "Response format:\n"
            . "1) Direct answer\n2) Key data used\n3) Action steps.";
    }
}
