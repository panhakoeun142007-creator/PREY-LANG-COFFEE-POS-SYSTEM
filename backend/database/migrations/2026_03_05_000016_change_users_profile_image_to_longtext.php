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

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!$this->supportsModifyColumn()) {
            return;
        }

        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'profile_image')) {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY profile_image LONGTEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!$this->supportsModifyColumn()) {
            return;
        }

        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'profile_image')) {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY profile_image VARCHAR(255) NULL');
    }
};
