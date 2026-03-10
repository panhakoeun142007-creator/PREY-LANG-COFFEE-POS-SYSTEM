<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cache;

class StaffController extends Controller
{
    /**
     * Cache TTL for staff list (5 minutes).
     */
    private const CACHE_TTL = 300;
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
        ]);

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $staff->profile_image = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
            $staff->save();
        }

        return response()->json($this->serializeStaff($staff->fresh()));
    }

    /**
     * Display a listing of staff.
     */
    public function index(Request $request): JsonResponse
    {
        // Build cache key based on request parameters
        $cacheKey = 'staffs_list_paginated';
        $search = $request->filled('search') ? trim($request->string('search')) : null;
        $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
        
        if ($search) {
            $cacheKey .= '_search_' . $search;
        }
        if ($isActive !== null) {
            $cacheKey .= '_active_' . ($isActive ? '1' : '0');
        }

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request, $search, $isActive) {
            $query = Staff::query()->latest();

            if ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }

            $paginator = $query->paginate(20);
            $paginator->setCollection(
                $paginator->getCollection()->map(fn (Staff $staff) => $this->serializeStaff($staff))
            );

            return $paginator;
        });

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
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $validated['profile_image'] = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
        }

        $validated['password_plain'] = $validated['password'];
        $staff = Staff::create($validated);
        
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
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $validated['profile_image'] = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
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
            if (str_starts_with($staff->profile_image, 'data:image')) {
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
        // Get staff ID from cache token
        $token = request()->bearerToken();
        if (!$token) {
            return null;
        }

        $cacheKey = "api_auth_token:{$token}";
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!$cached || ($cached['subject_type'] ?? null) !== 'staff') {
            return null;
        }

        return Staff::query()->where('id', $cached['subject_id'])->where('is_active', true)->first();
    }
}
