<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private ?User $resolvedCurrentUser = null;

    private bool $didResolveCurrentUser = false;

    /**
     * Get the current authenticated user.
     */
    public function me(): JsonResponse
    {
        $user = $this->resolveCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        return response()->json($this->serializeUser($user));
    }

    /**
     * Update current admin account.
     */
    public function updateMe(Request $request): JsonResponse
    {
        $user = $this->resolveCurrentUser();
        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $validated = [];

        // Allow partial updates - only validate fields that are provided
        $rules = [];
        if ($request->has('name')) {
            $rules['name'] = ['required', 'string', 'max:255'];
        }
        if ($request->has('email')) {
            $rules['email'] = [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ];
        }
        if ($request->hasFile('profile_image')) {
            $rules['profile_image'] = ['nullable', 'image', 'max:10240'];
        }
        if ($request->has('remove_profile_image')) {
            $rules['remove_profile_image'] = ['boolean'];
        }

        // Only validate if there are rules (at least one field provided)
        if (!empty($rules)) {
            $validated = $request->validate($rules);
        }

        // Update only the fields that were provided
        if ($request->has('name')) {
            $user->name = $request->input('name');
        }
        if ($request->has('email')) {
            $user->email = $request->input('email');
        }

        $existingProfileImage = (string) ($user->getOriginal('profile_image') ?? '');

        if (($validated['remove_profile_image'] ?? false) === true) {
            if ($existingProfileImage !== '' && !str_starts_with($existingProfileImage, 'data:')) {
                Storage::disk('public')->delete($existingProfileImage);
            }
            $user->profile_image = null;
        }

        if ($request->hasFile('profile_image')) {
            try {
                $file = $request->file('profile_image');
                if ($file) {
                    // Validate file type
                    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (!in_array($file->getClientMimeType(), $allowedMimes)) {
                        return response()->json([
                            'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
                        ], 422);
                    }

                    $extension = $file->extension() ?: $file->guessExtension() ?: 'jpg';
                    $filename = Str::uuid()->toString() . '.' . $extension;
                    $path = $file->storePubliclyAs("profile-images/users/{$user->id}", $filename, 'public');

                    if ($path) {
                        if ($existingProfileImage !== '' && !str_starts_with($existingProfileImage, 'data:')) {
                            Storage::disk('public')->delete($existingProfileImage);
                        }
                        $user->profile_image = $path;
                    } else {
                        Log::error('Failed to store profile image', [
                            'user_id' => $user->id,
                            'file' => $filename,
                        ]);
                        return response()->json([
                            'message' => 'Failed to store profile image. Please try again.',
                        ], 500);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Profile image upload error', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'message' => 'An error occurred while uploading the profile image: ' . $e->getMessage(),
                ], 500);
            }
        }

        $user->save();

        return response()->json($this->serializeUser($user));
    }

    /**
     * Get user initials from name.
     */
    private function getInitials(string $name): string
    {
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
        }
        return strtoupper(substr($name, 0, 2));
    }

    private function resolveCurrentUser(): ?User
    {
        if ($this->didResolveCurrentUser) {
            return $this->resolvedCurrentUser;
        }

        $this->didResolveCurrentUser = true;

        $token = request()->bearerToken();
        if (!$token) {
            return null;
        }

        $session = Cache::get("api_auth_token:{$token}");
        if (is_int($session) || (is_string($session) && ctype_digit($session))) {
            $session = [
                'subject_type' => 'admin',
                'subject_id' => (int) $session,
            ];
        }

        if (!$session || !is_array($session) || ($session['subject_type'] ?? null) !== 'admin') {
            return null;
        }

        $userId = (int) ($session['subject_id'] ?? 0);
        if ($userId <= 0) {
            return null;
        }

        $hasAdminColumns = $this->hasAdminColumns();
        $user = User::query()->find($userId);

        if (!$user || ($hasAdminColumns && (!$user->is_active || $user->role !== 'admin'))) {
            return null;
        }

        return $this->resolvedCurrentUser = $user;
    }

    private function serializeUser(User $user): array
    {
        $imageUrl = null;
        if ($user->profile_image) {
            if (str_starts_with($user->profile_image, 'data:')) {
                $imageUrl = $user->profile_image;
            } else {
                $base = request()->getSchemeAndHttpHost();
                $imageUrl = $base . '/storage/' . ltrim($user->profile_image, '/');
            }
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'admin',
            'initials' => $this->getInitials($user->name),
            'profile_image_url' => $imageUrl,
        ];
    }

    private function unauthorizedResponse(): JsonResponse
    {
        $hasAdminColumns = $this->hasAdminColumns();
        $hasActiveAdmin = $hasAdminColumns
            ? User::query()->where('role', 'admin')->where('is_active', true)->exists()
            : User::query()->exists();

        if (!$hasActiveAdmin) {
            return response()->json([
                'message' => 'No active admin account found. Run: php artisan migrate --seed',
            ], 401);
        }

        return response()->json(['message' => 'Unauthorized'], 401);
    }

    private function hasAdminColumns(): bool
    {
        static $hasAdminColumns;

        if ($hasAdminColumns === null) {
            $hasAdminColumns = Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'is_active');
        }

        return $hasAdminColumns;
    }
}
 
