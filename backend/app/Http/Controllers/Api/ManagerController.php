<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class ManagerController extends Controller
{
    /**
     * Return the active admin account used as "manager" for staff.
     */
    public function show(): JsonResponse
    {
        $hasAdminColumns = Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'is_active');

        $query = User::query()->orderBy('id');
        if ($hasAdminColumns) {
            $query->where('role', 'admin')->where('is_active', true);
        }

        $manager = $query->first();
        if (!$manager) {
            return response()->json(['message' => 'Manager not found'], 404);
        }

        $imageUrl = null;
        if ($manager->profile_image) {
            if (str_starts_with($manager->profile_image, 'data:')) {
                $imageUrl = $manager->profile_image;
            } else {
                $base = request()->getSchemeAndHttpHost();
                $imageUrl = $base . '/media/' . ltrim($manager->profile_image, '/');
            }
        }

        return response()->json([
            'id' => $manager->id,
            'name' => $manager->name,
            'email' => $manager->email,
            'role' => $manager->role ?? 'admin',
            'profile_image_url' => $imageUrl,
        ]);
    }
}
