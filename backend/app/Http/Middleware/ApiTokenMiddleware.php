<?php

namespace App\Http\Middleware;

use App\Models\Staff;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
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

        if (is_int($session) || (is_string($session) && ctype_digit($session))) {
            $session = [
                'subject_type' => 'admin',
                'subject_id' => (int) $session,
            ];
        }

        if (!is_array($session) || !in_array(($session['subject_type'] ?? null), ['admin', 'staff'], true)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $subjectType = (string) ($session['subject_type'] ?? '');
        $subjectId = (int) ($session['subject_id'] ?? 0);
        $subjectModel = (string) ($session['subject_model'] ?? '');
        if ($subjectId <= 0) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($subjectType === 'admin') {
            $user = User::query()->find($subjectId);
            if (!$user || !$user->is_active || $user->role !== 'admin') {
                Cache::forget("api_auth_token:{$token}");

                return response()->json(['message' => 'Forbidden'], 403);
            }

            Auth::setUser($user);
            $request->attributes->set('api_subject_type', 'admin');
            $request->attributes->set('api_subject_id', $subjectId);

            return $next($request);
        }

        if ($subjectModel === 'user') {
            $staffUser = User::query()->find($subjectId);
            if (!$staffUser || !$staffUser->is_active || $staffUser->role !== 'staff') {
                Cache::forget("api_auth_token:{$token}");

                return response()->json(['message' => 'Forbidden'], 403);
            }

            $request->attributes->set('api_subject_type', 'staff');
            $request->attributes->set('api_subject_id', $subjectId);
            $request->attributes->set('api_subject_source', 'user');

            return $next($request);
        }

        $staff = Staff::query()->find($subjectId);
        if (!$staff || !$staff->is_active) {
            Cache::forget("api_auth_token:{$token}");

            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->attributes->set('api_subject_type', 'staff');
        $request->attributes->set('api_subject_id', $subjectId);
        $request->attributes->set('api_subject_source', 'staff');

        return $next($request);
    }
}
