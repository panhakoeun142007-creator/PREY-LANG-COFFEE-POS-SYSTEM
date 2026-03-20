<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerProductFeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_products_endpoint_returns_real_products(): void
    {
        $category = Category::query()->create([
            'name' => 'Coffee',
            'description' => 'Hot drinks',
            'quantity' => 1,
            'is_active' => true,
        ]);

        Product::query()->create([
            'category_id' => $category->id,
            'name' => 'Latte',
            'sku' => 'LATTE-001',
            'price_small' => 2.50,
            'price_medium' => 3.00,
            'price_large' => 3.50,
            'is_available' => true,
        ]);

        $response = $this->getJson('/api/customer/products');

        $response->assertOk();
        $response->assertJsonPath('data.0.name', 'Latte');
        $response->assertJsonPath('data.0.category.name', 'Coffee');
    }
}
