<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SettingsAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_require_auth_and_only_admin_can_update(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'email' => 'admin@example.com',
        ]);

        $staff = Staff::query()->create([
            'name' => 'Test Staff',
            'email' => 'staff@example.com',
            'password' => 'password',
            'salary' => 0,
            'is_active' => true,
        ]);

        $adminToken = 'test-admin-token';
        $staffToken = 'test-staff-token';

        // Backward compatible admin token format: token => admin user id
        Cache::put("api_auth_token:{$adminToken}", $admin->id, now()->addHours(1));
        Cache::put("api_auth_token:{$staffToken}", [
            'subject_type' => 'staff',
            'subject_id' => $staff->id,
        ], now()->addHours(1));

        // Unauthenticated users cannot read settings
        $this->getJson('/api/settings')->assertUnauthorized();

        // Staff can read settings
        $this
            ->withHeader('Authorization', "Bearer {$staffToken}")
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonStructure(['general', 'payment', 'receipt', 'notifications']);

        // Staff cannot update settings
        $this
            ->withHeader('Authorization', "Bearer {$staffToken}")
            ->putJson('/api/settings', [
                'general' => ['shop_name' => 'Staff Update Attempt'],
            ])
            ->assertForbidden();

        // Admin can read settings
        $this
            ->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/settings')
            ->assertOk();

        // Prime cache via GET, then ensure PUT invalidates cache and persists.
        $this
            ->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('general.shop_name', 'Prey Lang Coffee Roastery');

        $this
            ->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson('/api/settings', [
                'general' => ['shop_name' => 'Updated Shop Name'],
                'payment' => ['khqr_enabled' => false],
            ])
            ->assertOk()
            ->assertJsonPath('general.shop_name', 'Updated Shop Name')
            ->assertJsonPath('payment.khqr_enabled', false);

        $this
            ->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('general.shop_name', 'Updated Shop Name')
            ->assertJsonPath('payment.khqr_enabled', false);

        $this->assertDatabaseHas('settings', [
            'key' => 'app_settings',
        ]);

        $setting = Setting::query()->where('key', 'app_settings')->first();
        $this->assertNotNull($setting);
        $this->assertSame('Updated Shop Name', $setting->value['general']['shop_name'] ?? null);
        $this->assertSame(false, $setting->value['payment']['khqr_enabled'] ?? null);
    }
}

