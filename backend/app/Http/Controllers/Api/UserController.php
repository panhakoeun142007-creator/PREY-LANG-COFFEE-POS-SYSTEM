<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

/**
 * Admin user management controller.
 */
class UserController extends BaseController
{
    private ?User $currentUser = null;
    private bool $userResolved = false;

    /**
     * Get current authenticated admin.
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
     * Update current admin profile.
     */
    public function updateMe(Request $request): JsonResponse
    {
        $user = $this->resolveCurrentUser();
        
        if (!$user) {
            return $this->unauthorizedResponse();
        }

        // Build dynamic validation rules
        $rules = [];
        
        if ($request->has('name')) {
            $rules['name'] = ['required', 'string', 'max:255'];
        }
        if ($request->has('email')) {
            $rules['email'] = [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ];
        }
        if ($request->hasFile('profile_image')) {
            $rules['profile_image'] = ['nullable', 'image', 'max:10240'];
        }
        if ($request->has('remove_profile_image')) {
            $rules['remove_profile_image'] = ['boolean'];
        }

        if (!empty($rules)) {
            $validated = $request->validate($rules);
        }

        // Update name and email
        if ($request->has('name')) {
            $user->name = $request->input('name');
        }
        if ($request->has('email')) {
            $user->email = $request->input('email');
        }

        $existingImage = (string) $user->getOriginal('profile_image') ?? '';

        // Handle image removal
        if (($validated['remove_profile_image'] ?? false) === true) {
            $this->imageService->delete($existingImage);
            $user->profile_image = null;
        }

        // Handle new image upload
        if ($request->hasFile('profile_image')) {
            try {
                $newPath = $this->imageService->handleProfileUpload($request, $user->id, 'users');
                
                if ($newPath) {
                    $this->imageService->delete($existingImage);
                    $user->profile_image = $newPath;
                }
            } catch (\Exception $e) {
                return $this->error('Failed to upload profile image: ' . $e->getMessage(), 500);
            }
        }

        $user->save();

        return response()->json($this->serializeUser($user));
    }

    // ==================== Private Helpers ====================

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'admin',
            'initials' => $this->getInitials($user->name),
            'profile_image_url' => $this->imageService->buildUrl($user->profile_image),
        ];
    }

    private function resolveCurrentUser(): ?User
    {
        if ($this->userResolved) {
            return $this->currentUser;
        }

        $this->userResolved = true;

        $token = request()->bearerToken();
        if (!$token) {
            return null;
        }

        $session = Cache::get("api_auth_token:{$token}");
        
        // Handle legacy token format (integer)
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

        return $this->currentUser = $user;
    }

    private function hasAdminColumns(): bool
    {
        static $hasAdminColumns;

        if ($hasAdminColumns === null) {
            $hasAdminColumns = Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'is_active');
        }

        return $hasAdminColumns;
    }

    private function unauthorizedResponse(): JsonResponse
    {
        $hasAdminColumns = $this->hasAdminColumns();
        
        $hasActiveAdmin = $hasAdminColumns
            ? User::query()->where('role', 'admin')->where('is_active', true)->exists()
            : User::query()->exists();

        if (!$hasActiveAdmin) {
            return $this->error('No active admin account found. Run: php artisan migrate --seed', 401);
        }

        return $this->error('Unauthorized', 401);
    }
}
