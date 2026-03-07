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
        // Schema::create('products', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('category_id')->constrained()->cascadeOnDelete();
        //     $table->string('name', 160);
        //     $table->string('sku', 80)->unique()->nullable();
        //     $table->decimal('price_small', 10, 2)->default(3.00);
        //     $table->decimal('price_medium', 10, 2)->default(4.50);
        //     $table->decimal('price_large', 10, 2)->default(5.50);
        //     $table->unsignedInteger('stock_quantity')->default(0);
        //     $table->unsignedInteger('low_stock_threshold')->default(5);
        //     $table->boolean('is_active')->default(true);
        //     $table->timestamps();
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Schema::dropIfExists('products');
    }
};
