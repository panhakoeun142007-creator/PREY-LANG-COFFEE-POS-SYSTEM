<?php

namespace App\Http\Controllers\Api;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

/**
 * Staff management controller.
 */
class StaffController extends BaseController
{
    private ?Staff $currentStaff = null;
    private bool $staffResolved = false;

    /**
     * Get current authenticated staff.
     */
    public function me(): JsonResponse
    {
        $staff = $this->resolveCurrentStaff();
        
        if (!$staff) {
            return $this->error('Unauthorized', 401);
        }

        return response()->json($this->serializeStaff($staff));
    }

    /**
     * Update current staff profile image.
     */
    public function updateMyProfile(Request $request): JsonResponse
    {
        $staff = $this->resolveCurrentStaff();
        
        if (!$staff) {
            return $this->error('Unauthorized', 401);
        }

        $validated = $request->validate([
            'profile_image' => ['nullable', 'image', 'max:5120'],
            'remove_profile_image' => ['sometimes', 'boolean'],
        ]);

        $existingImage = (string) $staff->getOriginal('profile_image') ?? '';

        // Handle removal
        if (($validated['remove_profile_image'] ?? false) === true) {
            $this->imageService->delete($existingImage);
            $staff->profile_image = null;
            $staff->save();
        }

        // Handle new upload
        if ($request->hasFile('profile_image')) {
            try {
                $newPath = $this->imageService->handleProfileUpload($request, $staff->id, 'staffs');
                
                if ($newPath) {
                    $this->imageService->delete($existingImage);
                    $staff->profile_image = $newPath;
                    $staff->save();
                }
            } catch (\Exception $e) {
                return $this->error('Failed to upload profile image: ' . $e->getMessage(), 500);
            }
        }

        return response()->json($this->serializeStaff($staff->fresh()));
    }

    /**
     * List staff with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin()) {
            return $guard;
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'is_active' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Staff::query()->latest();

        if (!empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = (int) ($validated['per_page'] ?? 20);

        $paginator = $query->paginate($perPage);
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Staff $s) => $this->serializeStaff($s))
        );

        return response()->json($paginator);
    }

    /**
     * Create new staff.
     */
    public function store(Request $request): JsonResponse
    {
        if ($guard = $this->requireAdmin()) {
            return $guard;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('staffs', 'email')],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'salary' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        // Store plain password for display
        $validated['password_plain'] = $validated['password'];

        // Handle profile image
        if ($request->hasFile('profile_image')) {
            $staff = Staff::create($validated);
            
            try {
                $path = $this->imageService->handleProfileUpload($request, $staff->id, 'staffs');
                if ($path) {
                    $staff->profile_image = $path;
                    $staff->save();
                }
            } catch (\Exception $e) {
                // Log but continue - staff was created
            }
        } else {
            $staff = Staff::create($validated);
        }

        $this->clearStaffCache();

        return response()->json($this->serializeStaff($staff), 201);
    }

    /**
     * Get single staff.
     */
    public function show(Staff $staff): JsonResponse
    {
        if ($guard = $this->requireAdmin()) {
            return $guard;
        }

        return response()->json($this->serializeStaff($staff));
    }

    /**
     * Update staff.
     */
    public function update(Request $request, Staff $staff): JsonResponse
    {
        if ($guard = $this->requireAdmin()) {
            return $guard;
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('staffs', 'email')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'salary' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        // Handle password
        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password_plain'] = $validated['password'];
        }

        // Handle profile image
        if ($request->hasFile('profile_image')) {
            $existingImage = (string) $staff->getRawOriginal('profile_image') ?? '';
            
            try {
                $newPath = $this->imageService->handleProfileUpload($request, $staff->id, 'staffs');
                if ($newPath) {
                    $this->imageService->delete($existingImage);
                    $validated['profile_image'] = $newPath;
                }
            } catch (\Exception $e) {
                return $this->error('Failed to upload profile image: ' . $e->getMessage(), 500);
            }
        }

        $staff->update($validated);
        $this->clearStaffCache();

        return response()->json($this->serializeStaff($staff->fresh()));
    }

    /**
     * Delete staff.
     */
    public function destroy(Staff $staff): JsonResponse
    {
        if ($guard = $this->requireAdmin()) {
            return $guard;
        }

        $staff->delete();
        $this->clearStaffCache();

        return response()->json(['message' => 'Staff deleted']);
    }

    // ==================== Private Helpers ====================

    private function serializeStaff(Staff $staff): array
    {
        $payload = $staff->toArray();
        $payload['profile_image_url'] = $this->imageService->buildUrl($staff->profile_image);
        $payload['role'] = 'staff';
        $payload['initials'] = $this->getInitials($staff->name);

        // Handle encrypted password
        try {
            $payload['password_plain'] = $staff->password_plain;
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            $payload['password_plain'] = $staff->getRawOriginal('password_plain') ?? '';
        }

        return $payload;
    }

    private function resolveCurrentStaff(): ?Staff
    {
        if ($this->staffResolved) {
            return $this->currentStaff;
        }

        $this->staffResolved = true;

        $token = request()->bearerToken();
        if (!$token) {
            return null;
        }

        $cacheKey = "api_auth_token:{$token}";
        $cached = Cache::get($cacheKey);

        if (!$cached || !is_array($cached) || ($cached['subject_type'] ?? null) !== 'staff') {
            return null;
        }

        return $this->currentStaff = Staff::query()
            ->where('id', $cached['subject_id'])
            ->where('is_active', true)
            ->first();
    }

    private function clearStaffCache(): void
    {
        Cache::forget('staffs_list');
        Cache::forget('staffs_list_paginated');
    }

    private function requireAdmin(): ?JsonResponse
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (($user->role ?? 'admin') !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return null;
    }
}
