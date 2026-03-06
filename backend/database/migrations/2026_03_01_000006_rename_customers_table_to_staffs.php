<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('customers') && !Schema::hasTable('staffs')) {
            Schema::rename('customers', 'staffs');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('staffs') && !Schema::hasTable('customers')) {
            Schema::rename('staffs', 'customers');
        }
    }
};
