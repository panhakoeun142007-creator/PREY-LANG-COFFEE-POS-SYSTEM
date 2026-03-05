<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiningTableManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_table_accepts_active_status_and_qr_code_alias(): void
    {
        $response = $this->postJson('/api/tables', [
            'name' => 'Table 1',
            'capacity' => 4,
            'status' => 'active',
            'qrCode' => 'QR-TABLE-1',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'Table 1')
            ->assertJsonPath('capacity', 4)
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('qrCode', 'QR-TABLE-1');

        $this->assertDatabaseHas('dining_tables', [
            'name' => 'Table 1',
            'seats' => 4,
            'is_active' => true,
            'qr_code' => 'QR-TABLE-1',
        ]);
    }

    public function test_update_table_accepts_active_status_and_qr_code_alias(): void
    {
        $table = DiningTable::create([
            'name' => 'Table 2',
            'seats' => 2,
            'status' => 'available',
            'is_active' => true,
            'qr_code' => 'QR-OLD-2',
        ]);

        $response = $this->putJson("/api/tables/{$table->id}", [
            'status' => 'inactive',
            'qrCode' => 'QR-NEW-2',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('id', $table->id)
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('qrCode', 'QR-NEW-2');

        $this->assertDatabaseHas('dining_tables', [
            'id' => $table->id,
            'is_active' => false,
            'qr_code' => 'QR-NEW-2',
        ]);
    }
}
