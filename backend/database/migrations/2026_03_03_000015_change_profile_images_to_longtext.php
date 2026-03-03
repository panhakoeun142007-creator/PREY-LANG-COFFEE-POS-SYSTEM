<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            return;
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'profile_image')) {
            DB::statement('ALTER TABLE `users` MODIFY `profile_image` LONGTEXT NULL');
        }

        if (Schema::hasTable('staffs') && Schema::hasColumn('staffs', 'profile_image')) {
            DB::statement('ALTER TABLE `staffs` MODIFY `profile_image` LONGTEXT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            return;
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'profile_image')) {
            DB::statement('ALTER TABLE `users` MODIFY `profile_image` VARCHAR(255) NULL');
        }

        if (Schema::hasTable('staffs') && Schema::hasColumn('staffs', 'profile_image')) {
            DB::statement('ALTER TABLE `staffs` MODIFY `profile_image` VARCHAR(255) NULL');
        }
    }
};
