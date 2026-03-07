<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\RecipeLog;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $orders = [
            [
                'table_no'       => 'Table A1',
                'status'         => 'Pending',
                'items'          => [
                    ['name' => 'Iced Latte', 'quantity' => 2, 'price' => 3.50, 'customization' => 'Extra shot'],
                    ['name' => 'Croissant', 'quantity' => 1, 'price' => 2.00],
                ],
                'time_elapsed'   => '5m',
                'customer_name'  => 'Sokha',
                'total'          => 9.00,
                'payment_method' => 'KHQR',
            ],
            [
                'table_no'       => 'Table B3',
                'status'         => 'Preparing',
                'items'          => [
                    ['name' => 'Cappuccino', 'quantity' => 1, 'price' => 3.00],
                    ['name' => 'Blueberry Muffin', 'quantity' => 2, 'price' => 2.50],
                ],
                'time_elapsed'   => '12m',
                'customer_name'  => 'Dara',
                'total'          => 8.00,
                'payment_method' => 'Cash',
            ],
            [
                'table_no'       => 'Table C2',
                'status'         => 'Ready',
                'items'          => [
                    ['name' => 'Espresso', 'quantity' => 3, 'price' => 2.50],
                ],
                'time_elapsed'   => '20m',
                'customer_name'  => 'Channary',
                'total'          => 7.50,
                'payment_method' => 'Card',
            ],
            [
                'table_no'       => 'Table A4',
                'status'         => 'Completed',
                'items'          => [
                    ['name' => 'Mocha', 'quantity' => 1, 'price' => 4.00],
                    ['name' => 'Chocolate Cake', 'quantity' => 1, 'price' => 3.50],
                ],
                'time_elapsed'   => '35m',
                'customer_name'  => 'Visal',
                'total'          => 7.50,
                'payment_method' => 'KHQR',
                'completed_at'   => now()->subMinutes(10),
            ],
            [
                'table_no'       => 'Table B1',
                'status'         => 'Cancelled',
                'items'          => [
                    ['name' => 'Green Tea Latte', 'quantity' => 1, 'price' => 3.50],
                ],
                'time_elapsed'   => '8m',
                'customer_name'  => 'Srey Pov',
                'total'          => 3.50,
                'payment_method' => 'Cash',
            ],
            [
                'table_no'       => 'Table D2',
                'status'         => 'Brewing',
                'items'          => [
                    ['name' => 'Cold Brew', 'quantity' => 2, 'price' => 4.00, 'customization' => 'Less ice'],
                    ['name' => 'Banana Bread', 'quantity' => 1, 'price' => 2.50],
                ],
                'time_elapsed'   => '15m',
                'customer_name'  => 'Panha',
                'total'          => 10.50,
                'payment_method' => 'KHQR',
            ],
        ];

        foreach ($orders as $orderData) {
            $order = Order::create($orderData);

            // Create a recipe log for each item in the order
            foreach ($order->items as $item) {
                RecipeLog::create([
                    'order_id' => $order->id,
                    'table_no' => $order->table_no,
                    'name'     => $item['name'],
                ]);
            }
        }
    }
}
