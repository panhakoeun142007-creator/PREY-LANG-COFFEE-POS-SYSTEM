<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use Illuminate\Database\Seeder;

class DiningTableSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            ['name' => 'Table A1', 'seats' => 4, 'status' => 'available', 'is_active' => true, 'qr_code' => 'QR-TABLE-A1'],
            ['name' => 'Table A4', 'seats' => 4, 'status' => 'available', 'is_active' => true, 'qr_code' => 'QR-TABLE-A4'],
            ['name' => 'Table B1', 'seats' => 4, 'status' => 'available', 'is_active' => true, 'qr_code' => 'QR-TABLE-B1'],
            ['name' => 'Table B3', 'seats' => 4, 'status' => 'available', 'is_active' => true, 'qr_code' => 'QR-TABLE-B3'],
            ['name' => 'Table C2', 'seats' => 4, 'status' => 'available', 'is_active' => true, 'qr_code' => 'QR-TABLE-C2'],
            ['name' => 'Table D2', 'seats' => 4, 'status' => 'available', 'is_active' => true, 'qr_code' => 'QR-TABLE-D2'],
        ];

        foreach ($tables as $table) {
            DiningTable::query()->updateOrCreate(
                ['name' => $table['name']],
                $table
            );
        }
    }
}
