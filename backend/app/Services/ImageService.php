<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Reusable service for handling image uploads and deletions.
 */
class ImageService
{
    /**
     * Allowed image MIME types.
     */
    private const ALLOWED_IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];

    /**
     * Maximum image size in bytes (5MB).
     */
    private const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    /**
     * Handle image upload from request file.
     */
    public function handleUpload(Request $request, string $fieldName = 'image_file', string $folder = 'images'): ?string
    {
        if (!$request->hasFile($fieldName)) {
            return null;
        }

        $file = $request->file($fieldName);

        if (!in_array($file->getMimeType(), self::ALLOWED_IMAGE_TYPES)) {
            throw new \InvalidArgumentException('Invalid image type. Allowed: JPEG, PNG, GIF, WebP, SVG.');
        }

        if ($file->getSize() > self::MAX_IMAGE_SIZE) {
            throw new \InvalidArgumentException('Image size exceeds maximum allowed size of 5MB.');
        }

        try {
            $path = $file->store($folder, 'public');
            
            Log::info('Image uploaded successfully', [
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);

            return $path;
        } catch (\Exception $e) {
            Log::error('Failed to upload image', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Handle profile image upload for staff/user.
     */
    public function handleProfileUpload(Request $request, int $userId, string $folder = 'users'): ?string
    {
        if (!$request->hasFile('profile_image')) {
            return null;
        }

        $file = $request->file('profile_image');
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!in_array($file->getClientMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Invalid file type. Allowed: JPEG, PNG, GIF, WebP.');
        }

        $extension = $file->extension() ?: $file->guessExtension() ?: 'jpg';
        $filename = Str::uuid()->toString() . '.' . $extension;
        $path = $file->storePubliclyAs("profile-images/{$folder}/{$userId}", $filename, 'public');

        return $path ?: null;
    }

    /**
     * Delete image file from storage.
     */
    public function delete(?string $imagePath): bool
    {
        if (!$imagePath || str_starts_with($imagePath, 'http') || str_starts_with($imagePath, 'data:')) {
            return false;
        }

        try {
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
                Log::info('Image deleted', ['path' => $imagePath]);
                return true;
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete image', ['error' => $e->getMessage(), 'path' => $imagePath]);
        }

        return false;
    }

    /**
     * Build full URL from stored image path.
     */
    public function buildUrl(?string $image): ?string
    {
        if (!$image) {
            return null;
        }

        if (preg_match('/^(http|https|data):/', $image)) {
            return $image;
        }

        return request()->getSchemeAndHttpHost() . '/media/' . ltrim($image, '/');
    }

    /**
     * Delete old image and return new path if uploaded.
     */
    public function handleUpdate(Request $request, ?string $existingImage, int $userId, string $folder = 'users'): ?string
    {
        // Handle new upload
        $newPath = $this->handleProfileUpload($request, $userId, $folder);
        
        if ($newPath) {
            // Delete old image if exists
            $this->delete($existingImage);
            return $newPath;
        }

        // If URL is explicitly provided in request, use it
        if ($request->has('profile_image_url') && $request->input('profile_image_url')) {
            $this->delete($existingImage);
            return $request->input('profile_image_url');
        }

        return $existingImage;
    }
}
