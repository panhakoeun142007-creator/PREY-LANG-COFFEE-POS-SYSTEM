<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminAccountUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_own_name_and_email(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'email' => 'admin@example.com',
        ]);

        $token = 'test-admin-token';
        Cache::put("api_auth_token:{$token}", $admin->id, now()->addHours(1));

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/user/me', [
                'name' => 'Updated Admin',
                'email' => 'updated.admin@example.com',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Updated Admin')
            ->assertJsonPath('email', 'updated.admin@example.com')
            ->assertJsonPath('role', 'admin');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => 'Updated Admin',
            'email' => 'updated.admin@example.com',
            'role' => 'admin',
        ]);
    }
}
