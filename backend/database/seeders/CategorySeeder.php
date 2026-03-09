<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Coffee', 'description' => 'Various coffee beverages and espresso drinks'],
            ['name' => 'Tea', 'description' => 'Hot and cold tea selections'],
            ['name' => 'Smoothies', 'description' => 'Blended fruit and dairy drinks'],
            ['name' => 'Pastries', 'description' => 'Fresh baked goods and desserts'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['name' => $category['name']],
                ['description' => $category['description']]
            );
        }
    }
}
