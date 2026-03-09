<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderHistorySummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_history_summary_uses_full_filtered_dataset_not_current_page_only(): void
    {
        // 25 completed orders x 10.00 = 250.00 total revenue
        for ($i = 1; $i <= 25; $i++) {
            Order::query()->create([
                'queue_number' => $i,
                'status' => 'completed',
                'total_price' => 10.00,
                'payment_type' => 'cash',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ]);
        }

        // 5 cancelled orders should not affect revenue.
        for ($i = 26; $i <= 30; $i++) {
            Order::query()->create([
                'queue_number' => $i,
                'status' => 'cancelled',
                'total_price' => 99.00,
                'payment_type' => 'khqr',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ]);
        }

        $response = $this->getJson('/api/orders/history?page=2');
        $response->assertOk();
        $response->assertJsonPath('current_page', 2);
        $response->assertJsonCount(10, 'data');
        $response->assertJsonPath('summary.completed_count', 25);
        $response->assertJsonPath('summary.cancelled_count', 5);
        $response->assertJsonPath('summary.total_revenue', 250);
    }

    public function test_history_summary_respects_status_filter(): void
    {
        Order::query()->create([
            'queue_number' => 1,
            'status' => 'completed',
            'total_price' => 20.00,
            'payment_type' => 'cash',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        Order::query()->create([
            'queue_number' => 2,
            'status' => 'cancelled',
            'total_price' => 30.00,
            'payment_type' => 'khqr',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/orders/history?status=cancelled');
        $response->assertOk();
        $response->assertJsonPath('summary.completed_count', 0);
        $response->assertJsonPath('summary.cancelled_count', 1);
        $response->assertJsonPath('summary.total_revenue', 0);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'cancelled');
    }

    public function test_history_search_finds_by_order_id_and_table_name(): void
    {
        $tableAlpha = DiningTable::query()->create([
            'name' => 'Alpha Zone',
            'seats' => 4,
            'status' => 'available',
            'is_active' => true,
            'qr_code' => 'QR-ALPHA',
        ]);

        $tableBeta = DiningTable::query()->create([
            'name' => 'Beta Corner',
            'seats' => 4,
            'status' => 'available',
            'is_active' => true,
            'qr_code' => 'QR-BETA',
        ]);

        $orderById = Order::query()->create([
            'table_id' => $tableAlpha->id,
            'queue_number' => 101,
            'status' => 'completed',
            'total_price' => 12.00,
            'payment_type' => 'cash',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        Order::query()->create([
            'table_id' => $tableBeta->id,
            'queue_number' => 202,
            'status' => 'completed',
            'total_price' => 15.00,
            'payment_type' => 'khqr',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        $searchByIdResponse = $this->getJson('/api/orders/history?search=' . $orderById->id);
        $searchByIdResponse->assertOk();
        $searchByIdResponse->assertJsonCount(1, 'data');
        $searchByIdResponse->assertJsonPath('data.0.id', $orderById->id);

        $searchByTableResponse = $this->getJson('/api/orders/history?search=beta');
        $searchByTableResponse->assertOk();
        $searchByTableResponse->assertJsonCount(1, 'data');
        $searchByTableResponse->assertJsonPath('data.0.table.name', 'Beta Corner');
    }
}
