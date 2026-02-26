<?php

/**
 * Database Connection Diagnostic Script
 * Run with: php backend/database/diagnose.php
 */

echo "=== Database Connection Diagnostics ===\n\n";

// Check .env configuration
echo "1. Checking .env configuration:\n";
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    preg_match('/DB_CONNECTION=(.*)/', $envContent, $matches);
    $dbConnection = isset($matches[1]) ? trim($matches[1]) : 'not set';
    
    preg_match('/DB_HOST=(.*)/', $envContent, $matches);
    $dbHost = isset($matches[1]) ? trim($matches[1]) : 'not set';
    
    preg_match('/DB_PORT=(.*)/', $envContent, $matches);
    $dbPort = isset($matches[1]) ? trim($matches[1]) : 'not set';
    
    preg_match('/DB_DATABASE=(.*)/', $envContent, $matches);
    $dbDatabase = isset($matches[1]) ? trim($matches[1]) : 'not set';
    
    preg_match('/DB_USERNAME=(.*)/', $envContent, $matches);
    $dbUsername = isset($matches[1]) ? trim($matches[1]) : 'not set';
    
    echo "   DB_CONNECTION: $dbConnection\n";
    echo "   DB_HOST: $dbHost\n";
    echo "   DB_PORT: $dbPort\n";
    echo "   DB_DATABASE: $dbDatabase\n";
    echo "   DB_USERNAME: $dbUsername\n";
} else {
    echo "   .env file not found!\n";
}

echo "\n2. Checking SQLite database:\n";
$sqliteFile = __DIR__ . '/database.sqlite';
if (file_exists($sqliteFile)) {
    echo "   SQLite database exists: $sqliteFile\n";
    echo "   Size: " . filesize($sqliteFile) . " bytes\n";
} else {
    echo "   SQLite database NOT found\n";
}

echo "\n3. Checking PHP MySQL extension:\n";
if (extension_loaded('pdo_mysql')) {
    echo "   pdo_mysql: LOADED\n";
} else {
    echo "   pdo_mysql: NOT LOADED\n";
}

if (extension_loaded('pdo_sqlite')) {
    echo "   pdo_sqlite: LOADED\n";
} else {
    echo "   pdo_sqlite: NOT LOADED\n";
}

echo "\n4. Testing MySQL connection:\n";
if ($dbConnection === 'mysql') {
    try {
        $dsn = "mysql:host=$dbHost;port=$dbPort";
        $pdo = new PDO($dsn, $dbUsername, '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        echo "   ✓ MySQL server is CONNECTED\n";
        
        // Check if database exists
        $stmt = $pdo->query("SHOW DATABASES LIKE '$dbDatabase'");
        if ($stmt->rowCount() > 0) {
            echo "   ✓ Database '$dbDatabase' EXISTS\n";
        } else {
            echo "   ✗ Database '$dbDatabase' DOES NOT EXIST\n";
            echo "   Available databases:\n";
            $stmt = $pdo->query("SHOW DATABASES");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                echo "      - " . $row['Database'] . "\n";
            }
        }
    } catch (PDOException $e) {
        echo "   ✗ MySQL connection FAILED: " . $e->getMessage() . "\n";
        
        // Diagnose specific errors
        if (strpos($e->getMessage(), 'Connection refused') !== false) {
            echo "   → MySQL server is NOT RUNNING\n";
        } elseif (strpos($e->getMessage(), 'Unknown database') !== false) {
            echo "   → Database '$dbDatabase' does not exist\n";
        } elseif (strpos($e->getMessage(), 'Access denied') !== false) {
            echo "   → Wrong username/password\n";
        }
    }
}

echo "\n5. Testing SQLite connection:\n";
$sqliteFile = __DIR__ . '/database.sqlite';
if (file_exists($sqliteFile)) {
    try {
        $pdo = new PDO("sqlite:" . __DIR__ . '/database.sqlite');
        echo "   ✓ SQLite connection successful\n";
        
        // Check tables
        $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "   Tables in database: " . count($tables) . "\n";
        foreach ($tables as $table) {
            // Count rows
            $countStmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $countStmt->fetchColumn();
            echo "      - $table ($count rows)\n";
        }
    } catch (PDOException $e) {
        echo "   ✗ SQLite connection FAILED: " . $e->getMessage() . "\n";
    }
} else {
    echo "   SQLite database file not found\n";
}

echo "\n6. Checking MySQL tables:\n";
if ($dbConnection === 'mysql') {
    try {
        $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbDatabase";
        $pdo = new PDO($dsn, $dbUsername, '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "   Tables in MySQL: " . count($tables) . "\n";
        foreach ($tables as $table) {
            // Count rows
            $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $countStmt->fetchColumn();
            echo "      - $table ($count rows)\n";
        }
        
        // Show sample data from users table if exists
        if (in_array('users', $tables)) {
            echo "\n   Sample users data:\n";
            $stmt = $pdo->query("SELECT * FROM users LIMIT 3");
            $users = $stmt->fetchAll();
            foreach ($users as $user) {
                echo "      - ID: {$user['id']}, Name: {$user['name']}, Email: {$user['email']}\n";
            }
        }
        
    } catch (PDOException $e) {
        echo "   ✗ MySQL query FAILED: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Recommendations ===\n";
if ($dbConnection === 'mysql') {
    echo "Option 1: Use SQLite (recommended for local dev)\n";
    echo "   Change DB_CONNECTION=sqlite in .env\n\n";
    echo "Option 2: Fix MySQL\n";
    echo "   - Start MySQL server\n";
    echo "   - Create database: CREATE DATABASE pos-preylang;\n";
}

echo "\n";
