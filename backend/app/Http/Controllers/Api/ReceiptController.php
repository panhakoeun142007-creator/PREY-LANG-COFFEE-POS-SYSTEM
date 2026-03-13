<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

class ReceiptController extends Controller
{
    /**
     * Display a listing of paid receipts.
     */
    public function index(Request $request)
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
}
