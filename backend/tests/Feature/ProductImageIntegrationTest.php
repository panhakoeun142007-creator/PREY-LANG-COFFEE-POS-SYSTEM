<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(): array
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = 'test-admin-product-token';
        Cache::put("api_auth_token:{$token}", $admin->id, now()->addHours(1));

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_product_image_upload_is_stored_and_returns_image_url(): void
    {
        Storage::fake('public');

        $category = Category::query()->create([
            'name' => 'Coffee',
            'description' => 'Coffee drinks',
            'is_active' => true,
        ]);

        $response = $this
            ->withHeaders($this->authHeader())
            ->post('/api/products', [
                'category_id' => $category->id,
                'name' => 'Image Latte',
                'price_small' => 3.5,
                'price_medium' => 4.0,
                'price_large' => 4.5,
                'image_file' => UploadedFile::fake()->createWithContent(
                    'latte.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5GqxoAAAAASUVORK5CYII=', true) ?: ''
                ),
                'is_available' => 'true',
            ]);

        $response->assertCreated();
        $imagePath = $response->json('image');

        $this->assertIsString($imagePath);
        $this->assertStringContainsString('product-images/', $imagePath);
        Storage::disk('public')->assertExists($imagePath);
        $response->assertJsonPath('image_url', 'http://localhost/media/' . $imagePath);
    }
}
