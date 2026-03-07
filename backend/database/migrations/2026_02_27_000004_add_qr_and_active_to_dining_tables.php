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
        // Schema::table('dining_tables', function (Blueprint $table) {
        //     $table->boolean('is_active')->default(true)->after('status');
        //     $table->string('qr_code', 191)->nullable()->unique()->after('is_active');
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Schema::table('dining_tables', function (Blueprint $table) {
        //     $table->dropUnique(['qr_code']);
        //     $table->dropColumn(['is_active', 'qr_code']);
        // });
    }
};
