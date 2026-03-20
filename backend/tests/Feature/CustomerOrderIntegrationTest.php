<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerOrderIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_order_falls_back_to_first_active_table_when_requested_table_is_missing(): void
    {
        $category = Category::query()->create([
            'name' => 'Coffee',
            'description' => 'Coffee drinks',
            'quantity' => 1,
            'is_active' => true,
        ]);

        $product = Product::query()->create([
            'category_id' => $category->id,
            'name' => 'Mocha',
            'sku' => 'MOCHA-001',
            'price_small' => 2.50,
            'price_medium' => 3.00,
            'price_large' => 3.50,
            'is_available' => true,
        ]);

        $table = DiningTable::query()->create([
            'name' => 'Table B2',
            'seats' => 4,
            'status' => 'available',
            'is_active' => true,
            'qr_code' => 'QR-B2',
        ]);

        $response = $this->postJson('/api/customer/orders', [
            'table_id' => 9999,
            'payment_type' => 'cash',
            'total_price' => 3.00,
            'items' => [
                [
                    'product_id' => $product->id,
                    'size' => 'medium',
                    'qty' => 1,
                    'price' => 3.00,
                ],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('table_id', $table->id);
        $response->assertJsonPath('status', 'pending');
    }
}
