<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('ingredients', 'category_id')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->foreignId('category_id')
                    ->nullable()
                    ->after('name')
                    ->constrained('categories')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasColumn('ingredients', 'category')) {
            $ingredients = DB::table('ingredients')
                ->select('id', 'category')
                ->get();

            foreach ($ingredients as $ingredient) {
                $name = trim((string) ($ingredient->category ?? ''));
                if ($name === '' || strcasecmp($name, 'General') === 0) {
                    continue;
                }

                $categoryId = DB::table('categories')
                    ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                    ->value('id');

                if (!$categoryId) {
                    $timestamp = now();
                    $categoryId = DB::table('categories')->insertGetId([
                        'name' => $name,
                        'description' => 'Auto-created from ingredient categories',
                        'is_active' => true,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                }

                DB::table('ingredients')
                    ->where('id', $ingredient->id)
                    ->update(['category_id' => $categoryId]);
            }

            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropColumn('category');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('ingredients', 'category')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->string('category', 100)->nullable()->after('name');
            });
        }

        if (Schema::hasColumn('ingredients', 'category_id')) {
            $ingredients = DB::table('ingredients')
                ->leftJoin('categories', 'ingredients.category_id', '=', 'categories.id')
                ->select('ingredients.id', 'categories.name as category_name')
                ->get();

            foreach ($ingredients as $ingredient) {
                DB::table('ingredients')
                    ->where('id', $ingredient->id)
                    ->update(['category' => $ingredient->category_name]);
            }

            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropForeign(['category_id']);
                $table->dropColumn('category_id');
            });
        }
    }
};
