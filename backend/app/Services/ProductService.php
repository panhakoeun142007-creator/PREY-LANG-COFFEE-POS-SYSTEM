<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * @return array<string, mixed>
     */
    public function prepareStorePayload(Request $request): array
    {
        $this->normalizeAvailability($request);

        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:80', 'unique:products,sku'],
            'price_small' => ['required', 'numeric', 'min:0'],
            'price_medium' => ['required', 'numeric', 'min:0'],
            'price_large' => ['required', 'numeric', 'min:0'],
            'image' => $this->imageRules($request),
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $this->handleImageUpload($request, $validated);
        $this->ensureSku($validated);

        return $validated;
    }

    /**
     * @return array<string, mixed>
     */
    public function prepareUpdatePayload(Request $request, Product $product): array
    {
        $this->normalizeAvailability($request);

        $validated = $request->validate([
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:80', 'unique:products,sku,' . $product->id],
            'price_small' => ['sometimes', 'required', 'numeric', 'min:0'],
            'price_medium' => ['sometimes', 'required', 'numeric', 'min:0'],
            'price_large' => ['sometimes', 'required', 'numeric', 'min:0'],
            'image' => $this->imageRules($request),
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $this->handleImageUpload($request, $validated, $product);

        return $validated;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): Product
    {
        return Product::create($payload)->load('category');
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(Product $product, array $payload): Product
    {
        $product->update($payload);

        return $product->fresh()->load('category');
    }

    private function normalizeAvailability(Request $request): void
    {
        if (!$request->has('is_available')) {
            return;
        }

        $request->merge([
            'is_available' => filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                ?? $request->input('is_available'),
        ]);
    }

    /**
     * @return list<string>
     */
    private function imageRules(Request $request): array
    {
        return $request->hasFile('image')
            ? ['nullable', 'file', 'image', 'max:5120']
            : ['nullable', 'string'];
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function handleImageUpload(Request $request, array &$validated, ?Product $product = null): void
    {
        if (!$request->hasFile('image')) {
            return;
        }

        if ($product) {
            $storedImage = $product->getRawOriginal('image');

            if ($storedImage && Str::startsWith($storedImage, 'products/')) {
                Storage::disk('public')->delete($storedImage);
            }
        }

        $validated['image'] = $request->file('image')->store('products', 'public');
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function ensureSku(array &$validated): void
    {
        if (!empty($validated['sku'])) {
            return;
        }

        $validated['sku'] = 'SKU-' . strtoupper(uniqid());
    }
}
