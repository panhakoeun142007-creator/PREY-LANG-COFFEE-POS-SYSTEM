<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::orderByDesc('created_at')->get();
        return response()->json($orders);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:Pending,Preparing,Brewing,Ready,Delayed,Completed,Cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->status = $request->input('status');

        if ($order->status === 'Completed' && !$order->completed_at) {
            $order->completed_at = now();
        }

        $order->save();

        return response()->json($order);
    }
}
