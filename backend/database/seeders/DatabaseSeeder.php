<?php

namespace Database\Seeders;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user with proper role and is_active
        $admin = User::where('email', 'panha.koeun142007@gmail.com')->first();

        if ($admin) {
            $admin->name = 'Admin User';
            $admin->email = 'panha.koeun142007@gmail.com';
            $admin->password = Hash::make('panha123!@#');
            $admin->role = 'admin';
            $admin->is_active = true;
            $admin->email_verified_at = now();
            $admin->save();
        } else {
            User::create([
                'name' => 'Admin User',
                'email' => 'panha.koeun142007@gmail.com',
                'password' => Hash::make('panha123!@#'),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }

        // Also ensure test user exists
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create staff user
        Staff::updateOrCreate(
            ['email' => 'staff@preylang.com'],
            [
                'name' => 'Staff Member',
                'password' => Hash::make('staff123'),
                'password_plain' => 'staff123',
                'salary' => 250.00,
                'is_active' => true,
            ]
        );
    }
}
