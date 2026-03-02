<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('staffs')) {
            return;
        }

        Schema::table('staffs', function (Blueprint $table) {
            if (!Schema::hasColumn('staffs', 'profile_image')) {
                $table->string('profile_image')->nullable()->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('staffs')) {
            return;
        }

        Schema::table('staffs', function (Blueprint $table) {
            if (Schema::hasColumn('staffs', 'profile_image')) {
                $table->dropColumn('profile_image');
            }
        });
    }
};
