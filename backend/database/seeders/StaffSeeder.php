<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create staff users
        $staff = [
            [
                'name' => 'Panha Koeun',
                'email' => 'panha.koeun@student.passerellesnumeriques.org',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'is_active' => true,
                'staff_id' => 'STF001',
                'pin' => Hash::make('123456'),
            ],
           
        ];

        foreach ($staff as $data) {
            $user = User::where('staff_id', $data['staff_id'])->first();
            if ($user) {
                // Update existing user's PIN
                $user->pin = $data['pin'];
                $user->save();
            } else {
                // Create new user
                User::create($data);
            }
        }

        echo "Staff users created successfully!\n";
    }
}
