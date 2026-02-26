<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Get the current authenticated user.
     */
    public function me(): JsonResponse
    {
        // For demo purposes, return the first admin user
        // In production, this would use: Auth::user()
        $user = User::where('role', 'admin')
            ->where('is_active', true)
            ->first();

        if (!$user) {
            // Fallback: return any active user or create a demo response
            $user = User::where('is_active', true)->first();
        }

        if (!$user) {
            // Return demo admin user if no users exist
            return response()->json([
                'id' => 1,
                'name' => 'Admin User',
                'email' => 'admin@preylang.com',
                'role' => 'admin',
                'initials' => 'AD',
            ]);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'admin',
            'initials' => $this->getInitials($user->name),
        ]);
    }

    /**
     * Get user initials from name.
     */
    private function getInitials(string $name): string
    {
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
        }
        return strtoupper(substr($name, 0, 2));
    }
}
 