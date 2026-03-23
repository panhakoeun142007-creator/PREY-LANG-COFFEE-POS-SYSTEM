<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Support\AppSettings;
use Illuminate\Http\JsonResponse;

class ReceiptController extends Controller
{
    /**
     * Display a listing of paid receipts.
     */
    public function index(Request $request): JsonResponse
    {
        // Get completed orders (paid receipts)
        $orders = Order::with('table')
            ->where('status', 'completed')
            ->whereNotNull('payment_type')
            ->orderBy('updated_at', 'desc')
            ->get();

        // Transform to receipt format
        $receipts = $orders->map(function ($order) {
            $paymentMethod = match ($order->payment_type) {
                'cash' => 'Cash',
                'khqr' => 'KHQR',
                'credit_card' => 'Credit Card',
                'aba_pay' => 'ABA Pay',
                'wing_money' => 'Wing Money',
                default => 'Other',
            };

            return [
                'receiptId' => 'RCP-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'orderId' => 'ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'table' => $order->table ? $order->table->name : 'N/A',
                'total' => (float) $order->total_price,
                'paymentMethod' => $paymentMethod,
                'paidAt' => $order->updated_at->toISOString(),
            ];
        });

        return response()->json([
            'receipts' => $receipts,
        ]);
    }

    /**
     * Show a single receipt (paid order) with full item details.
     */
    public function show(Order $order): JsonResponse
    {
        $this->ensureOrderIsReceipt($order);

        $settings = AppSettings::getMerged();
        $taxRate = (float) ($settings['payment']['tax_rate'] ?? 0);
        $receiptSettings = $settings['receipt'] ?? [];

        $order->load([
            'table:id,name',
            'items:id,order_id,product_id,size,qty,price',
            'items.product:id,category_id,name,image,price_small,price_medium,price_large,is_available',
            'actions:id,order_id,actor_type,actor_id,actor_name,action_type,from_status,to_status,description,created_at',
        ]);

        $subtotal = 0.0;
        $items = $order->items->map(function ($item) use (&$subtotal) {
            $qty = (int) ($item->qty ?? 0);
            $price = (float) ($item->price ?? 0);
            $lineTotal = round($qty * $price, 2);
            $subtotal += $lineTotal;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->product?->name,
                'size' => $item->size,
                'qty' => $qty,
                'price' => round($price, 2),
                'line_total' => $lineTotal,
                'product' => $item->product,
            ];
        })->values();

        $taxAmount = round($subtotal * ($taxRate / 100), 2);
        $computedTotal = round($subtotal + $taxAmount, 2);
        $total = round((float) $order->total_price, 2);

        $createdAction = $order->actions?->firstWhere('action_type', 'created');

        // Order actions are usually loaded newest-first in services, but here we rely on collection order from DB.
        // Normalize: determine "completed by" by scanning latest first.
        $completedBy = null;
        if ($order->relationLoaded('actions')) {
            $completedBy = $order->actions
                ->sortByDesc('created_at')
                ->first(function ($action) {
                    return ($action->action_type === 'status_changed' && $action->to_status === 'completed')
                        || $action->action_type === 'completed';
                });
        }

        return response()->json([
            'receipt' => [
                'receipt_id' => 'RCP-' . str_pad((string) $order->id, 5, '0', STR_PAD_LEFT),
                'order_id' => 'ORD-' . str_pad((string) ($order->queue_number ?? $order->id), 5, '0', STR_PAD_LEFT),
                'order' => [
                    'id' => $order->id,
                    'queue_number' => $order->queue_number,
                    'status' => $order->status,
                    'payment_type' => $order->payment_type,
                    'table' => $order->table,
                    'paid_at' => $order->updated_at?->toISOString(),
                    'created_at' => $order->created_at?->toISOString(),
                    'updated_at' => $order->updated_at?->toISOString(),
                ],
                'customer_label' => $order->table?->name ?? 'Walk-in',
                'source' => [
                    'created_by' => $createdAction ? [
                        'actor_type' => $createdAction->actor_type,
                        'actor_id' => $createdAction->actor_id,
                        'actor_name' => $createdAction->actor_name,
                    ] : null,
                    'completed_by' => $completedBy ? [
                        'actor_type' => $completedBy->actor_type,
                        'actor_id' => $completedBy->actor_id,
                        'actor_name' => $completedBy->actor_name,
                    ] : null,
                ],
                'items' => $items,
                'totals' => [
                    'subtotal' => round($subtotal, 2),
                    'tax_rate' => $taxRate,
                    'tax_amount' => $taxAmount,
                    'computed_total' => $computedTotal,
                    'total' => $total,
                ],
                'actions' => $order->actions,
                'receipt_settings' => [
                    'shop_name' => $receiptSettings['shop_name'] ?? 'Prey Lang Coffee',
                    'address' => $receiptSettings['address'] ?? '',
                    'phone' => $receiptSettings['phone'] ?? '',
                    'tax_id' => $receiptSettings['tax_id'] ?? '',
                    'footer_message' => $receiptSettings['footer_message'] ?? '',
                    'show_logo' => (bool) ($receiptSettings['show_logo'] ?? true),
                    'show_qr_payment' => (bool) ($receiptSettings['show_qr_payment'] ?? true),
                    'show_order_number' => (bool) ($receiptSettings['show_order_number'] ?? true),
                    'show_customer_name' => (bool) ($receiptSettings['show_customer_name'] ?? false),
                ],
            ],
        ]);
    }

    /**
     * Delete a receipt (paid order).
     *
     * Admin-only by routing.
     */
    public function destroy(Order $order): JsonResponse
    {
        $this->ensureOrderIsReceipt($order);

        $order->delete();

        return response()->json(['message' => 'Receipt deleted']);
    }

    private function ensureOrderIsReceipt(Order $order): void
    {
        if ($order->status !== 'completed' || empty($order->payment_type)) {
            abort(404, 'Receipt not found');
        }
    }
}
