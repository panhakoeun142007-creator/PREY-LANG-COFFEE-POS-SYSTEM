<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
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

        if ($request->hasFile('profile_image')) {
            try {
                $file = $request->file('profile_image');
                $mime = $file->getMimeType() ?: 'application/octet-stream';
                $imageData = file_get_contents($file->getRealPath());
                if ($imageData !== false) {
                    $user->profile_image = 'data:' . $mime . ';base64,' . base64_encode($imageData);
                }
            } catch (\Exception $e) {
                // Silently fail - don't update profile image if there's an error
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
        $hasAdminColumns = Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'is_active');

        /** @var User|null $user */
        $user = request()->user();
        if ($user && (!$hasAdminColumns || ($user->is_active && $user->role === 'admin'))) {
            return $user;
        }

        if (!$hasAdminColumns) {
            return User::query()->orderBy('id')->first();
        }

        return User::query()->where('role', 'admin')->where('is_active', true)->orderBy('id')->first();
    }

    private function serializeUser(User $user): array
    {
        $imageUrl = null;
        if ($user->profile_image) {
            if (str_starts_with($user->profile_image, 'data:image')) {
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
        $hasAdminColumns = Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'is_active');
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
}
 
