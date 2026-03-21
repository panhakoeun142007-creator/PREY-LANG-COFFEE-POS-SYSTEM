<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('discount_type', ['percentage', 'fixed', 'promo'])->nullable()->after('is_popular');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            $table->dateTime('discount_start_date')->nullable()->after('discount_value');
            $table->dateTime('discount_end_date')->nullable()->after('discount_start_date');
            $table->boolean('discount_active')->default(false)->after('discount_end_date');
            
            // Index for querying active discounts
            $table->index(['discount_active', 'discount_start_date', 'discount_end_date'], 'products_discount_idx');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['discount_active', 'discount_start_date', 'discount_end_date']);
            $table->dropColumn([
                'discount_type',
                'discount_value',
                'discount_start_date',
                'discount_end_date',
                'discount_active',
            ]);
        });
    }
};
