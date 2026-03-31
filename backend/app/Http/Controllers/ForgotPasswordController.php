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
        $codeTtlMinutes = 10;
        $exposeDevCode = app()->environment('local') || (bool) config('app.debug');

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email is not registered.',
            ], 404);
        }

        // Generate 6-digit verification code
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store code in cache
        Cache::put("password_reset_code_{$email}", $code, now()->addMinutes($codeTtlMinutes));

        try {
            Mail::to($email)->send(new VerificationCodeMail(
                verificationCode: $code,
                purpose: 'password_reset',
                expiryMinutes: $codeTtlMinutes,
            ));

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email.',
                'devCode' => $exposeDevCode ? $code : null,
                'mailSent' => true,
                'expiresInMinutes' => $codeTtlMinutes,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send password reset verification email: ' . $e->getMessage());

            // In local/dev we allow continuing with a devCode so the UI can be tested without SMTP.
            if ($exposeDevCode) {
                return response()->json([
                    'success' => true,
                    'message' => 'Email could not be sent (check MAIL_*). Use the dev code to continue.',
                    'devCode' => $code,
                    'mailSent' => false,
                    'expiresInMinutes' => $codeTtlMinutes,
                ]);
            }

            // In production, fail loudly so the UI doesn’t proceed without a real code.
            return response()->json([
                'success' => false,
                'message' => 'Unable to send verification code email. Please try again later.',
                'mailSent' => false,
            ], 502);
        }
    }

    /**
     * Verify the code entered by user
     */
    public function verifyCode(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->input('email'));
        $code = trim((string) $request->input('code'));

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
        Cache::forget("password_reset_code_{$email}");

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
