<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /**
     * Check if email exists (forgot password step 1)
     */
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

    /**
     * Send verification code to email
     */
    public function sendResetLink(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->input('email'));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email is not registered.',
            ], 404);
        }

        // Generate 6-digit verification code
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store code in cache for 10 minutes
        Cache::put("password_reset_code_{$email}", $code, now()->addMinutes(10));

        // In development, return the code for testing
        $devCode = null;
        if (config('app.env') === 'local' || config('app.debug')) {
            $devCode = $code;
        }

        try {
            // Send email with verification code
            \Mail::to($email)->send(new VerificationCodeMail($code, $user->name));
            $mailSent = true;
        } catch (\Exception $e) {
            \Log::error('Failed to send verification email: ' . $e->getMessage());
            $mailSent = false;
        }

        return response()->json([
            'success' => true,
            'message' => $mailSent 
                ? 'Verification code sent to your email.'
                : 'Verification code could not be sent. Using dev code.',
            'devCode' => $devCode,
            'mailSent' => $mailSent,
        ]);
    }

    /**
     * Verify the code entered by user
     */
    public function verifyCode(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->input('email'));
        $code = $request->input('code');

        $storedCode = Cache::get("password_reset_code_{$email}");

        if (!$storedCode) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code expired. Please request a new code.',
            ], 422);
        }

        if ($storedCode !== $code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
            ], 422);
        }

        // Mark as verified
        Cache::put("password_reset_verified_{$email}", true, now()->addMinutes(30));

        return response()->json([
            'success' => true,
            'message' => 'Code verified successfully.',
        ]);
    }

    /**
     * Reset password after verification
     */
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
