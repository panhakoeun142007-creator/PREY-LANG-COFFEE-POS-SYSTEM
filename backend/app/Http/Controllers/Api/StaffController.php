<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * Display a listing of staff.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Staff::query()->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($inner) use ($search) {
                $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $paginator = $query->paginate(20);
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Staff $staff) => $this->serializeStaff($staff))
        );

        return response()->json($paginator);
    }

    /**
     * Store a newly created staff.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('staffs', 'email')],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'salary' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $validated['profile_image'] = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
        }

        $validated['password_plain'] = $validated['password'];
        $staff = Staff::create($validated);

        return response()->json($this->serializeStaff($staff), 201);
    }

    /**
     * Display the specified staff.
     */
    public function show(Staff $staff): JsonResponse
    {
        return response()->json($this->serializeStaff($staff));
    }

    /**
     * Update the specified staff.
     */
    public function update(Request $request, Staff $staff): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('staffs', 'email')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'salary' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);

        if (array_key_exists('password', $validated) && !$validated['password']) {
            unset($validated['password']);
        }

        if (array_key_exists('password', $validated)) {
            $validated['password_plain'] = $validated['password'];
        }

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $validated['profile_image'] = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
        }

        $staff->update($validated);

        return response()->json($this->serializeStaff($staff->fresh()));
    }

    /**
     * Remove the specified staff.
     */
    public function destroy(Staff $staff): JsonResponse
    {
        $staff->delete();

        return response()->json(['message' => 'Staff deleted']);
    }

    private function serializeStaff(Staff $staff): array
    {
        $payload = $staff->toArray();
        $payload['profile_image_url'] = null;

        if ($staff->profile_image) {
            if (str_starts_with($staff->profile_image, 'data:image')) {
                $payload['profile_image_url'] = $staff->profile_image;
            } else {
                $base = request()->getSchemeAndHttpHost();
                $payload['profile_image_url'] = $base . '/storage/' . ltrim($staff->profile_image, '/');
            }
        }
        $payload['password_plain'] = $staff->password_plain;

        return $payload;
    }
}
