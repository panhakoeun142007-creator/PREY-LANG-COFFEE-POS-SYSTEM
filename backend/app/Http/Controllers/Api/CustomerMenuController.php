<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerMenuController extends Controller
{
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
}
