<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\DifyService;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class CustomerMenuController extends Controller
{
    public function __construct(
        private readonly DifyService $difyService,
        private readonly TelegramService $telegramService,
    ) {
    }

    public function tableByToken(string $token): JsonResponse
    {
        $table = DiningTable::query()->where('qr_code', $token)->first();

        if (!$table) {
            return response()->json(['message' => 'QR Invalid'], 404);
        }

        if (!$table->is_active) {
            return response()->json(['message' => 'Table not available'], 422);
        }

        return response()->json([
            'id' => $table->id,
            'name' => $table->name,
            'seats' => $table->seats,
            'token' => $table->qr_code,
        ]);
    }

    public function products(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->with(['products' => function ($query): void {
                $query->where('is_available', true)
                    ->where('is_active', true)
                    ->orderBy('name');
            }])
            ->orderBy('name')
            ->get()
            ->map(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'products' => $category->products->map(function (Product $product) {
                        return [
                            'id' => $product->id,
                            'name' => $product->name,
                            'image' => $product->image,
                            'price_small' => (float) $product->price_small,
                            'price_medium' => (float) $product->price_medium,
                            'price_large' => (float) $product->price_large,
                        ];
                    })->values(),
                ];
            })
            ->filter(fn (array $group): bool => count($group['products']) > 0)
            ->values();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function placeOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_token' => ['required', 'string', 'max:191'],
            'payment_type' => ['required', Rule::in(['cash', 'khqr'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ]);

        $table = DiningTable::query()->where('qr_code', $validated['table_token'])->first();
        if (!$table) {
            return response()->json(['message' => 'QR Invalid'], 404);
        }

        if (!$table->is_active) {
            return response()->json(['message' => 'Table not available'], 422);
        }

        $order = DB::transaction(function () use ($validated, $table): Order {
            $nextQueue = (Order::query()->max('queue_number') ?? 0) + 1;

            $order = Order::query()->create([
                'table_id' => $table->id,
                'status' => 'pending',
                'payment_type' => $validated['payment_type'],
                'queue_number' => $nextQueue,
                'total_price' => 0,
            ]);

            $total = 0.0;
            foreach ($validated['items'] as $item) {
                $product = Product::query()->findOrFail((int) $item['product_id']);
                if (!$product->is_available || !$product->is_active) {
                    abort(422, "Product '{$product->name}' is not available");
                }

                $price = match ($item['size']) {
                    'small' => (float) $product->price_small,
                    'medium' => (float) $product->price_medium,
                    'large' => (float) $product->price_large,
                };

                $qty = (int) $item['qty'];
                $total += $price * $qty;

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'size' => $item['size'],
                    'qty' => $qty,
                    'price' => $price,
                ]);
            }

            $order->update(['total_price' => round($total, 2)]);

            return $order->fresh(['table']);
        });

        $order->load(['items.product']);
        $this->sendOrderTelegramAlert($order);

        return response()->json([
            'order_id' => $order->id,
            'queue_number' => $order->queue_number,
            'status' => $order->status,
            'table_name' => $order->table?->name,
            'total_price' => (float) $order->total_price,
            'payment_type' => $order->payment_type,
        ], 201);
    }

    public function orderStatus(Order $order): JsonResponse
    {
        $order->load(['table', 'items.product']);

        return response()->json([
            'id' => $order->id,
            'queue_number' => $order->queue_number,
            'status' => $order->status,
            'table_name' => $order->table?->name,
            'total_price' => (float) $order->total_price,
            'payment_type' => $order->payment_type,
            'items' => $order->items->map(function (OrderItem $item) {
                return [
                    'product_name' => $item->product?->name,
                    'size' => $item->size,
                    'qty' => $item->qty,
                    'price' => (float) $item->price,
                ];
            })->values(),
        ]);
    }

    private function sendOrderTelegramAlert(Order $order): void
    {
        $message = $this->buildOrderFallbackMessage($order);

        $aiMessage = $this->buildAiOrderMessage($order);
        if ($aiMessage !== null && $aiMessage !== '') {
            $message .= "\n\n🤖 AI Summary:\n" . $aiMessage;
        }

        if (mb_strlen($message) > 3900) {
            $message = mb_substr($message, 0, 3900) . "\n...";
        }

        $telegramResult = $this->telegramService->sendMessage($message);
        if (!($telegramResult['success'] ?? false)) {
            Log::warning('Unable to send Telegram order alert', [
                'order_id' => $order->id,
                'error' => $telegramResult['error'] ?? 'Unknown Telegram error',
            ]);
        }
    }

    private function buildAiOrderMessage(Order $order): ?string
    {
        $tableName = $order->table?->name ?? 'Takeaway';
        $items = $order->items->map(function (OrderItem $item) {
            return [
                'name' => (string) ($item->product?->name ?? 'Unknown item'),
                'size' => (string) $item->size,
                'qty' => (int) $item->qty,
                'price' => (float) $item->price,
                'line_total' => (float) $item->price * (int) $item->qty,
            ];
        })->values()->all();

        $query = "Create a concise AI summary for a coffee order alert. "
            . "Use 1-2 short lines only, no markdown, no bullets, no greeting. "
            . "Mention urgency and one operational suggestion for staff. "
            . "Order details: queue #{$order->queue_number}, table {$tableName}, payment {$order->payment_type}, "
            . "total $".number_format((float) $order->total_price, 2).'.';

        $result = $this->difyService->chat($query, 'order-alert-bot', [
            'order_id' => (int) $order->id,
            'queue_number' => (int) $order->queue_number,
            'table_name' => $tableName,
            'payment_type' => (string) $order->payment_type,
            'status' => (string) $order->status,
            'total_price' => (float) $order->total_price,
            'items' => $items,
            'placed_at' => (string) $order->created_at,
        ]);

        if (!($result['success'] ?? false)) {
            Log::warning('Dify order alert generation failed', [
                'order_id' => $order->id,
                'error' => $result['error'] ?? 'Unknown Dify error',
            ]);

            return null;
        }

        $answer = trim((string) ($result['answer'] ?? ''));

        return $answer !== '' ? $answer : null;
    }

    private function buildOrderFallbackMessage(Order $order): string
    {
        $tableName = $order->table?->name ?? 'Takeaway';
        $itemsText = $order->items
            ->map(function (OrderItem $item) {
                $name = (string) ($item->product?->name ?? 'Unknown item');
                $size = ucfirst((string) $item->size);
                $qty = (int) $item->qty;
                $unitPrice = number_format((float) $item->price, 2);
                $lineTotal = number_format((float) $item->price * $qty, 2);

                return '- ' . $name . ' (' . $size . ') x' . $qty . '  @$' . $unitPrice . '  = $' . $lineTotal;
            })
            ->join("\n");

        return "🔔 [NEW COFFEE ORDER]\n"
            . "━━━━━━━━━━━━━━━━━━━━━━\n"
            . '🆔 Order ID   : '.$order->id."\n"
            . '🎟️ Queue      : #'.$order->queue_number."\n"
            . '🪑 Table      : '.$tableName."\n"
            . '💳 Payment    : '.strtoupper((string) $order->payment_type)."\n"
            . '📌 Status     : '.strtoupper((string) $order->status)."\n"
            . '🕒 Placed At  : '.$order->created_at?->format('Y-m-d H:i:s')."\n"
            . "━━━━━━━━━━━━━━━━━━━━━━\n"
            . "🧾 Items:\n"
            . ($itemsText !== '' ? $itemsText : '- No items found')
            . "\n━━━━━━━━━━━━━━━━━━━━━━\n"
            . '💰 Total      : $'.number_format((float) $order->total_price, 2);
    }
}
