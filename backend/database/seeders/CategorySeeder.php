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
            ['name' => 'Coffee', 'slug' => 'coffee'],
            ['name' => 'Tea', 'slug' => 'tea'],
            ['name' => 'Smoothies', 'slug' => 'smoothies'],
            ['name' => 'Pastries', 'slug' => 'pastries'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name']]
            );
        }
    }
}
