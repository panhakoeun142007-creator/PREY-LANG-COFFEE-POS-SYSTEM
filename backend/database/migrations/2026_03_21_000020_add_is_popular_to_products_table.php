<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_popular')->default(false)->after('is_available');
            $table->index('is_popular');
            $table->index(['category_id', 'is_popular']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_popular']);
            $table->dropIndex(['category_id', 'is_popular']);
            $table->dropColumn('is_popular');
        });
    }
};
