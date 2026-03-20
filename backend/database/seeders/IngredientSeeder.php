<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Ingredient;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create ingredient categories - use existing product categories if they exist
        $coffeeCategory = Category::firstOrCreate(
            ['name' => 'Coffee'],
            ['description' => 'Premium coffee drinks', 'is_active' => true]
        );

        $teaCategory = Category::firstOrCreate(
            ['name' => 'Tea'],
            ['description' => 'Refreshing tea beverages', 'is_active' => true]
        );

        $dairyCategory = Category::firstOrCreate(
            ['name' => 'Dairy'],
            ['description' => 'Milk and dairy products', 'is_active' => true]
        );

        $syrupsCategory = Category::firstOrCreate(
            ['name' => 'Syrups'],
            ['description' => 'Flavor syrups', 'is_active' => true]
        );

        $pastriesCategory = Category::firstOrCreate(
            ['name' => 'Pastries'],
            ['description' => 'Fresh baked pastries', 'is_active' => true]
        );

        // Create ingredients
        $ingredients = [
            // Coffee ingredients
            ['name' => 'Coffee Beans', 'category_id' => $coffeeCategory->id, 'unit' => 'kg', 'stock_qty' => 25, 'min_stock' => 5, 'unit_cost' => 15.00],
            ['name' => 'Espresso Shot', 'category_id' => $coffeeCategory->id, 'unit' => 'pcs', 'stock_qty' => 1000, 'min_stock' => 100, 'unit_cost' => 0.50],
            
            // Tea ingredients
            ['name' => 'Green Tea Leaves', 'category_id' => $teaCategory->id, 'unit' => 'kg', 'stock_qty' => 10, 'min_stock' => 2, 'unit_cost' => 12.00],
            ['name' => 'Black Tea Leaves', 'category_id' => $teaCategory->id, 'unit' => 'kg', 'stock_qty' => 10, 'min_stock' => 2, 'unit_cost' => 10.00],
            ['name' => 'Matcha Powder', 'category_id' => $teaCategory->id, 'unit' => 'kg', 'stock_qty' => 5, 'min_stock' => 1, 'unit_cost' => 45.00],
            
            // Dairy
            ['name' => 'Whole Milk', 'category_id' => $dairyCategory->id, 'unit' => 'liter', 'stock_qty' => 50, 'min_stock' => 10, 'unit_cost' => 2.50],
            ['name' => 'Oat Milk', 'category_id' => $dairyCategory->id, 'unit' => 'liter', 'stock_qty' => 30, 'min_stock' => 5, 'unit_cost' => 4.00],
            ['name' => 'Almond Milk', 'category_id' => $dairyCategory->id, 'unit' => 'liter', 'stock_qty' => 25, 'min_stock' => 5, 'unit_cost' => 3.50],
            ['name' => 'Heavy Cream', 'category_id' => $dairyCategory->id, 'unit' => 'liter', 'stock_qty' => 20, 'min_stock' => 3, 'unit_cost' => 5.00],
            
            // Syrups
            ['name' => 'Vanilla Syrup', 'category_id' => $syrupsCategory->id, 'unit' => 'bottle', 'stock_qty' => 15, 'min_stock' => 3, 'unit_cost' => 8.00],
            ['name' => 'Caramel Syrup', 'category_id' => $syrupsCategory->id, 'unit' => 'bottle', 'stock_qty' => 12, 'min_stock' => 3, 'unit_cost' => 8.00],
            ['name' => 'Hazelnut Syrup', 'category_id' => $syrupsCategory->id, 'unit' => 'bottle', 'stock_qty' => 10, 'min_stock' => 2, 'unit_cost' => 9.00],
            ['name' => 'Chocolate Syrup', 'category_id' => $syrupsCategory->id, 'unit' => 'bottle', 'stock_qty' => 15, 'min_stock' => 3, 'unit_cost' => 7.00],
            
            // Bakery - use existing Pastries category
            ['name' => 'Croissant Dough', 'category_id' => $pastriesCategory->id, 'unit' => 'pcs', 'stock_qty' => 50, 'min_stock' => 10, 'unit_cost' => 2.00],
            ['name' => 'Muffin Batter', 'category_id' => $pastriesCategory->id, 'unit' => 'pcs', 'stock_qty' => 40, 'min_stock' => 8, 'unit_cost' => 1.50],
            ['name' => 'Bread Dough', 'category_id' => $pastriesCategory->id, 'unit' => 'pcs', 'stock_qty' => 30, 'min_stock' => 5, 'unit_cost' => 1.00],
        ];

        foreach ($ingredients as $ingredient) {
            Ingredient::updateOrCreate(
                ['name' => $ingredient['name']],
                $ingredient
            );
        }

        $this->command->info('Ingredients seeded successfully!');
    }
}
