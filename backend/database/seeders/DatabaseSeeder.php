<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
            DiningTableSeeder::class,
            IngredientSeeder::class,
            RecipeSeeder::class,
            OrderSeeder::class,
        ]);
        
        // Create admin user with proper role and is_active
        $adminEmailEnv = env('ADMIN_EMAIL');
        $adminPasswordEnv = env('ADMIN_PASSWORD');

        if (app()->environment('production')) {
            if (!is_string($adminEmailEnv) || trim($adminEmailEnv) === '') {
                throw new RuntimeException('Missing ADMIN_EMAIL in backend .env (required in production before db:seed).');
            }
            if (!is_string($adminPasswordEnv) || trim($adminPasswordEnv) === '') {
                throw new RuntimeException('Missing ADMIN_PASSWORD in backend .env (required in production before db:seed).');
            }
        }

        $adminEmail = (string) ($adminEmailEnv ?: 'admin@example.com');
        $adminName = (string) env('ADMIN_NAME', 'Admin User');
        $adminPassword = (string) ($adminPasswordEnv ?: 'ChangeMe123!');

        $admin = User::where('email', $adminEmail)->first();

        if ($admin) {
            $admin->name = $adminName;
            $admin->email = $adminEmail;
            $admin->password = Hash::make($adminPassword);
            $admin->role = 'admin';
            $admin->is_active = true;
            $admin->email_verified_at = now();
            $admin->save();
        } else {
            User::create([
                'name' => $adminName,
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
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
        $staffEmail = (string) env('STAFF_EMAIL', 'staff@preylang.com');
        $staffName = (string) env('STAFF_NAME', 'Staff Member');
        $staffPassword = (string) env('STAFF_PASSWORD', 'staff123');

        Staff::updateOrCreate(
            ['email' => $staffEmail],
            [
                'name' => $staffName,
                'password' => Hash::make($staffPassword),
                'password_plain' => $staffPassword,
                'salary' => 250.00,
                'is_active' => true,
            ]
        );
    }
}
