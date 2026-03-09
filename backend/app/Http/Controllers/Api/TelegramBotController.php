<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Staff;
use App\Models\User;
use App\Services\DifyService;
use App\Services\TelegramService;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramBotController extends Controller
{
    public function __construct(
        private readonly DifyService $difyService,
        private readonly TelegramService $telegramService,
    ) {
    }

    public function webhook(Request $request): JsonResponse
    {
        $secret = trim((string) config('services.telegram.webhook_secret', ''));
        if ($secret !== '') {
            $provided = (string) $request->header('X-Telegram-Bot-Api-Secret-Token', '');
            if (!hash_equals($secret, $provided)) {
                return response()->json(['ok' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        $update = $request->all();
        $chatId = (string) data_get($update, 'message.chat.id', '');
        $text = trim((string) data_get($update, 'message.text', ''));

        if ($chatId === '' || $text === '') {
            return response()->json(['ok' => true, 'ignored' => 'No message text']);
        }

        $allowedChatIds = $this->getAllowedChatIds();
        if ($allowedChatIds !== [] && !in_array($chatId, $allowedChatIds, true)) {
            Log::warning('Telegram webhook message ignored from unauthorized chat', [
                'chat_id' => $chatId,
            ]);

            return response()->json(['ok' => true, 'ignored' => 'Unauthorized chat']);
        }

        $reply = $this->handleTelegramMessage($text, $chatId);
        $sent = $this->telegramService->sendMessage($reply, $chatId);

        if (!($sent['success'] ?? false)) {
            Log::warning('Failed to send Telegram webhook reply', [
                'chat_id' => $chatId,
                'error' => $sent['error'] ?? 'Unknown Telegram error',
            ]);
        }

        return response()->json([
            'ok' => true,
            'replied' => (bool) ($sent['success'] ?? false),
        ]);
    }

    /**
     * @return list<string>
     */
    private function getAllowedChatIds(): array
    {
        $chatIds = [];

        $single = trim((string) config('services.telegram.chat_id', ''));
        if ($single !== '') {
            $chatIds[] = $single;
        }

        $many = config('services.telegram.chat_ids', []);
        if (is_array($many)) {
            foreach ($many as $chatId) {
                $normalized = trim((string) $chatId);
                if ($normalized !== '') {
                    $chatIds[] = $normalized;
                }
            }
        }

        return array_values(array_unique($chatIds));
    }

    private function handleTelegramMessage(string $text, string $chatId): string
    {
        $normalized = trim($text);

        if ($normalized === '/start' || $normalized === '/help') {
            return $this->helpMessage();
        }

        if ($normalized === '/daily') {
            return $this->dailySummaryMessage($chatId);
        }

        if ($normalized === '/stock') {
            return $this->stockAlertMessage($chatId);
        }

        $question = str_starts_with($normalized, '/ask ')
            ? trim(substr($normalized, 5))
            : $normalized;

        if ($question === '' || $normalized === '/ask') {
            return 'Please send your question after /ask. Example: /ask What are today\'s top selling drinks?';
        }

        return $this->customAskMessage($question, $chatId);
    }

    private function helpMessage(): string
    {
        return "🤖 PREY LANG Coffee AI Bot\n"
            . "Commands:\n"
            . "/ask <question> - Ask AI manually\n"
            . "/daily - Daily AI summary\n"
            . "/stock - Low stock AI analysis\n"
            . "/help - Show commands\n\n"
            . "You can also send plain text directly, and I will treat it as /ask.";
    }

    private function dailySummaryMessage(string $chatId): string
    {
        $today = Carbon::today();
        $totalOrders = Order::query()->whereDate('created_at', $today)->count();
        $totalRevenue = (float) Order::query()->whereDate('created_at', $today)->where('status', 'completed')->sum('total_price');
        $totalExpenses = (float) Expense::query()->whereDate('date', $today)->sum('amount');
        $grossProfit = $totalRevenue - $totalExpenses;
        $lowStock = Ingredient::query()->whereColumn('stock_qty', '<=', 'min_stock')->count();

        $query = "Analyze today's coffee shop performance:\n"
            . "- Total Orders: {$totalOrders}\n"
            . "- Total Revenue: \${$totalRevenue}\n"
            . "- Total Expenses: \${$totalExpenses}\n"
            . "- Gross Profit: \${$grossProfit}\n"
            . "- Low Stock Ingredients: {$lowStock}\n"
            . '- Date: ' . $today->toDateString() . "\n\n"
            . 'Provide a brief summary, key findings, and recommended actions for the admin.';

        $result = $this->difyService->chat($query, 'telegram-' . $chatId, [
            'date' => $today->toDateString(),
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'gross_profit' => $grossProfit,
            'low_stock' => $lowStock,
        ]);

        if (!($result['success'] ?? false)) {
            return 'Unable to generate daily summary right now: ' . (string) ($result['error'] ?? 'Unknown error');
        }

        return $this->limitTelegramMessage(
            "📊 Daily Summary ({$today->toDateString()})\n"
            . "Orders: {$totalOrders}\n"
            . 'Revenue: $' . number_format($totalRevenue, 2) . "\n"
            . 'Expenses: $' . number_format($totalExpenses, 2) . "\n"
            . 'Profit: $' . number_format($grossProfit, 2) . "\n"
            . "Low Stock: {$lowStock}\n"
            . "━━━━━━━━━━━━━━━━━━━━━━\n"
            . trim((string) ($result['answer'] ?? ''))
        );
    }

    private function stockAlertMessage(string $chatId): string
    {
        $lowStockItems = Ingredient::query()
            ->whereColumn('stock_qty', '<=', 'min_stock')
            ->select('name', 'stock_qty', 'min_stock', 'unit')
            ->orderBy('stock_qty')
            ->limit(20)
            ->get();

        if ($lowStockItems->isEmpty()) {
            return '✅ Stock is healthy. No low stock items right now.';
        }

        $itemList = $lowStockItems
            ->map(fn (Ingredient $ingredient) => "- {$ingredient->name}: {$ingredient->stock_qty}{$ingredient->unit} (min {$ingredient->min_stock}{$ingredient->unit})")
            ->join("\n");

        $query = "These ingredients are low in stock:\n{$itemList}\n\nRecommend a purchase plan and urgency level for each item.";
        $result = $this->difyService->chat($query, 'telegram-' . $chatId, [
            'low_stock_items' => $lowStockItems->toArray(),
        ]);

        $analysis = $result['success'] ?? false
            ? (string) ($result['answer'] ?? '')
            : 'Unable to analyze stock alert right now.';

        return $this->limitTelegramMessage(
            "⚠️ Low Stock Alert\n"
            . "Count: {$lowStockItems->count()}\n"
            . "━━━━━━━━━━━━━━━━━━━━━━\n"
            . $analysis
        );
    }

    private function customAskMessage(string $question, string $chatId): string
    {
        $contextPayload = $this->buildAnalyticsContext();
        $groundedQuestion = $this->buildGroundedQuestion(
            $question,
            (array) ($contextPayload['analytics_context'] ?? []),
        );

        $result = $this->difyService->chat($groundedQuestion, 'telegram-' . $chatId, $contextPayload);
        if (!($result['success'] ?? false)) {
            return 'Unable to get AI response right now: ' . (string) ($result['error'] ?? 'Unknown error');
        }

        return $this->limitTelegramMessage("🤖 AI Answer\n━━━━━━━━━━━━━━━━━━━━━━\n" . trim((string) ($result['answer'] ?? '')));
    }

    private function limitTelegramMessage(string $message): string
    {
        if (mb_strlen($message) <= 3900) {
            return $message;
        }

        return mb_substr($message, 0, 3900) . "\n...";
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
