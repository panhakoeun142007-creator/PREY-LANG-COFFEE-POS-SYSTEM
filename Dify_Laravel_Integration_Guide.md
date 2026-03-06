# PREY LANG Coffee POS — Dify Laravel Integration Guide

> Complete code reference for connecting Dify AI Agent API to your Laravel backend

---

## Quick Overview

| What | Detail |
|------|--------|
| Dify API Base URL | `https://api.dify.ai/v1` |
| Auth Header | `Authorization: Bearer app-xxxxxxxxxxxxxxxx` |
| Main Endpoint | `POST /chat-messages` |
| Response Mode | `blocking` or `streaming` |
| Laravel Version | Laravel 10+ recommended |
| Key Package | `Illuminate\Support\Facades\Http` (built-in) |

---

## 1. Environment Configuration

Add to your `.env` file:

```env
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DIFY_TIMEOUT=30
```

Add to `config/services.php`:

```php
'dify' => [
    'url'     => env('DIFY_API_URL', 'https://api.dify.ai/v1'),
    'key'     => env('DIFY_API_KEY'),
    'timeout' => env('DIFY_TIMEOUT', 30),
],
```

---

## 2. Create DifyService Class

Create file: `app/Services/DifyService.php`

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DifyService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected int $timeout;

    public function __construct()
    {
        $this->apiUrl  = config('services.dify.url');
        $this->apiKey  = config('services.dify.key');
        $this->timeout = config('services.dify.timeout', 30);
    }

    /**
     * Send a message to Dify agent and get a response
     */
    public function chat(string $query, string $userId = 'system', array $inputs = []): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type'  => 'application/json',
                ])
                ->post($this->apiUrl . '/chat-messages', [
                    'inputs'        => $inputs,
                    'query'         => $query,
                    'response_mode' => 'blocking',
                    'user'          => $userId,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'answer'  => $response->json('answer'),
                    'data'    => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error'   => $response->json('message') ?? 'Dify API error',
            ];

        } catch (\Exception $e) {
            Log::error('DifyService error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
```

---

## 3. Create AiAnalyticsController

Create file: `app/Http/Controllers/Api/AiAnalyticsController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DifyService;
use App\Models\Order;
use App\Models\Expense;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AiAnalyticsController extends Controller
{
    protected DifyService $dify;

    public function __construct(DifyService $dify)
    {
        $this->dify = $dify;
    }

    /**
     * Daily Summary Analysis
     * GET /api/ai/daily-summary
     */
    public function dailySummary(): \Illuminate\Http\JsonResponse
    {
        $today = Carbon::today();

        $totalOrders   = Order::whereDate('created_at', $today)->count();
        $totalRevenue  = Order::whereDate('created_at', $today)
                            ->where('status', 'completed')->sum('total_amount');
        $totalExpenses = Expense::whereDate('created_at', $today)->sum('amount');
        $grossProfit   = $totalRevenue - $totalExpenses;
        $lowStock      = Ingredient::whereColumn('stock_quantity', '<=', 'min_quantity')->count();

        $query = "Analyze today's coffee shop performance:
- Total Orders: {$totalOrders}
- Total Revenue: \${$totalRevenue}
- Total Expenses: \${$totalExpenses}
- Gross Profit: \${$grossProfit}
- Low Stock Ingredients: {$lowStock}
- Date: " . $today->toDateString() . "

Provide a brief summary, key findings, and recommended actions for the admin.";

        $result = $this->dify->chat($query, 'admin-system');

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json([
            'analysis' => $result['answer'],
            'data' => [
                'total_orders'   => $totalOrders,
                'total_revenue'  => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'gross_profit'   => $grossProfit,
                'low_stock'      => $lowStock,
            ],
        ]);
    }

    /**
     * Stock Alert Analysis
     * GET /api/ai/stock-alert
     */
    public function stockAlert(): \Illuminate\Http\JsonResponse
    {
        $lowStockItems = Ingredient::whereColumn('stock_quantity', '<=', 'min_quantity')
            ->select('name', 'stock_quantity', 'min_quantity', 'unit')
            ->get();

        if ($lowStockItems->isEmpty()) {
            return response()->json([
                'analysis' => 'All stock levels are healthy.',
                'items'    => [],
            ]);
        }

        $itemList = $lowStockItems->map(fn($i) =>
            "- {$i->name}: {$i->stock_quantity}{$i->unit} (min: {$i->min_quantity}{$i->unit})"
        )->join("\n");

        $query = "These ingredients are low in stock:\n{$itemList}\n\nRecommend a purchase plan and urgency level for each item.";

        $result = $this->dify->chat($query, 'admin-system');

        return response()->json([
            'analysis' => $result['success'] ? $result['answer'] : 'Unable to analyze',
            'items'    => $lowStockItems,
        ]);
    }

    /**
     * Ask AI a custom question
     * POST /api/ai/ask
     */
    public function ask(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['question' => 'required|string|max:500']);

        $result = $this->dify->chat(
            $request->input('question'),
            'user-' . auth()->id()
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json(['answer' => $result['answer']]);
    }
}
```

---

## 4. Register API Routes

Add to `backend/routes/api.php` inside your `admin.api` middleware group:

```php
use App\Http\Controllers\Api\AiAnalyticsController;

// AI Analytics Routes (Admin only)
Route::middleware('admin.api')->prefix('ai')->group(function () {
    Route::get('/daily-summary', [AiAnalyticsController::class, 'dailySummary']);
    Route::get('/stock-alert',   [AiAnalyticsController::class, 'stockAlert']);
    Route::post('/ask',          [AiAnalyticsController::class, 'ask']);
});
```

---

## 5. Frontend API Functions

Add to `frontend/src/services/api.ts`:

```typescript
// ---- AI Analytics ----

export async function fetchAiDailySummary() {
  const res = await safeFetch('/api/ai/daily-summary');
  return res.json();
}

export async function fetchAiStockAlert() {
  const res = await safeFetch('/api/ai/stock-alert');
  return res.json();
}

export async function askAiQuestion(question: string) {
  const res = await safeFetch('/api/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
  return res.json();
}
```

---

## 6. React AiInsights Component

Create: `frontend/src/components/AiInsights.tsx`

```tsx
import { useState } from 'react';
import { fetchAiDailySummary, askAiQuestion } from '../services/api';

export default function AiInsights() {
  const [summary, setSummary]   = useState<string>('');
  const [loading, setLoading]   = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');

  const loadSummary = async () => {
    setLoading(true);
    const data = await fetchAiDailySummary();
    setSummary(data.analysis);
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const data = await askAiQuestion(question);
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold mb-3">AI Insights</h2>

      <button onClick={loadSummary} disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-3">
        {loading ? 'Analyzing...' : 'Get Daily Summary'}
      </button>

      {summary && (
        <div className="bg-blue-50 p-3 rounded text-sm mb-4 whitespace-pre-wrap">
          {summary}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1 text-sm"
          placeholder="Ask the AI about your coffee shop..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <button onClick={handleAsk} disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm">
          Ask
        </button>
      </div>

      {answer && (
        <div className="bg-green-50 p-3 rounded text-sm mt-3 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Testing

### Test with cURL

```bash
# Daily summary
curl -X GET http://your-domain.com/api/ai/daily-summary \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Ask a question
curl -X POST http://your-domain.com/api/ai/ask \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What can a staff member access?"}'
```

### Expected Response

```json
{
  "analysis": "Today's performance shows 45 orders with $320 revenue...",
  "data": {
    "total_orders": 45,
    "total_revenue": 320.00,
    "total_expenses": 85.00,
    "gross_profit": 235.00,
    "low_stock": 2
  }
}
```

---

## 8. Integration Checklist

- [ ] Publish Dify agent (click Publish button in Dify)
- [ ] Copy API Key from Dify → API Access page
- [ ] Add `DIFY_API_KEY` to Laravel `.env`
- [ ] Add dify config to `config/services.php`
- [ ] Create `app/Services/DifyService.php`
- [ ] Create `AiAnalyticsController.php`
- [ ] Register routes in `api.php`
- [ ] Add API functions to `frontend/src/services/api.ts`
- [ ] Create `AiInsights.tsx` component
- [ ] Add `<AiInsights />` to your admin Dashboard page
- [ ] Test with cURL or Postman
- [ ] Fix Dify embedding model → change to `embedding-001`

---

> ⚠️ **Security:** Never expose your `DIFY_API_KEY` in frontend JavaScript.
> Always call Dify **through your Laravel backend** only.
> Frontend → Laravel API → Dify → the key stays on the server.
