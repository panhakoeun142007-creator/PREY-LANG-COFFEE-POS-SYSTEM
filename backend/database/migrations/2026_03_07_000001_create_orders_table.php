<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            return;
        }

        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('table_no');
            $table->string('status')->default('Pending');
            $table->json('items');
            $table->string('time_elapsed')->default('0m');
            $table->string('customer_name')->nullable();
            $table->decimal('total', 10, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
