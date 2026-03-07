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
        // Schema::create('recipes', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('product_id')->constrained()->cascadeOnDelete();
        //     $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
        //     $table->decimal('amount_small', 10, 2)->default(0.00);
        //     $table->decimal('amount_medium', 10, 2)->default(0.00);
        //     $table->decimal('amount_large', 10, 2)->default(0.00);
        //     $table->timestamps();
            
        //     $table->unique(['product_id', 'ingredient_id']);
        //     $table->index('ingredient_id');
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Schema::dropIfExists('recipes');
    }
};
