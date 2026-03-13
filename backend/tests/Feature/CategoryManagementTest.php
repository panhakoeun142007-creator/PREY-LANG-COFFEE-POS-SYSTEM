<?php

namespace Tests\Feature;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_categories_but_only_admin_can_create(): void
    {
        // Public listing is cached/public
        $this->getJson('/api/categories')->assertOk();

        // Unauthenticated cannot create
        $this
            ->postJson('/api/categories', [
                'name' => 'New Category',
                'description' => 'Desc',
                'quantity' => 0,
                'is_active' => true,
            ])
            ->assertUnauthorized();

        $staff = Staff::query()->create([
            'name' => 'Test Staff',
            'email' => 'staff@example.com',
            'password' => 'password',
            'salary' => 0,
            'is_active' => true,
        ]);
        $staffToken = 'test-staff-token';
        Cache::put("api_auth_token:{$staffToken}", [
            'subject_type' => 'staff',
            'subject_id' => $staff->id,
        ], now()->addHours(1));

        $this
            ->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/categories', [
                'name' => 'Staff Category',
                'quantity' => 0,
                'is_active' => true,
            ])
            ->assertForbidden();

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        $adminToken = 'test-admin-token';
        Cache::put("api_auth_token:{$adminToken}", [
            'subject_type' => 'admin',
            'subject_id' => $admin->id,
        ], now()->addHours(1));

        $this
            ->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/categories', [
                'name' => 'Coffee Beans',
                'description' => 'Beans and grounds',
                'quantity' => 5,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('name', 'Coffee Beans')
            ->assertJsonPath('quantity', 5)
            ->assertJsonPath('is_active', true);

        $this
            ->getJson('/api/categories')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Coffee Beans']);
    }
}

