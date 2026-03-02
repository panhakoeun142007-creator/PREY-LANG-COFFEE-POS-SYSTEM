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

        $userId = Cache::get("api_auth_token:{$token}");
        if (!$userId) {
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
