# Database Migration Commands: SQLite to MySQL

## Step 1: Start MySQL (XAMPP)
```bash
cd C:\xampp
mysql_start.bat
```

## Step 2: Create MySQL Database
```bash
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS coffee_preylang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Step 3: Update Laravel Configuration
Edit `backend/.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coffee_preylang
DB_USERNAME=root
DB_PASSWORD=
```

## Step 4: Clear Config Cache and Run Migrations
```bash
cd backend
php artisan config:clear
php artisan migrate --force
```

## Step 5: Migrate Data from SQLite to MySQL
Create a PHP script `migrate_data.php`:

```php
<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
$mysql = new PDO("mysql:host=127.0.0.1;port=3306;dbname=coffee_preylang", "root", "");

$tables = ['users', 'categories', 'products', 'password_reset_tokens'];
foreach ($tables as $table) {
    $rows = $sqlite->query("SELECT * FROM $table")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        $columns = implode(', ', array_keys($row));
        $placeholders = ':' . implode(', :', array_keys($row));
        $mysql->prepare("INSERT INTO $table ($columns) VALUES ($placeholders)")->execute($row);
    }
}
```

Run the script:
```bash
cd backend
php migrate_data.php
```

## Step 6: Delete SQLite Database
```bash
del backend\database\database.sqlite
```

## Step 7: Verify Migration
```bash
"C:\xampp\mysql\bin\mysql.exe" -u root coffee_preylang -e "SHOW TABLES;"
"C:\xampp\mysql\bin\mysql.exe" -u root coffee_preylang -e "SELECT COUNT(*) FROM categories; SELECT COUNT(*) FROM products;"
```

## Step 8: Check Migration Status
```bash
cd backend
php artisan migrate:status
```
