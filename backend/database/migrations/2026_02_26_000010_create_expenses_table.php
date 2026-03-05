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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title', 100);
            $table->decimal('amount', 10, 2);
            $table->enum('category', ['ingredients', 'utilities', 'salary', 'rent', 'other'])->default('other');
            $table->date('date');
            $table->text('note')->nullable();
            $table->timestamps();
            
            $table->index('date');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
