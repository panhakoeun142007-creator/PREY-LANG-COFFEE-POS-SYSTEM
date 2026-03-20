<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RecipeLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $tableNames = ['Table A1', 'Table A4', 'Table B1', 'Table B3', 'Table C2', 'Table D2'];
        $tablesByName = [];

        foreach ($tableNames as $name) {
            $tablesByName[$name] = DiningTable::query()->updateOrCreate(
                ['name' => $name],
                ['seats' => 4, 'status' => 'available', 'is_active' => true]
            );
        }

        // Avoid duplicate order seed data but keep table setup available.
        if (Order::query()->exists()) {
            return;
        }

        $seedOrders = [
            [
                'table' => 'Table A1',
                'status' => 'pending',
                'payment_type' => 'khqr',
                'items' => [
                    ['name' => 'Iced Latte', 'size' => 'medium', 'qty' => 2],
                    ['name' => 'Croissant', 'size' => 'small', 'qty' => 1],
                ],
            ],
            [
                'table' => 'Table B3',
                'status' => 'preparing',
                'payment_type' => 'cash',
                'items' => [
                    ['name' => 'Cappuccino', 'size' => 'medium', 'qty' => 1],
                    ['name' => 'Blueberry Muffin', 'size' => 'small', 'qty' => 2],
                ],
            ],
            [
                'table' => 'Table C2',
                'status' => 'ready',
                'payment_type' => 'cash',
                'items' => [
                    ['name' => 'Espresso', 'size' => 'small', 'qty' => 3],
                ],
            ],
            [
                'table' => 'Table A4',
                'status' => 'completed',
                'payment_type' => 'khqr',
                'items' => [
                    ['name' => 'Mocha', 'size' => 'medium', 'qty' => 1],
                    ['name' => 'Croissant', 'size' => 'small', 'qty' => 1],
                ],
            ],
            [
                'table' => 'Table B1',
                'status' => 'cancelled',
                'payment_type' => 'cash',
                'items' => [
                    ['name' => 'Matcha Latte', 'size' => 'medium', 'qty' => 1],
                ],
            ],
            [
                'table' => 'Table D2',
                'status' => 'preparing',
                'payment_type' => 'khqr',
                'items' => [
                    ['name' => 'Americano', 'size' => 'large', 'qty' => 2],
                    ['name' => 'Cinnamon Roll', 'size' => 'small', 'qty' => 1],
                ],
            ],
        ];

        DB::transaction(function () use ($seedOrders, $tablesByName) {
            $queueNumber = (int) (Order::query()->max('queue_number') ?? 0);

            foreach ($seedOrders as $seed) {
                $tableName = $seed['table'];
                $table = $tablesByName[$tableName] ?? null;
                if (!$table) {
                    continue;
                }

                $queueNumber++;
                $order = Order::query()->create([
                    'table_id' => $table->id,
                    'status' => $seed['status'],
                    'payment_type' => $seed['payment_type'],
                    'queue_number' => $queueNumber,
                    'total_price' => 0,
                ]);

                $total = 0.0;
                foreach ($seed['items'] as $item) {
                    $product = Product::query()->where('name', $item['name'])->first();
                    if (!$product) {
                        continue;
                    }

                    $size = $item['size'];
                    $price = match ($size) {
                        'small' => (float) $product->price_small,
                        'medium' => (float) $product->price_medium,
                        'large' => (float) $product->price_large,
                        default => (float) $product->price_medium,
                    };

                    $qty = (int) $item['qty'];
                    $total += ($price * $qty);

                    OrderItem::query()->create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'size' => $size,
                        'qty' => $qty,
                        'price' => $price,
                    ]);

                    RecipeLog::query()->create([
                        'order_id' => $order->id,
                        'table_no' => $tableName,
                        'name' => $product->name,
                    ]);
                }

                $order->update(['total_price' => round($total, 2)]);
            }
        });
    }
}
