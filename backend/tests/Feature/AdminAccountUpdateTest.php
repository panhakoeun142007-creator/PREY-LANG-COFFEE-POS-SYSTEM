<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
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

    public function test_admin_can_update_own_profile_image_and_it_is_stored_in_database(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'email' => 'admin@example.com',
        ]);

        $token = 'test-admin-token';
        Cache::put("api_auth_token:{$token}", $admin->id, now()->addHours(1));

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/user/me', [
                'profile_image' => UploadedFile::fake()->createWithContent(
                    'avatar.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5GqxoAAAAASUVORK5CYII=', true) ?: ''
                ),
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('role', 'admin');

        $admin->refresh();
        $this->assertNotNull($admin->profile_image);
        $this->assertIsString($admin->profile_image);
        $this->assertStringContainsString("profile-images/users/{$admin->id}/", $admin->profile_image);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $fakeDisk */
        $fakeDisk = Storage::disk('public');
        $fakeDisk->assertExists($admin->profile_image);
        $response->assertJsonPath('profile_image_url', "http://localhost/storage/{$admin->profile_image}");
    }

    public function test_admin_update_requires_authentication(): void
    {
        User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'email' => 'admin@example.com',
        ]);

        $response = $this->postJson('/api/user/me', [
            'email' => 'new@example.com',
        ]);

        $response->assertStatus(401);
    }
}
