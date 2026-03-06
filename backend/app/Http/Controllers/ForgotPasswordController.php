<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class ForgotPasswordController extends Controller
{
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->input('email'));
        $exists = User::where('email', $email)->exists();

        return response()->json([
            'success' => $exists,
            'message' => $exists
                ? 'Email exists. Use /send-reset-link to send verification code.'
                : 'Email is not registered.',
        ], $exists ? 200 : 404);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->input('email'));
        $isVerified = Cache::get("password_reset_verified_{$email}") === true;

        if (!$isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'Verification expired. Please verify your code again.',
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $user->password = $request->input('password');
        $user->save();

        Cache::forget("password_reset_verified_{$email}");

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }
}
