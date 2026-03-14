<?php

namespace App\Http\Middleware;

use App\Models\Staff;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class StaffApiTokenMiddleware
{
    /**
     * Handle an incoming request.
     * Allows both admin and staff users.
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
        if (is_int($session) || (is_string($session) && ctype_digit($session))) {
            $session = [
                'subject_type' => 'admin',
                'subject_id' => (int) $session,
            ];
        }

        if (!is_array($session) || !isset($session['subject_type'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $subjectType = $session['subject_type'];
        $subjectId = (int) ($session['subject_id'] ?? 0);

        if ($subjectId <= 0) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if it's an admin user
        if ($subjectType === 'admin') {
            $user = User::query()->find($subjectId);
            $hasAdminColumns = Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'is_active');
            
            if (
                !$user ||
                ($hasAdminColumns && (!$user->is_active || $user->role !== 'admin'))
            ) {
                Cache::forget("api_auth_token:{$token}");
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // Set the authenticated user
            Auth::setUser($user);
            return $next($request);
        }

        // Check if it's a staff user
        if ($subjectType === 'staff') {
            $staff = Staff::query()->find($subjectId);
            
            if (!$staff || !$staff->is_active) {
                Cache::forget("api_auth_token:{$token}");
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // Set the authenticated staff
            Auth::setUser($staff);
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }
}
