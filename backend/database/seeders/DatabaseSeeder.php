<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@dailygrind.com')
            ->orWhere('email', 'kingvoeun3@gmail.com')
            ->first();

        if ($admin) {
            $admin->name = 'Admin User';
            $admin->email = 'kingvoeun3@gmail.com';
            $admin->password = 'king123!@#';
            $admin->email_verified_at = now();
            $admin->save();
        } else {
            User::create([
                'name' => 'Admin User',
                'email' => 'kingvoeun3@gmail.com',
                'password' => 'king123!@#',
                'email_verified_at' => now(),
            ]);
        }

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );
    }
}
