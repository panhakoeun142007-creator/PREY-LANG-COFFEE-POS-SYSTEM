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
        Schema::create('order_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('actor_type', 20);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_name');
            $table->string('action_type', 50);
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'created_at']);
            $table->index(['actor_type', 'actor_id']);
            $table->index(['action_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_actions');
    }
};
