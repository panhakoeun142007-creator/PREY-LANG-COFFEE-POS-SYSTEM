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
        if (!Schema::hasTable('ingredients')) {
            return;
        }

        if (!Schema::hasColumn('ingredients', 'category_id')) {
            return;
        }

        if (!Schema::hasColumn('ingredients', 'category')) {
            return;
        }

        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('ingredients')) {
            return;
        }

        if (Schema::hasColumn('ingredients', 'category')) {
            return;
        }

        Schema::table('ingredients', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('name');
        });
    }
};
