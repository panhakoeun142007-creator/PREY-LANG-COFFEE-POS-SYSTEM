<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OrderHistorySummaryTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(): array
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = 'test-admin-token';
        Cache::put("api_auth_token:{$token}", $admin->id, now()->addHours(1));

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_history_summary_uses_full_filtered_dataset_not_current_page_only(): void
    {
        $headers = $this->authHeader();

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

        $response = $this->withHeaders($headers)->getJson('/api/orders/history?page=2');
        $response->assertOk();
        $response->assertJsonPath('current_page', 2);
        $response->assertJsonCount(10, 'data');
        $response->assertJsonPath('summary.completed_count', 25);
        $response->assertJsonPath('summary.cancelled_count', 5);
        $response->assertJsonPath('summary.total_revenue', 250);
    }

    public function test_history_summary_respects_status_filter(): void
    {
        $headers = $this->authHeader();

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

        $response = $this->withHeaders($headers)->getJson('/api/orders/history?status=cancelled');
        $response->assertOk();
        $response->assertJsonPath('summary.completed_count', 0);
        $response->assertJsonPath('summary.cancelled_count', 1);
        $response->assertJsonPath('summary.total_revenue', 0);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'cancelled');
    }

    public function test_history_search_finds_by_order_id_and_table_name(): void
    {
        $headers = $this->authHeader();

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

        $searchByIdResponse = $this->withHeaders($headers)->getJson('/api/orders/history?search=' . $orderById->id);
        $searchByIdResponse->assertOk();
        $searchByIdResponse->assertJsonCount(1, 'data');
        $searchByIdResponse->assertJsonPath('data.0.id', $orderById->id);

        $searchByTableResponse = $this->withHeaders($headers)->getJson('/api/orders/history?search=beta');
        $searchByTableResponse->assertOk();
        $searchByTableResponse->assertJsonCount(1, 'data');
        $searchByTableResponse->assertJsonPath('data.0.table.name', 'Beta Corner');
    }

    public function test_history_filters_by_payment_type_and_date_range(): void
    {
        $headers = $this->authHeader();

        $oldCompleted = Order::query()->create([
            'queue_number' => 1,
            'status' => 'completed',
            'total_price' => 11.00,
            'payment_type' => 'cash',
        ]);
        $oldCompleted->forceFill([
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(5),
        ])->save();

        $matchingOrder = Order::query()->create([
            'queue_number' => 2,
            'status' => 'completed',
            'total_price' => 22.00,
            'payment_type' => 'khqr',
        ]);
        $matchingOrder->forceFill([
            'created_at' => now()->subDays(1),
            'updated_at' => now()->subDays(1),
        ])->save();

        $oldCancelled = Order::query()->create([
            'queue_number' => 3,
            'status' => 'cancelled',
            'total_price' => 33.00,
            'payment_type' => 'khqr',
        ]);
        $oldCancelled->forceFill([
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ])->save();

        $dateFrom = now()->subDays(2)->toDateString();
        $dateTo = now()->toDateString();

        $response = $this->withHeaders($headers)->getJson(
            "/api/orders/history?payment_type=khqr&date_from={$dateFrom}&date_to={$dateTo}"
        );

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $matchingOrder->id);
        $response->assertJsonPath('summary.completed_count', 1);
        $response->assertJsonPath('summary.cancelled_count', 0);
        $response->assertJsonPath('summary.total_revenue', 22);
    }

    public function test_updating_order_status_moves_order_from_live_to_history(): void
    {
        $headers = $this->authHeader();

        $order = Order::query()->create([
            'queue_number' => 55,
            'status' => 'ready',
            'total_price' => 18.50,
            'payment_type' => 'cash',
            'created_at' => now()->subMinutes(30),
            'updated_at' => now()->subMinutes(30),
        ]);

        $this->withHeaders($headers)
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('status', 'completed');

        $this->withHeaders($headers)
            ->getJson('/api/orders/live')
            ->assertOk()
            ->assertJsonMissing(['id' => $order->id]);

        $this->withHeaders($headers)
            ->getJson('/api/orders/history?status=completed')
            ->assertOk()
            ->assertJsonFragment(['id' => $order->id, 'status' => 'completed']);
    }

    public function test_history_rejects_invalid_filters(): void
    {
        $headers = $this->authHeader();

        $this->withHeaders($headers)
            ->getJson('/api/orders/history?status=pending&date_from=2026-03-20&date_to=2026-03-19')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status', 'date_to']);
    }

    public function test_admin_history_includes_staff_action_timeline(): void
    {
        $adminHeaders = $this->authHeader();

        $staff = Staff::query()->create([
            'name' => 'Staff Timeline',
            'email' => 'staff.timeline@example.com',
            'password' => 'staff123',
            'password_plain' => 'staff123',
            'salary' => 200,
            'is_active' => true,
        ]);

        $staffToken = 'test-staff-token';
        Cache::put("api_auth_token:{$staffToken}", [
            'subject_type' => 'staff',
            'subject_id' => $staff->id,
        ], now()->addHours(1));

        $order = Order::query()->create([
            'queue_number' => 77,
            'status' => 'ready',
            'total_price' => 25.00,
            'payment_type' => 'cash',
        ]);

        $this->withHeaders(['Authorization' => "Bearer {$staffToken}"])
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertOk();

        $response = $this->withHeaders($adminHeaders)
            ->getJson('/api/orders/history?status=completed&search=77');

        $response->assertOk();
        $response->assertJsonPath('data.0.id', $order->id);
        $response->assertJsonPath('data.0.actions.0.actor_type', 'staff');
        $response->assertJsonPath('data.0.actions.0.actor_name', 'Staff Timeline');
        $response->assertJsonPath('data.0.actions.0.action_type', 'status_changed');
        $response->assertJsonPath('data.0.actions.0.from_status', 'ready');
        $response->assertJsonPath('data.0.actions.0.to_status', 'completed');
    }
}
