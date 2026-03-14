<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function supportsModifyColumn(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb'], true);
    }

    public function up(): void
    {
        if (!$this->supportsModifyColumn()) {
            return;
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'profile_image')) {
            DB::statement('ALTER TABLE `users` MODIFY `profile_image` LONGTEXT NULL');
        }

        if (Schema::hasTable('staffs') && Schema::hasColumn('staffs', 'profile_image')) {
            DB::statement('ALTER TABLE `staffs` MODIFY `profile_image` LONGTEXT NULL');
        }
    }

    public function down(): void
    {
        // Keep as LONGTEXT; no down migration.
    }
};

