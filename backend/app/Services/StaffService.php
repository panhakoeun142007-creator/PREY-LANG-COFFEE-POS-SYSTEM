<?php

namespace App\Services;

use App\Models\Staff;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rule;

class StaffService
{
    public function list(Request $request): LengthAwarePaginator
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

        return $query->paginate(20);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('staffs', 'email')],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'salary' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);
    }

    public function create(Request $request, array $validated): Staff
    {
        $validated = $this->hydrateProfileImage($request, $validated);
        $validated['password_plain'] = $validated['password'];

        return Staff::create($validated);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request, Staff $staff): array
    {
        return $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('staffs', 'email')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'salary' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
        ]);
    }

    public function update(Request $request, Staff $staff, array $validated): Staff
    {
        if (array_key_exists('password', $validated) && !$validated['password']) {
            unset($validated['password']);
        }

        if (array_key_exists('password', $validated)) {
            $validated['password_plain'] = $validated['password'];
        }

        $validated = $this->hydrateProfileImage($request, $validated);

        $staff->update($validated);

        return $staff->fresh();
    }

    public function delete(Staff $staff): void
    {
        $staff->delete();
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(Staff $staff): array
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

        try {
            $payload['password_plain'] = $staff->password_plain;
        } catch (DecryptException) {
            $payload['password_plain'] = $staff->getRawOriginal('password_plain') ?? '';
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function hydrateProfileImage(Request $request, array $validated): array
    {
        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $mime = $file->getMimeType() ?: 'application/octet-stream';
            $validated['profile_image'] = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($file->getRealPath()));
        }

        return $validated;
    }
}
