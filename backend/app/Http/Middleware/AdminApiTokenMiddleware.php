<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AdminApiTokenMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $session = Cache::get("api_auth_token:{$token}");
        if (!$session) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Backward compatibility for old token format: token => admin user id
        if (is_int($session) || ctype_digit((string) $session)) {
            $session = [
                'subject_type' => 'admin',
                'subject_id' => (int) $session,
            ];
        }

        if (!is_array($session) || ($session['subject_type'] ?? null) !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $userId = (int) ($session['subject_id'] ?? 0);
        if ($userId <= 0) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = User::query()->find($userId);
        if (!$user || !$user->is_active || $user->role !== 'admin') {
            Cache::forget("api_auth_token:{$token}");

            return response()->json(['message' => 'Forbidden'], 403);
        }

        Auth::setUser($user);

        return $next($request);
    }
}
