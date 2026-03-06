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
        if (! Schema::hasTable('expenses')) {
            return;
        }

        $addCreatedAt = ! Schema::hasColumn('expenses', 'created_at');
        $addUpdatedAt = ! Schema::hasColumn('expenses', 'updated_at');

        if (! $addCreatedAt && ! $addUpdatedAt) {
            return;
        }

        Schema::table('expenses', function (Blueprint $table) use ($addCreatedAt, $addUpdatedAt) {
            if ($addCreatedAt) {
                $table->timestamp('created_at')->nullable();
            }

            if ($addUpdatedAt) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('expenses')) {
            return;
        }

        $dropCreatedAt = Schema::hasColumn('expenses', 'created_at');
        $dropUpdatedAt = Schema::hasColumn('expenses', 'updated_at');

        if (! $dropCreatedAt && ! $dropUpdatedAt) {
            return;
        }

        Schema::table('expenses', function (Blueprint $table) use ($dropCreatedAt, $dropUpdatedAt) {
            if ($dropCreatedAt) {
                $table->dropColumn('created_at');
            }

            if ($dropUpdatedAt) {
                $table->dropColumn('updated_at');
            }
        });
    }
};
