<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    // Store verification codes in cache (temporary storage)
    private function storeVerificationCode($email, $code)
    {
        Cache::put("verification_code_{$email}", [
            'code' => $code,
            'expires' => now()->addMinutes(5)
        ], 300); // 5 minutes
    }

    // Generate random 6-digit code
    private function generateVerificationCode()
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->input('name'),
            'email' => strtolower($request->input('email')),
            'password' => $request->input('password'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registered successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $email = strtolower($request->input('email'));
        $password = $request->input('password');
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    // Send verification code
    public function sendResetLink(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter a valid email address'
            ], 400);
        }

        $email = strtolower($request->email);

        if (!User::where('email', $email)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This email address is not registered in our system'
            ], 400);
        }

        $code = $this->generateVerificationCode();
        $this->storeVerificationCode($email, $code);

        try {
            // Send email using Laravel Mail
            Mail::to($email)->send(new VerificationCodeMail($code));

            // Log for development
            \Log::info("Verification code {$code} sent to {$email}");

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully',
                'mailSent' => true,
                'devCode' => app()->environment('local') ? $code : null,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Email sending failed: ' . $e->getMessage());

            // Local fallback: keep the flow usable even when SMTP is not configured yet.
            if (app()->environment('local')) {
                return response()->json([
                    'success' => true,
                    'mailSent' => false,
                    'message' => 'Email delivery failed in local environment. Use the development code.',
                    'devCode' => $code,
                    'smtpError' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code. Please try again.'
            ], 500);
        }
    }

    // Verify code
    public function verifyCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Email and code are required'
            ], 400);
        }

        $email = $request->email;
        $code = $request->code;

        $storedData = Cache::get("verification_code_{$email}");

        if (!$storedData) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired code'
            ], 400);
        }

        if (now()->greaterThan($storedData['expires'])) {
            Cache::forget("verification_code_{$email}");
            return response()->json([
                'success' => false,
                'message' => 'Code has expired'
            ], 400);
        }

        if ($storedData['code'] !== $code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code'
            ], 400);
        }

        // Code is valid - remove it
        Cache::forget("verification_code_{$email}");
        Cache::put("password_reset_verified_{$email}", true, 600); // 10 minutes

        return response()->json([
            'success' => true,
            'message' => 'Code verified successfully'
        ]);
    }
}
