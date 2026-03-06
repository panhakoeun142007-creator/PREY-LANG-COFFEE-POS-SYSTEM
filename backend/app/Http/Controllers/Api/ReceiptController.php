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
            return [
                'receiptId' => 'RCP-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'orderId' => 'ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'table' => $order->table ? $order->table->name : 'N/A',
                'total' => (float) $order->total_price,
                'paymentMethod' => $order->payment_type === 'cash' ? 'Cash' : ($order->payment_type === 'khqr' ? 'KHQR' : 'Other'),
                'paidAt' => $order->updated_at->toISOString(),
            ];
        });

        return response()->json([
            'receipts' => $receipts,
        ]);
    }
}
