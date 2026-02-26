<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PasswordResetToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Staff login
     */
    public function staffLogin(Request $request): JsonResponse
    {
        $request->validate([
            'staff_id' => 'required|string',
            'pin' => 'required|string',
        ]);

        $user = User::where('staff_id', $request->staff_id)->first();

        if (!$user || !Hash::check($request->pin, $user->pin)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Account is inactive'
            ], 403);
        }

        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'staff_id' => $user->staff_id,
                'role' => $user->role,
                'name' => $user->name,
            ]
        ]);
    }

    /**
     * Get all staff members (for admin)
     */
    public function getAllStaff(): JsonResponse
    {
        $staff = User::where('role', '!=', 'admin')->get(['id', 'name', 'email', 'staff_id', 'role', 'is_active', 'created_at']);
        
        return response()->json([
            'data' => $staff
        ]);
    }

    /**
     * Send password reset email to staff member (admin action)
     */
    public function sendPasswordReset(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer',
        ]);

        $user = User::find($request->user_id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        if (!$user->email) {
            return response()->json([
                'message' => 'User has no email address'
            ], 400);
        }

        // Generate temporary password
        $temporaryPassword = Str::random(10);
        
        // Update user password (hashed)
        $user->pin = Hash::make($temporaryPassword);
        $user->save();

        // Send email with temporary password
        try {
            // For demo purposes, we'll just log the email
            \Log::info('Staff password reset email (admin)', [
                'email' => $user->email,
                'name' => $user->name,
                'staff_id' => $user->staff_id,
                'temporary_password' => $temporaryPassword,
            ]);

            return response()->json([
                'message' => 'Password reset email sent successfully',
                'temporary_password' => $temporaryPassword // For demo purposes only
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send email. Please try again.'
            ], 500);
        }
    }

    /**
     * Request password reset - generates token
     * DEBUG: Added logging to diagnose token flow usage
     */
    public function requestPasswordReset(Request $request): JsonResponse
    {
        \Log::info('[DEBUG] requestPasswordReset called', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString(),
        ]);
        
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            \Log::warning('[DEBUG] requestPasswordReset - user not found', [
                'email' => $request->email,
            ]);
            return response()->json([
                'message' => 'If the email exists, a verification token will be sent.'
            ], 200);
        }

        \Log::info('[DEBUG] requestPasswordReset - user found', [
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ]);

        // Invalidate any existing unused tokens for this user
        $deletedCount = PasswordResetToken::where('user_id', $user->id)
            ->where('is_used', false)
            ->delete();
            
        \Log::info('[DEBUG] Old tokens deleted', ['count' => $deletedCount]);

        // Generate 6-digit token
        $token = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Create token record (configurable validity - changed from 30 seconds for usability)
        $expiresInSeconds = env('PASSWORD_RESET_TOKEN_EXPIRY', 300); // Default 5 minutes
        $passwordToken = PasswordResetToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addSeconds($expiresInSeconds),
            'is_used' => false,
        ]);

        \Log::info('[DEBUG] Password reset token created', [
            'token_id' => $passwordToken->id,
            'token' => $token,
            'expires_at' => $passwordToken->expires_at,
            'expires_in_seconds' => $expiresInSeconds,
        ]);

        // Send email with the token
        try {
            \Log::info('[DEBUG] Attempting to send password reset email');
            \Mail::to($user->email)->send(new \App\Mail\PasswordResetTokenMail(
                $token,
                $user->name,
                $expiresInSeconds
            ));
            \Log::info('[DEBUG] Password reset email sent successfully');
        } catch (\Exception $e) {
            \Log::error('[DEBUG] Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'If the email exists, a verification token will be sent.',
            'token_sent_to' => substr($user->email, 0, 3) . '***@' . substr($user->email, strrpos($user->email, '@')),
            'expires_in' => $expiresInSeconds,
        ], 200);
    }

    /**
     * Verify token and reset password
     * DEBUG: Added logging to diagnose token verification flow
     */
    public function verifyAndResetPassword(Request $request): JsonResponse
    {
        \Log::info('[DEBUG] verifyAndResetPassword called', [
            'email' => $request->email,
            'token_length' => strlen($request->token),
            'ip' => $request->ip(),
            'timestamp' => now()->toISOString(),
        ]);
        
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string|size:6',
            'new_pin' => 'required|string|min:4|max:10|regex:/^\\d+$/',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            \Log::warning('[DEBUG] verifyAndResetPassword - user not found', [
                'email' => $request->email,
            ]);
            return response()->json([
                'message' => 'Invalid token or email'
            ], 400);
        }

        \Log::info('[DEBUG] verifyAndResetPassword - user found', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        // Find valid token
        $passwordToken = PasswordResetToken::where('user_id', $user->id)
            ->where('token', $request->token)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$passwordToken) {
            // Check if token exists but is expired or used
            $existingToken = PasswordResetToken::where('user_id', $user->id)
                ->where('token', $request->token)
                ->first();
                
            \Log::warning('[DEBUG] verifyAndResetPassword - token invalid', [
                'user_id' => $user->id,
                'token_exists' => $existingToken ? true : false,
                'token_is_used' => $existingToken ? $existingToken->is_used : null,
                'token_expired' => $existingToken ? ($existingToken->expires_at < now()) : null,
                'current_time' => now()->toISOString(),
            ]);
            
            return response()->json([
                'message' => 'Invalid or expired token'
            ], 400);
        }

        \Log::info('[DEBUG] verifyAndResetPassword - token valid', [
            'token_id' => $passwordToken->id,
            'expires_at' => $passwordToken->expires_at,
        ]);

        // Mark token as used
        $passwordToken->is_used = true;
        $passwordToken->save();

        // Update user PIN
        $user->pin = Hash::make($request->new_pin);
        $user->save();

        \Log::info('[DEBUG] Password reset successful', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return response()->json([
            'message' => 'Password reset successfully'
        ], 200);
    }

    /**
     * Generate temporary password and send to staff email (legacy)
     * DEBUG: This is the endpoint currently being used by frontend
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        \Log::info('[DEBUG] forgotPassword (LEGACY) called', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'timestamp' => now()->toISOString(),
            'warning' => 'This is the LEGACY endpoint - should migrate to token-based flow',
        ]);
        
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'If the email exists, a temporary password will be sent.'
            ], 200);
        }

        // Generate temporary password
        $temporaryPassword = Str::random(10);
        
        // Update user password (hashed)
        $user->pin = Hash::make($temporaryPassword);
        $user->save();

        // Log the email
        \Log::info('[DEBUG] Staff password reset (LEGACY)', [
            'email' => $user->email,
            'name' => $user->name,
            'staff_id' => $user->staff_id,
            'temporary_password' => $temporaryPassword,
            'security_note' => 'TEMPORARY PASSWORD GENERATED - LESS SECURE THAN TOKEN FLOW',
        ]);

        return response()->json([
            'message' => 'If the email exists, a temporary password will be sent.'
        ], 200);
    }

    /**
     * Database health check
     */
    public function dbHealth(): JsonResponse
    {
        try {
            \DB::connection()->getPdo();
            return response()->json([
                'status' => 'healthy',
                'database' => 'connected'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'database' => 'disconnected',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
