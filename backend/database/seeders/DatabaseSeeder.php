<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(UserSeeder::class);

        // Create categories
        $coffeeCategory = Category::create([
            'name' => 'Coffee',
            'description' => 'Premium coffee drinks',
            'is_active' => true,
        ]);

        $teaCategory = Category::create([
            'name' => 'Tea',
            'description' => 'Refreshing tea beverages',
            'is_active' => true,
        ]);

        $pastryCategory = Category::create([
            'name' => 'Pastries',
            'description' => 'Freshly baked pastries',
            'is_active' => true,
        ]);

        // Create products with size-based pricing
        $products = [
            // Coffee
            ['category_id' => $coffeeCategory->id, 'name' => 'Cappuccino', 'sku' => 'CAP-001', 'price_small' => 3.50, 'price_medium' => 4.50, 'price_large' => 5.50, 'stock_quantity' => 100],
            ['category_id' => $coffeeCategory->id, 'name' => 'Americano', 'sku' => 'AME-002', 'price_small' => 2.50, 'price_medium' => 3.50, 'price_large' => 4.50, 'stock_quantity' => 100],
            ['category_id' => $coffeeCategory->id, 'name' => 'Latte', 'sku' => 'LAT-003', 'price_small' => 4.00, 'price_medium' => 5.00, 'price_large' => 6.00, 'stock_quantity' => 100],
            ['category_id' => $coffeeCategory->id, 'name' => 'Mocha', 'sku' => 'MOC-004', 'price_small' => 4.50, 'price_medium' => 5.50, 'price_large' => 6.50, 'stock_quantity' => 100],
            ['category_id' => $coffeeCategory->id, 'name' => 'Caramel Macchiato', 'sku' => 'CM-005', 'price_small' => 4.50, 'price_medium' => 5.50, 'price_large' => 6.50, 'stock_quantity' => 100],
            ['category_id' => $coffeeCategory->id, 'name' => 'Espresso', 'sku' => 'ESP-006', 'price_small' => 2.00, 'price_medium' => 2.50, 'price_large' => 3.00, 'stock_quantity' => 100],
            // Tea
            ['category_id' => $teaCategory->id, 'name' => 'Green Tea', 'sku' => 'GT-001', 'price_small' => 2.00, 'price_medium' => 2.50, 'price_large' => 3.00, 'stock_quantity' => 80],
            ['category_id' => $teaCategory->id, 'name' => 'Iced Tea', 'sku' => 'IT-002', 'price_small' => 2.50, 'price_medium' => 3.50, 'price_large' => 4.50, 'stock_quantity' => 80],
            ['category_id' => $teaCategory->id, 'name' => 'Matcha Latte', 'sku' => 'ML-003', 'price_small' => 4.00, 'price_medium' => 5.00, 'price_large' => 6.00, 'stock_quantity' => 60],
            // Pastries
            ['category_id' => $pastryCategory->id, 'name' => 'Croissant', 'sku' => 'CRO-001', 'price_small' => 0, 'price_medium' => 3.50, 'price_large' => 0, 'stock_quantity' => 30],
            ['category_id' => $pastryCategory->id, 'name' => 'Blueberry Muffin', 'sku' => 'BM-002', 'price_small' => 0, 'price_medium' => 4.00, 'price_large' => 0, 'stock_quantity' => 25],
            ['category_id' => $pastryCategory->id, 'name' => 'Chocolate Croissant', 'sku' => 'CC-003', 'price_small' => 0, 'price_medium' => 4.00, 'price_large' => 0, 'stock_quantity' => 20],
            ['category_id' => $pastryCategory->id, 'name' => 'Avocado Toast', 'sku' => 'AT-004', 'price_small' => 0, 'price_medium' => 5.50, 'price_large' => 0, 'stock_quantity' => 15],
        ];

        foreach ($products as $product) {
            Product::create([
                'category_id' => $product['category_id'],
                'name' => $product['name'],
                'sku' => $product['sku'],
                'price_small' => $product['price_small'],
                'price_medium' => $product['price_medium'],
                'price_large' => $product['price_large'],
                'stock_quantity' => $product['stock_quantity'],
                'low_stock_threshold' => 5,
                'is_active' => true,
            ]);
        }
        
        // Get product IDs for order items
        $cappuccino = Product::where('sku', 'CAP-001')->first();
        $americano = Product::where('sku', 'AME-002')->first();
        $latte = Product::where('sku', 'LAT-003')->first();
        $mocha = Product::where('sku', 'MOC-004')->first();
        $macchiato = Product::where('sku', 'CM-005')->first();
        $matcha = Product::where('sku', 'ML-003')->first();
        $croissant = Product::where('sku', 'CRO-001')->first();
        $muffin = Product::where('sku', 'BM-002')->first();
        $chocoCroissant = Product::where('sku', 'CC-003')->first();
        $toast = Product::where('sku', 'AT-004')->first();

        // Create dining tables
        $tables = [];
        for ($i = 1; $i <= 10; $i++) {
            $tables[$i] = DiningTable::create([
                'name' => "Table $i",
                'seats' => $i <= 4 ? 2 : 4,
                'status' => 'available',
            ]);
        }
        // Add takeaway "table" (id = 0 in frontend logic)
        $takeaway = DiningTable::create([
            'name' => 'Takeaway',
            'seats' => 0,
            'status' => 'available',
        ]);

        // Create sample orders for Live Orders page
        $now = now();
        
        // Order 1 - Pending
        $order1 = Order::create([
            'table_id' => $tables[3]->id,
            'queue_number' => 108,
            'status' => 'pending',
            'total_price' => 12.50,
            'payment_type' => 'cash',
            'created_at' => $now->copy()->subMinutes(5),
            'updated_at' => $now->copy()->subMinutes(5),
        ]);
        OrderItem::create(['order_id' => $order1->id, 'product_id' => $cappuccino->id, 'size' => 'medium', 'qty' => 2, 'price' => 4.50]);
        OrderItem::create(['order_id' => $order1->id, 'product_id' => $croissant->id, 'size' => 'medium', 'qty' => 1, 'price' => 3.50]);

        // Order 2 - Preparing
        $order2 = Order::create([
            'table_id' => $tables[7]->id,
            'queue_number' => 107,
            'status' => 'preparing',
            'total_price' => 7.00,
            'payment_type' => 'khqr',
            'created_at' => $now->copy()->subMinutes(15),
            'updated_at' => $now->copy()->subMinutes(8),
        ]);
        OrderItem::create(['order_id' => $order2->id, 'product_id' => $americano->id, 'size' => 'large', 'qty' => 2, 'price' => 3.50]);

        // Order 3 - Ready
        $order3 = Order::create([
            'table_id' => $tables[1]->id,
            'queue_number' => 106,
            'status' => 'ready',
            'total_price' => 13.00,
            'payment_type' => 'cash',
            'created_at' => $now->copy()->subMinutes(25),
            'updated_at' => $now->copy()->subMinutes(3),
        ]);
        OrderItem::create(['order_id' => $order3->id, 'product_id' => $latte->id, 'size' => 'medium', 'qty' => 1, 'price' => 5.00]);
        OrderItem::create(['order_id' => $order3->id, 'product_id' => $muffin->id, 'size' => 'medium', 'qty' => 2, 'price' => 4.00]);

        // Order 4 - Pending (Takeaway)
        $order4 = Order::create([
            'table_id' => $takeaway->id,
            'queue_number' => 105,
            'status' => 'pending',
            'total_price' => 15.50,
            'payment_type' => 'cash',
            'created_at' => $now->copy()->subMinutes(8),
            'updated_at' => $now->copy()->subMinutes(8),
        ]);
        OrderItem::create(['order_id' => $order4->id, 'product_id' => $mocha->id, 'size' => 'medium', 'qty' => 1, 'price' => 5.50]);
        OrderItem::create(['order_id' => $order4->id, 'product_id' => $chocoCroissant->id, 'size' => 'medium', 'qty' => 2, 'price' => 5.00]);

        // Order 5 - Preparing
        $order5 = Order::create([
            'table_id' => $tables[5]->id,
            'queue_number' => 104,
            'status' => 'preparing',
            'total_price' => 18.25,
            'payment_type' => 'khqr',
            'created_at' => $now->copy()->subMinutes(18),
            'updated_at' => $now->copy()->subMinutes(10),
        ]);
        OrderItem::create(['order_id' => $order5->id, 'product_id' => $macchiato->id, 'size' => 'large', 'qty' => 1, 'price' => 6.50]);
        OrderItem::create(['order_id' => $order5->id, 'product_id' => $toast->id, 'size' => 'medium', 'qty' => 2, 'price' => 5.50]);

        // Order 6 - Ready
        $order6 = Order::create([
            'table_id' => $tables[2]->id,
            'queue_number' => 103,
            'status' => 'ready',
            'total_price' => 10.00,
            'payment_type' => 'cash',
            'created_at' => $now->copy()->subMinutes(35),
            'updated_at' => $now->copy()->subMinutes(5),
        ]);
        OrderItem::create(['order_id' => $order6->id, 'product_id' => $matcha->id, 'size' => 'medium', 'qty' => 2, 'price' => 5.00]);

        $this->command->info('Database seeded successfully!');
        $this->command->info('Categories: ' . Category::count());
        $this->command->info('Products: ' . Product::count());
        $this->command->info('Tables: ' . DiningTable::count());
        $this->command->info('Orders: ' . Order::count());
        $this->command->info('Order Items: ' . OrderItem::count());
    }
}
