<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('staffs') || !Schema::hasColumn('staffs', 'password')) {
            return;
        }

        DB::table('staffs')
            ->whereNotNull('password')
            ->orderBy('id')
            ->select('id', 'password')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    $password = (string) $row->password;
                    if ($password === '' || !Hash::needsRehash($password)) {
                        continue;
                    }

                    DB::table('staffs')
                        ->where('id', $row->id)
                        ->update(['password' => Hash::make($password)]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible: hashed passwords cannot be transformed back.
    }
};
