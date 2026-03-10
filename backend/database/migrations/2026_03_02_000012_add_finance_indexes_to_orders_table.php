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
        if (!Schema::hasTable('orders')) {
            return;
        }

        try {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'orders_status_created_at_idx');
            });
        } catch (\Throwable) {
            // Ignore if the index already exists on environments with manual DB changes.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        try {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex('orders_status_created_at_idx');
            });
        } catch (\Throwable) {
            // Ignore if the index does not exist.
        }
    }
};
