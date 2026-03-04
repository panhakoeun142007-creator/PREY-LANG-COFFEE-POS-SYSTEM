<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'name' => 'Admin User',
                'role' => 'admin',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@pos.com'],
            [
                'name' => 'Staff User',
                'role' => 'staff',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'cashier@pos.com'],
            [
                'name' => 'Cashier User',
                'role' => 'cashier',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );
    }
}
