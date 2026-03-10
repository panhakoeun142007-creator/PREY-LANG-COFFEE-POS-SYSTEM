<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categoryIds = Category::query()
            ->pluck('id', 'name')
            ->all();

        $products = [
            // Coffee products
            ['category' => 'Coffee', 'name' => 'Espresso', 'price_small' => 3.00, 'price_medium' => 3.50, 'price_large' => 4.00],
            ['category' => 'Coffee', 'name' => 'Americano', 'price_small' => 3.50, 'price_medium' => 4.00, 'price_large' => 4.50],
            ['category' => 'Coffee', 'name' => 'Latte', 'price_small' => 4.25, 'price_medium' => 4.75, 'price_large' => 5.25],
            ['category' => 'Coffee', 'name' => 'Cappuccino', 'price_small' => 4.00, 'price_medium' => 4.50, 'price_large' => 5.00],
            ['category' => 'Coffee', 'name' => 'Iced Latte', 'price_small' => 4.50, 'price_medium' => 5.00, 'price_large' => 5.50],
            ['category' => 'Coffee', 'name' => 'Mocha', 'price_small' => 4.75, 'price_medium' => 5.25, 'price_large' => 5.75],

            // Tea products
            ['category' => 'Tea', 'name' => 'Green Tea', 'price_small' => 3.00, 'price_medium' => 3.50, 'price_large' => 4.00],
            ['category' => 'Tea', 'name' => 'Black Tea', 'price_small' => 3.00, 'price_medium' => 3.50, 'price_large' => 4.00],
            ['category' => 'Tea', 'name' => 'Matcha Latte', 'price_small' => 5.00, 'price_medium' => 5.50, 'price_large' => 6.00],
            ['category' => 'Tea', 'name' => 'Iced Tea', 'price_small' => 3.50, 'price_medium' => 4.00, 'price_large' => 4.50],

            // Smoothies
            ['category' => 'Smoothies', 'name' => 'Berry Blast', 'price_small' => 5.50, 'price_medium' => 6.00, 'price_large' => 6.50],
            ['category' => 'Smoothies', 'name' => 'Mango Tango', 'price_small' => 5.25, 'price_medium' => 5.75, 'price_large' => 6.25],
            ['category' => 'Smoothies', 'name' => 'Banana Shake', 'price_small' => 4.75, 'price_medium' => 5.25, 'price_large' => 5.75],

            // Pastries
            ['category' => 'Pastries', 'name' => 'Croissant', 'price_small' => 3.50, 'price_medium' => 3.50, 'price_large' => 3.50],
            ['category' => 'Pastries', 'name' => 'Chocolate Croissant', 'price_small' => 3.75, 'price_medium' => 3.75, 'price_large' => 3.75],
            ['category' => 'Pastries', 'name' => 'Blueberry Muffin', 'price_small' => 3.25, 'price_medium' => 3.25, 'price_large' => 3.25],
            ['category' => 'Pastries', 'name' => 'Cinnamon Roll', 'price_small' => 4.00, 'price_medium' => 4.00, 'price_large' => 4.00],
        ];

        foreach ($products as $index => $item) {
            $categoryId = $categoryIds[$item['category']] ?? null;
            if (!$categoryId) {
                continue;
            }

            Product::query()->updateOrCreate(
                ['name' => $item['name'], 'category_id' => $categoryId],
                [
                    'price_small' => $item['price_small'],
                    'price_medium' => $item['price_medium'],
                    'price_large' => $item['price_large'],
                    'is_available' => true,
                ]
            );
        }
    }
}
