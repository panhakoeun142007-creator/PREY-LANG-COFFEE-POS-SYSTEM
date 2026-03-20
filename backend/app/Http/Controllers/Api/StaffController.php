<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StaffController extends Controller
{
    private ?Staff $resolvedCurrentStaff = null;

    private bool $didResolveCurrentStaff = false;

    /**
     * Get current authenticated staff member.
     */
    public function me(): JsonResponse
    {
        $staff = $this->resolveCurrentStaff();

        if (!$staff) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json($this->serializeStaff($staff));
    }

    /**
     * Update current staff member's profile image only.
     * Staff can only upload profile image, cannot change name or email.
     */
    public function updateMyProfile(Request $request): JsonResponse
    {
        $staff = $this->resolveCurrentStaff();

        if (!$staff) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Only allow profile_image update - name and email cannot be changed by staff
        $validated = $request->validate([
            'profile_image' => ['nullable', 'image', 'max:5120'],
            'remove_profile_image' => ['sometimes', 'boolean'],
        ]);

        $existingProfileImage = (string) ($staff->getOriginal('profile_image') ?? '');

        if (($validated['remove_profile_image'] ?? false) === true) {
            if ($existingProfileImage !== '' && !str_starts_with($existingProfileImage, 'data:')) {
                Storage::disk('public')->delete($existingProfileImage);
            }
            $staff->profile_image = null;
            $staff->save();
        }

        if ($request->hasFile('profile_image')) {
            try {
                $file = $request->file('profile_image');
                if ($file) {
                    // Validate file type
                    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    $mime = $file->getClientMimeType();
                    if (!in_array($mime, $allowedMimes)) {
                        return response()->json([
                            'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
                        ], 422);
                    }

                    $extension = $file->extension() ?: $file->guessExtension() ?: 'jpg';
                    $filename = Str::uuid()->toString() . '.' . $extension;
                    $path = $file->storePubliclyAs("profile-images/staffs/{$staff->id}", $filename, 'public');

                    if ($path) {
                        if ($existingProfileImage !== '' && !str_starts_with($existingProfileImage, 'data:')) {
                            Storage::disk('public')->delete($existingProfileImage);
                        }
                        $staff->profile_image = $path;
                        $staff->save();
                    } else {
                        Log::error('Failed to store staff profile image', [
                            'staff_id' => $staff->id,
                            'file' => $filename,
                        ]);
                        return response()->json([
                            'message' => 'Failed to store profile image. Please try again.',
                        ], 500);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Staff profile image upload error', [
                    'staff_id' => $staff->id,
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'message' => 'An error occurred while uploading the profile image: ' . $e->getMessage(),
                ], 500);
            }
        }

        return response()->json($this->serializeStaff($staff->fresh()));
    }

    /**
     * Display a listing of staff.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'is_active' => ['nullable', 'in:0,1,true,false'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Staff::query()->latest();

        if (!empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where(function ($inner) use ($search) {
                $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = isset($validated['per_page']) ? (int) $validated['per_page'] : 20;

        $paginator = $query->paginate($perPage);
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Staff $staff) => $this->serializeStaff($staff))
        );

        return response()->json($paginator);
    }

    /**
     * Store a newly created staff.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('staffs', 'email')],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'salary' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('profile_image')) {
            try {
                $file = $request->file('profile_image');
                if ($file) {
                    // Validate file type
                    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    $mime = $file->getClientMimeType();
                    if (!in_array($mime, $allowedMimes)) {
                        return response()->json([
                            'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
                        ], 422);
                    }

                    $extension = $file->extension() ?: $file->guessExtension() ?: 'jpg';
                    $filename = Str::uuid()->toString() . '.' . $extension;
                    
                    // Create staff first to get ID, then store image
                    $validated['password_plain'] = $validated['password'];
                    $staff = Staff::create($validated);
                    
                    $path = $file->storePubliclyAs("profile-images/staffs/{$staff->id}", $filename, 'public');
                    if ($path) {
                        $staff->profile_image = $path;
                        $staff->save();
                    } else {
                        Log::error('Failed to store staff profile image during creation', [
                            'staff_id' => $staff->id,
                            'file' => $filename,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Staff profile image upload error during creation', [
                    'error' => $e->getMessage(),
                ]);
            }
        } else {
            $validated['password_plain'] = $validated['password'];
            $staff = Staff::create($validated);
        }
        
        // Clear staff cache
        Cache::forget('staffs_list');
        Cache::forget('staffs_list_paginated');

        return response()->json($this->serializeStaff($staff), 201);
    }

    /**
     * Display the specified staff.
     */
    public function show(Staff $staff): JsonResponse
    {
        return response()->json($this->serializeStaff($staff));
    }

    /**
     * Update the specified staff.
     */
    public function update(Request $request, Staff $staff): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('staffs', 'email')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'salary' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        if (array_key_exists('password', $validated) && !$validated['password']) {
            unset($validated['password']);
        }

        if (array_key_exists('password', $validated)) {
            $validated['password_plain'] = $validated['password'];
        }

        if ($request->hasFile('profile_image')) {
            try {
                $file = $request->file('profile_image');
                if ($file) {
                    // Validate file type
                    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    $mime = $file->getClientMimeType();
                    if (!in_array($mime, $allowedMimes)) {
                        return response()->json([
                            'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
                        ], 422);
                    }

                    $existingProfileImage = (string) ($staff->getRawOriginal('profile_image') ?? '');
                    
                    $extension = $file->extension() ?: $file->guessExtension() ?: 'jpg';
                    $filename = Str::uuid()->toString() . '.' . $extension;
                    $path = $file->storePubliclyAs("profile-images/staffs/{$staff->id}", $filename, 'public');

                    if ($path) {
                        if ($existingProfileImage !== '' && !str_starts_with($existingProfileImage, 'data:')) {
                            Storage::disk('public')->delete($existingProfileImage);
                        }
                        $validated['profile_image'] = $path;
                    } else {
                        Log::error('Failed to store staff profile image during update', [
                            'staff_id' => $staff->id,
                            'file' => $filename,
                        ]);
                        return response()->json([
                            'message' => 'Failed to store profile image. Please try again.',
                        ], 500);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Staff profile image upload error during update', [
                    'staff_id' => $staff->id,
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'message' => 'An error occurred while uploading the profile image: ' . $e->getMessage(),
                ], 500);
            }
        }

        $staff->update($validated);
        
        // Clear staff cache
        Cache::forget('staffs_list');
        Cache::forget('staffs_list_paginated');

        return response()->json($this->serializeStaff($staff->fresh()));
    }

    /**
     * Remove the specified staff.
     */
    public function destroy(Staff $staff): JsonResponse
    {
        $staff->delete();

        // Clear staff cache
        Cache::forget('staffs_list');
        Cache::forget('staffs_list_paginated');

        return response()->json(['message' => 'Staff deleted']);
    }

    private function serializeStaff(Staff $staff): array
    {
        $payload = $staff->toArray();
        $payload['profile_image_url'] = null;
        $payload['role'] = 'staff'; // Add role for frontend
        $payload['initials'] = $this->getInitials($staff->name);

        if ($staff->profile_image) {
            if (str_starts_with($staff->profile_image, 'data:')) {
                $payload['profile_image_url'] = $staff->profile_image;
            } else {
                $base = request()->getSchemeAndHttpHost();
                $payload['profile_image_url'] = $base . '/storage/' . ltrim($staff->profile_image, '/');
            }
        }
        
        // Handle encrypted password_plain that may fail to decrypt
        try {
            $payload['password_plain'] = $staff->password_plain;
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            // If decryption fails, try to get the raw value
            $payload['password_plain'] = $staff->getRawOriginal('password_plain') ?? '';
        }

        return $payload;
    }

    private function getInitials(string $name): string
    {
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
        }
        return strtoupper(substr($name, 0, 2));
    }

    private function resolveCurrentStaff(): ?Staff
    {
        if ($this->didResolveCurrentStaff) {
            return $this->resolvedCurrentStaff;
        }

        $this->didResolveCurrentStaff = true;

        // Get staff ID from cache token
        $token = request()->bearerToken();
        if (!$token) {
            return null;
        }

        $cacheKey = "api_auth_token:{$token}";
        $cached = Cache::get($cacheKey);

        if (!$cached || !is_array($cached) || ($cached['subject_type'] ?? null) !== 'staff') {
            return null;
        }

        return $this->resolvedCurrentStaff = Staff::query()
            ->where('id', $cached['subject_id'])
            ->where('is_active', true)
            ->first();
    }
}
