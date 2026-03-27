<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Schema;

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

        $adminName = (string) env('ADMIN_NAME', 'Admin User');
        $adminEmail = (string) env('ADMIN_EMAIL', 'panha.koeun142007@gmail.com');
        $adminPassword = (string) env('ADMIN_PASSWORD', 'panha123!@#');

        /** @var array<string, mixed> $adminAttributes */
        $adminAttributes = [
            'name' => $adminName,
            'email' => $adminEmail,
            // Uses the model "hashed" cast to store a secure hash.
            'password' => $adminPassword,
        ];

        if (Schema::hasColumn('users', 'role')) {
            $adminAttributes['role'] = 'admin';
        }

        if (Schema::hasColumn('users', 'is_active')) {
            $adminAttributes['is_active'] = true;
        }

        $admin = User::query()->updateOrCreate(['email' => $adminEmail], $adminAttributes);

        if (Schema::hasColumn('users', 'email_verified_at') && !$admin->email_verified_at) {
            $admin->forceFill(['email_verified_at' => now()])->save();
        }

        if (app()->environment(['local', 'testing'])) {
            /** @var array<string, mixed> $demoAttributes */
            $demoAttributes = [
                'name' => 'Test User',
                'password' => 'password',
            ];

            if (Schema::hasColumn('users', 'role')) {
                $demoAttributes['role'] = 'admin';
            }

            if (Schema::hasColumn('users', 'is_active')) {
                $demoAttributes['is_active'] = true;
            }

            $demoUser = User::query()->updateOrCreate(['email' => 'test@example.com'], $demoAttributes);

            if (Schema::hasColumn('users', 'email_verified_at') && !$demoUser->email_verified_at) {
                $demoUser->forceFill(['email_verified_at' => now()])->save();
            }
        }

        $staffName = (string) env('STAFF_NAME', 'Staff Member');
        $staffEmail = (string) env('STAFF_EMAIL', 'staff@preylang.com');
        $staffPassword = (string) env('STAFF_PASSWORD', 'staff123');

        Staff::query()->updateOrCreate(
            ['email' => $staffEmail],
            [
                'name' => $staffName,
                'password' => $staffPassword,
                'password_plain' => $staffPassword,
                'salary' => 250.00,
                'is_active' => true,
            ]
        );
    }
}
