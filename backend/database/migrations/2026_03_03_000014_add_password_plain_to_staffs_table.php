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
            if (!Schema::hasColumn('staffs', 'password_plain')) {
                $table->text('password_plain')->nullable()->after('password');
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
            if (Schema::hasColumn('staffs', 'password_plain')) {
                $table->dropColumn('password_plain');
            }
        });
    }
};
