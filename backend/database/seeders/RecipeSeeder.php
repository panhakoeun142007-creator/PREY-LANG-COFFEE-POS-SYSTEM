<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get products
        $cappuccino = Product::where('name', 'Cappuccino')->first();
        $americano = Product::where('name', 'Americano')->first();
        $latte = Product::where('name', 'Latte')->first();
        $mocha = Product::where('name', 'Mocha')->first();
        $greenTea = Product::where('name', 'Green Tea')->first();
        $matchaLatte = Product::where('name', 'Matcha Latte')->first();

        // Get ingredients
        $coffeeBeans = Ingredient::where('name', 'Coffee Beans')->first();
        $espressoShot = Ingredient::where('name', 'Espresso Shot')->first();
        $wholeMilk = Ingredient::where('name', 'Whole Milk')->first();
        $oatMilk = Ingredient::where('name', 'Oat Milk')->first();
        $vanillaSyrup = Ingredient::where('name', 'Vanilla Syrup')->first();
        $caramelSyrup = Ingredient::where('name', 'Caramel Syrup')->first();
        $chocolateSyrup = Ingredient::where('name', 'Chocolate Syrup')->first();
        $greenTeaLeaves = Ingredient::where('name', 'Green Tea Leaves')->first();
        $matchaPowder = Ingredient::where('name', 'Matcha Powder')->first();

        if ($cappuccino && $espressoShot && $wholeMilk) {
            // Cappuccino recipes
            Recipe::updateOrCreate([
                'product_id' => $cappuccino->id,
                'ingredient_id' => $espressoShot->id,
            ], [
                'amount_small' => 1,
                'amount_medium' => 2,
                'amount_large' => 3,
            ]);

            Recipe::updateOrCreate([
                'product_id' => $cappuccino->id,
                'ingredient_id' => $wholeMilk->id,
            ], [
                'amount_small' => 100,
                'amount_medium' => 150,
                'amount_large' => 200,
            ]);
        }

        if ($americano && $coffeeBeans) {
            // Americano recipes
            Recipe::updateOrCreate([
                'product_id' => $americano->id,
                'ingredient_id' => $coffeeBeans->id,
            ], [
                'amount_small' => 0.015,
                'amount_medium' => 0.02,
                'amount_large' => 0.025,
            ]);
        }

        if ($latte && $espressoShot && $wholeMilk && $vanillaSyrup) {
            // Latte recipes
            Recipe::updateOrCreate([
                'product_id' => $latte->id,
                'ingredient_id' => $espressoShot->id,
            ], [
                'amount_small' => 1,
                'amount_medium' => 2,
                'amount_large' => 3,
            ]);

            Recipe::updateOrCreate([
                'product_id' => $latte->id,
                'ingredient_id' => $wholeMilk->id,
            ], [
                'amount_small' => 150,
                'amount_medium' => 200,
                'amount_large' => 250,
            ]);

            Recipe::updateOrCreate([
                'product_id' => $latte->id,
                'ingredient_id' => $vanillaSyrup->id,
            ], [
                'amount_small' => 15,
                'amount_medium' => 20,
                'amount_large' => 30,
            ]);
        }

        if ($mocha && $espressoShot && $wholeMilk && $chocolateSyrup) {
            // Mocha recipes
            Recipe::updateOrCreate([
                'product_id' => $mocha->id,
                'ingredient_id' => $espressoShot->id,
            ], [
                'amount_small' => 1,
                'amount_medium' => 2,
                'amount_large' => 3,
            ]);

            Recipe::updateOrCreate([
                'product_id' => $mocha->id,
                'ingredient_id' => $wholeMilk->id,
            ], [
                'amount_small' => 150,
                'amount_medium' => 200,
                'amount_large' => 250,
            ]);

            Recipe::updateOrCreate([
                'product_id' => $mocha->id,
                'ingredient_id' => $chocolateSyrup->id,
            ], [
                'amount_small' => 20,
                'amount_medium' => 30,
                'amount_large' => 40,
            ]);
        }

        if ($greenTea && $greenTeaLeaves) {
            // Green Tea recipes
            Recipe::updateOrCreate([
                'product_id' => $greenTea->id,
                'ingredient_id' => $greenTeaLeaves->id,
            ], [
                'amount_small' => 2,
                'amount_medium' => 3,
                'amount_large' => 4,
            ]);
        }

        if ($matchaLatte && $matchaPowder && $oatMilk) {
            // Matcha Latte recipes
            Recipe::updateOrCreate([
                'product_id' => $matchaLatte->id,
                'ingredient_id' => $matchaPowder->id,
            ], [
                'amount_small' => 4,
                'amount_medium' => 6,
                'amount_large' => 8,
            ]);

            Recipe::updateOrCreate([
                'product_id' => $matchaLatte->id,
                'ingredient_id' => $oatMilk->id,
            ], [
                'amount_small' => 150,
                'amount_medium' => 200,
                'amount_large' => 250,
            ]);
        }

        $this->command->info('Recipes seeded successfully!');
    }
}
