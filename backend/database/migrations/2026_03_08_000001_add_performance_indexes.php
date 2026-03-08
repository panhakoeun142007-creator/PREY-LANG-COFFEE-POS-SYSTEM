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
        // Get existing indexes to avoid duplicates
        $existingIndexes = $this->getExistingIndexes();

        // Orders table indexes - critical for dashboard and order queries
        Schema::table('orders', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('orders', $existingIndexes, 'status', 'status');
            $this->addIndexIfNotExists('orders', $existingIndexes, 'created_at_status', ['created_at', 'status']);
            $this->addIndexIfNotExists('orders', $existingIndexes, 'status_created_at', ['status', 'created_at']);
            $this->addIndexIfNotExists('orders', $existingIndexes, 'table_id', 'table_id');
            $this->addIndexIfNotExists('orders', $existingIndexes, 'payment_type', 'payment_type');
            $this->addIndexIfNotExists('orders', $existingIndexes, 'queue_number', 'queue_number');
        });

        // Order items table indexes - critical for product sales analytics
        Schema::table('order_items', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('order_items', $existingIndexes, 'order_id', 'order_id');
            $this->addIndexIfNotExists('order_items', $existingIndexes, 'product_id', 'product_id');
            $this->addIndexIfNotExists('order_items', $existingIndexes, 'order_id_product_id', ['order_id', 'product_id']);
        });

        // Products table indexes
        Schema::table('products', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('products', $existingIndexes, 'category_id', 'category_id');
            $this->addIndexIfNotExists('products', $existingIndexes, 'is_available', 'is_available');
            $this->addIndexIfNotExists('products', $existingIndexes, 'category_id_is_available', ['category_id', 'is_available']);
        });

        // Ingredients table indexes - critical for low stock alerts
        Schema::table('ingredients', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('ingredients', $existingIndexes, 'stock_qty_min_stock', ['stock_qty', 'min_stock']);
            $this->addIndexIfNotExists('ingredients', $existingIndexes, 'category_id', 'category_id');
        });

        // Expenses table indexes
        Schema::table('expenses', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('expenses', $existingIndexes, 'date', 'date');
            $this->addIndexIfNotExists('expenses', $existingIndexes, 'date_category', ['date', 'category']);
        });

        // Dining tables indexes
        Schema::table('dining_tables', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('dining_tables', $existingIndexes, 'is_active', 'is_active');
            $this->addIndexIfNotExists('dining_tables', $existingIndexes, 'qr_code', 'qr_code');
        });

        // Purchases table indexes
        Schema::table('purchases', function (Blueprint $table) use ($existingIndexes) {
            $this->addIndexIfNotExists('purchases', $existingIndexes, 'ingredient_id', 'ingredient_id');
            $this->addIndexIfNotExists('purchases', $existingIndexes, 'date', 'date');
        });
    }

    /**
     * Get all existing indexes in the database.
     */
    private function getExistingIndexes(): array
    {
        $indexes = DB::select('SHOW INDEXES');
        $existing = [];
        
        foreach ($indexes as $index) {
            $table = $index->Table;
            $keyName = $index->Key_name;
            
            if (!isset($existing[$table])) {
                $existing[$table] = [];
            }
            $existing[$table][] = $keyName;
        }
        
        return $existing;
    }

    /**
     * Add index if it doesn't exist.
     */
    private function addIndexIfNotExists(string $table, array $existingIndexes, string $indexName, $columns): void
    {
        $fullIndexName = $table . '_' . $indexName . '_index';
        
        // Check if index already exists
        if (isset($existingIndexes[$table]) && in_array($fullIndexName, $existingIndexes[$table])) {
            return;
        }
        
        // Add index using raw SQL to handle both single and composite indexes
        $columnsStr = is_array($columns) 
            ? '(`' . implode('`, `', $columns) . '`)' 
            : '(`' . $columns . '`)';
        
        DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$fullIndexName}` {$columnsStr}");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Indexes are optional - no need to drop them as they don't harm performance
    }
};
