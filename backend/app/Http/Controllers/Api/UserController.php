<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get the current authenticated user.
     */
    public function me(): JsonResponse
    {
        $subject = $this->resolveCurrentSubject(request());
        if (!$subject) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($subject['subject_type'] === 'admin') {
            /** @var User $admin */
            $admin = $subject['subject'];
            return response()->json($this->serializeAdminUser($admin));
        }

        if ($subject['subject'] instanceof User) {
            /** @var User $staffUser */
            $staffUser = $subject['subject'];

            return response()->json($this->serializeStaffUserFromAccount($staffUser));
        }

        /** @var Staff $staff */
        $staff = $subject['subject'];

        return response()->json($this->serializeStaffUser($staff));
    }

    /**
     * Update current admin account.
     */
    public function updateMe(Request $request): JsonResponse
    {
        $subject = $this->resolveCurrentSubject($request);
        if (!$subject) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($subject['subject_type'] !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        /** @var User $user */
        $user = $subject['subject'];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $user->profile_image = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
        }

        $user->save();

        return response()->json($this->serializeAdminUser($user));
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

    /**
     * @return array{subject_type: string, subject: User|Staff}|null
     */
    private function resolveCurrentSubject(Request $request): ?array
    {
        $subjectType = $request->attributes->get('api_subject_type');
        $subjectId = (int) $request->attributes->get('api_subject_id', 0);
        $subjectSource = (string) $request->attributes->get('api_subject_source', '');

        if (is_string($subjectType) && in_array($subjectType, ['admin', 'staff'], true) && $subjectId > 0) {
            if ($subjectType === 'admin') {
                $admin = User::query()->find($subjectId);
                if ($admin && $admin->is_active && $admin->role === 'admin') {
                    return [
                        'subject_type' => 'admin',
                        'subject' => $admin,
                    ];
                }
            } else {
                if ($subjectSource === 'user') {
                    $staffUser = User::query()->find($subjectId);
                    if ($staffUser && $staffUser->is_active && $staffUser->role === 'staff') {
                        return [
                            'subject_type' => 'staff',
                            'subject' => $staffUser,
                        ];
                    }
                }

                $staff = Staff::query()->find($subjectId);
                if ($staff && $staff->is_active) {
                    return [
                        'subject_type' => 'staff',
                        'subject' => $staff,
                    ];
                }
            }
        }

        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        $session = Cache::get("api_auth_token:{$token}");
        if (!$session) {
            return null;
        }

        if (is_int($session) || (is_string($session) && ctype_digit($session))) {
            $session = [
                'subject_type' => 'admin',
                'subject_id' => (int) $session,
            ];
        }

        if (!is_array($session)) {
            return null;
        }

        $sessionType = (string) ($session['subject_type'] ?? '');
        $sessionId = (int) ($session['subject_id'] ?? 0);
        $sessionModel = (string) ($session['subject_model'] ?? '');

        if ($sessionType === 'admin' && $sessionId > 0) {
            $admin = User::query()->find($sessionId);
            if ($admin && $admin->is_active && $admin->role === 'admin') {
                return [
                    'subject_type' => 'admin',
                    'subject' => $admin,
                ];
            }
        }

        if ($sessionType === 'staff' && $sessionId > 0) {
            if ($sessionModel === 'user') {
                $staffUser = User::query()->find($sessionId);
                if ($staffUser && $staffUser->is_active && $staffUser->role === 'staff') {
                    return [
                        'subject_type' => 'staff',
                        'subject' => $staffUser,
                    ];
                }
            }

            $staff = Staff::query()->find($sessionId);
            if ($staff && $staff->is_active) {
                return [
                    'subject_type' => 'staff',
                    'subject' => $staff,
                ];
            }
        }

        return null;
    }

    private function serializeAdminUser(User $user): array
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
            'role' => 'admin',
            'initials' => $this->getInitials($user->name),
            'profile_image_url' => $imageUrl,
        ];
    }

    private function serializeStaffUser(Staff $staff): array
    {
        $imageUrl = null;
        if ($staff->profile_image) {
            if (str_starts_with($staff->profile_image, 'data:image')) {
                $imageUrl = $staff->profile_image;
            } else {
                $base = request()->getSchemeAndHttpHost();
                $imageUrl = $base . '/storage/' . ltrim($staff->profile_image, '/');
            }
        }

        return [
            'id' => $staff->id,
            'name' => $staff->name,
            'email' => $staff->email,
            'role' => 'staff',
            'initials' => $this->getInitials($staff->name),
            'profile_image_url' => $imageUrl,
        ];
    }

    private function serializeStaffUserFromAccount(User $staffUser): array
    {
        $imageUrl = null;
        if ($staffUser->profile_image) {
            if (str_starts_with($staffUser->profile_image, 'data:image')) {
                $imageUrl = $staffUser->profile_image;
            } else {
                $base = request()->getSchemeAndHttpHost();
                $imageUrl = $base . '/storage/' . ltrim($staffUser->profile_image, '/');
            }
        }

        return [
            'id' => $staffUser->id,
            'name' => $staffUser->name,
            'email' => $staffUser->email,
            'role' => 'staff',
            'initials' => $this->getInitials($staffUser->name),
            'profile_image_url' => $imageUrl,
        ];
    }
}
 
