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
            ['name' => 'Coffee', 'description' => 'Premium coffee drinks'],
            ['name' => 'Tea', 'description' => 'Refreshing tea beverages'],
            ['name' => 'Smoothies', 'description' => 'Delicious fruit smoothies'],
            ['name' => 'Pastries', 'description' => 'Fresh baked pastries'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['name' => $category['name']],
                ['description' => $category['description'], 'is_active' => true]
            );
        }
    }
}
