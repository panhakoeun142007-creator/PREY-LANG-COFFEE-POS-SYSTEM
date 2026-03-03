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
            ->pluck('id', 'slug')
            ->all();

        $products = [
            ['category' => 'coffee', 'name' => 'Espresso', 'price' => 3.00, 'badge' => 'HOT'],
            ['category' => 'coffee', 'name' => 'Americano', 'price' => 3.50, 'badge' => 'HOT'],
            ['category' => 'coffee', 'name' => 'Latte', 'price' => 4.25, 'badge' => 'HOT'],
            ['category' => 'coffee', 'name' => 'Cappuccino', 'price' => 4.00, 'badge' => 'HOT'],
            ['category' => 'coffee', 'name' => 'Iced Latte', 'price' => 4.50, 'badge' => 'ICED'],

            ['category' => 'tea', 'name' => 'Green Tea', 'price' => 3.00, 'badge' => 'HOT'],
            ['category' => 'tea', 'name' => 'Black Tea', 'price' => 3.00, 'badge' => 'HOT'],
            ['category' => 'tea', 'name' => 'Matcha Latte', 'price' => 5.00, 'badge' => 'POPULAR'],
            ['category' => 'tea', 'name' => 'Iced Tea', 'price' => 3.50, 'badge' => 'ICED'],

            ['category' => 'smoothies', 'name' => 'Berry Blast', 'price' => 5.50, 'badge' => 'FRESH'],
            ['category' => 'smoothies', 'name' => 'Mango Tango', 'price' => 5.25, 'badge' => 'FRESH'],
            ['category' => 'smoothies', 'name' => 'Banana Shake', 'price' => 4.75, 'badge' => 'CREAMY'],

            ['category' => 'pastries', 'name' => 'Croissant', 'price' => 3.50, 'badge' => 'FRESH'],
            ['category' => 'pastries', 'name' => 'Chocolate Croissant', 'price' => 3.75, 'badge' => 'FRESH'],
            ['category' => 'pastries', 'name' => 'Blueberry Muffin', 'price' => 3.25, 'badge' => 'FRESH'],
            ['category' => 'pastries', 'name' => 'Cinnamon Roll', 'price' => 4.00, 'badge' => 'HOT'],
        ];

        foreach ($products as $index => $item) {
            $categoryId = $categoryIds[$item['category']] ?? null;
            if (!$categoryId) {
                continue;
            }

            Product::query()->updateOrCreate(
                ['name' => $item['name'], 'category_id' => $categoryId],
                [
                    'price' => $item['price'],
                    'badge' => $item['badge'],
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}
