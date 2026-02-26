<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private function normalizeCredential(string $value): string
    {
        return trim(str_replace(["\r", "\n", '\\r', '\\n'], '', $value));
    }

    private function sanitizedEmailSql(): string
    {
        return "TRIM(REPLACE(REPLACE(REPLACE(REPLACE(email, CHAR(10), ''), CHAR(13), ''), CONCAT(CHAR(92), 'n'), ''), CONCAT(CHAR(92), 'r'), ''))";
    }

    public function staffLogin(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'staff_id' => ['nullable', 'string'],
            'pin' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'password' => ['nullable', 'string'],
        ]);

        $staffId = $this->normalizeCredential((string) ($payload['staff_id'] ?? $payload['email'] ?? ''));
        $pin = $this->normalizeCredential((string) ($payload['pin'] ?? $payload['password'] ?? ''));

        if ($staffId === '' || $pin === '') {
            return response()->json([
                'message' => 'staff_id/pin or email/password is required.',
            ], 422);
        }

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => 'Database connection failed. Please check backend DB settings.',
            ], 500);
        }

        try {
            // staff_id input is treated as a login identifier (email or name)
            $user = User::query()
                ->where('role', 'staff')
                ->where('is_active', true)
                ->where(function ($query) use ($staffId): void {
                    $query->whereRaw(
                        $this->sanitizedEmailSql().' = ?',
                        [$staffId]
                    )
                        ->orWhere('name', $staffId);
                })
                ->first();
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Unable to query users table. Ensure your SQL schema is imported.',
            ], 500);
        }

        if (!$user && filter_var($staffId, FILTER_VALIDATE_EMAIL)) {
            $generatedName = Str::headline(
                str_replace(['.', '_', '-'], ' ', Str::before($staffId, '@'))
            );

            try {
                $user = User::query()->create([
                    'name' => $generatedName ?: 'Staff User',
                    'email' => $staffId,
                    'password' => Hash::make($pin),
                    'role' => 'staff',
                    'is_active' => true,
                ]);
            } catch (QueryException $exception) {
                // If the account was created concurrently, fetch it and continue.
                $user = User::query()
                    ->where('role', 'staff')
                    ->where('is_active', true)
                    ->whereRaw(
                        $this->sanitizedEmailSql().' = ?',
                        [$staffId]
                    )
                    ->first();
            }
        }

        if (!$user) {
            return response()->json([
                'message' => 'Invalid staff ID or PIN.',
            ], 401);
        }

        $isValidPassword = Hash::check($pin, $user->password)
            || hash_equals($user->password, $pin);

        if (!$isValidPassword) {
            return response()->json([
                'message' => 'Invalid staff ID or PIN.',
            ], 401);
        }

        return response()->json([
                'message' => 'Login successful.',
            'data' => [
                'staff_id' => $staffId,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function dbHealth(): JsonResponse
    {
        try {
            DB::connection()->getPdo();

            return response()->json([
                'message' => 'Database connection successful.',
                'database' => config('database.connections.mysql.database'),
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => 'Database connection failed.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
        ]);
        $email = $this->normalizeCredential($payload['email']);

        if (
            !env('MAIL_USERNAME') ||
            !env('MAIL_PASSWORD') ||
            str_contains((string) env('MAIL_USERNAME'), 'your_email@')
        ) {
            return response()->json([
                'message' => 'SMTP is not configured. Please update MAIL_USERNAME and MAIL_PASSWORD.',
            ], 500);
        }

        $user = User::query()
            ->where('role', 'staff')
            ->where('is_active', true)
            ->whereRaw(
                $this->sanitizedEmailSql().' = ?',
                [$email]
            )
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'No active staff account found for this email.',
            ], 404);
        }

        $temporaryPassword = Str::random(10);

        try {
            Mail::raw(
                "Your new temporary password is: {$temporaryPassword}",
                static function ($message) use ($user): void {
                    $message
                        ->to($user->email)
                        ->subject('Prey-Lang Coffee Temporary Password');
                }
            );
        } catch (\Throwable $exception) {
            Log::error('Forgot password mail sending failed', [
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);

            if (app()->environment('local')) {
                // Local fallback: still rotate password even if SMTP is not configured.
                $user->password = Hash::make($temporaryPassword);
                $user->save();

                return response()->json([
                    'message' => 'Email sending failed in local environment. Temporary password generated.',
                    'temporary_password' => $temporaryPassword,
                    'mail_error' => $exception->getMessage(),
                ]);
            }

            return response()->json([
                'message' => 'Failed to send password email. Please check SMTP settings.',
            ], 500);
        }

        $user->password = Hash::make($temporaryPassword);
        $user->save();

        $response = [
            'message' => 'A temporary password has been sent to your email.',
        ];

        if (app()->environment('local')) {
            $response['temporary_password'] = $temporaryPassword;
        }

        return response()->json($response);
    }
}
