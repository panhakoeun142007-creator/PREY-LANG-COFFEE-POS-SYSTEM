<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class AuthController extends Controller
{
    /**
     * Login with admin or staff account.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $adminUser = User::query()
            ->where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        if ($adminUser && $this->verifyAndUpgradePassword($adminUser, $validated['password'])) {
            $token = Str::random(64);
            Cache::put("api_auth_token:{$token}", [
                'subject_type' => 'admin',
                'subject_id' => $adminUser->id,
            ], now()->addHours(24));

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $adminUser->id,
                    'name' => $adminUser->name,
                    'email' => $adminUser->email,
                    'role' => $adminUser->role,
                ],
            ]);
        }

        $staff = Staff::query()
            ->where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        if (!$staff || !$this->verifyAndUpgradePassword($staff, $validated['password'])) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = Str::random(64);
        Cache::put("api_auth_token:{$token}", [
            'subject_type' => 'staff',
            'subject_id' => $staff->id,
        ], now()->addHours(24));

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => 'staff',
            ],
        ]);
    }

    /**
     * Logout current session token.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            Cache::forget("api_auth_token:{$token}");
        }

        return response()->json(['message' => 'Logged out']);
    }

    private function verifyAndUpgradePassword(User|Staff $account, string $plainPassword): bool
    {
        $storedPassword = (string) $account->password;
        $valid = false;

        try {
            $valid = Hash::check($plainPassword, $storedPassword);
        } catch (RuntimeException) {
            // Handle legacy hashes and accidental plaintext rows without crashing login.
            $passwordInfo = password_get_info($storedPassword);
            if (($passwordInfo['algo'] ?? null) !== null) {
                $valid = password_verify($plainPassword, $storedPassword);
            } else {
                $valid = hash_equals($storedPassword, $plainPassword);
            }
        }

        if (!$valid) {
            return false;
        }

        if (Hash::needsRehash($storedPassword)) {
            $account->password = $plainPassword;
            $account->save();
        }

        return true;
    }
}
