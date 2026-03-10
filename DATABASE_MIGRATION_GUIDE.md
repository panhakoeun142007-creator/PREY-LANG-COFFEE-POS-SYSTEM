# Database Migration Guide for coffee_preylang

## Overview
This document outlines the complete migration process for the Prey Lang Coffee POS System to connect with the MySQL database named "coffee_preylang".

## Database Configuration

The database is already configured in [`backend/.env`](backend/.env):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coffee_preylang
DB_USERNAME=root
DB_PASSWORD=
```

## Database Tables

The following tables are created through Laravel migrations:

| Table | Description |
|-------|-------------|
| `users` | Admin and user accounts |
| `staffs` | Staff member records |
| `categories` | Product/ingredient categories |
| `products` | Menu items |
| `ingredients` | Inventory ingredients |
| `recipes` | Product recipes (ingredient amounts) |
| `orders` | Customer orders |
| `order_items` | Individual items in orders |
| `purchases` | Ingredient purchases |
| `expenses` | Business expenses |
| `dining_tables` | Restaurant tables |
| `settings` | Application settings |
| `personal_access_tokens` | API authentication tokens |
| `cache` | Application caching |
| `jobs` | Queue jobs |
| `permissions` | Spatie permission table |
| `model_has_permissions` | Spatie permission table |
| `model_has_roles` | Spatie role table |
| `role_has_permissions` | Spatie role table |
| `roles` | Spatie roles table |

## Migration Commands

### Fresh Migration (Creates all tables)
```bash
cd backend
php artisan migrate:fresh --force
```

### Run All Seeders
```bash
# Run main database seeder (creates admin user and staff)
php artisan db:seed --force

# Run category seeder
php artisan db:seed --class=CategorySeeder --force

# Run product seeder
php artisan db:seed --class=ProductSeeder --force

# Run ingredient seeder
php artisan db:seed --class=IngredientSeeder --force

# Run recipe seeder
php artisan db:seed --class=RecipeSeeder --force
```

### Quick One-Liner (Run All Seeders)
```bash
php artisan db:seed --force && php artisan db:seed --class=CategorySeeder --force && php artisan db:seed --class=ProductSeeder --force && php artisan db:seed --class=IngredientSeeder --force && php artisan db:seed --class=RecipeSeeder --force
```

## Seeded Data Summary

After running all seeders, the database contains:

| Entity | Count | Description |
|--------|-------|-------------|
| Users | 2 | Admin (panha.koeun142007@gmail.com) and Test User |
| Categories | 6 | Coffee, Tea, Smoothies, Pastries + ingredient categories |
| Products | 17 | Various coffee, tea, smoothies, and pastries |
| Ingredients | 16 | Coffee beans, milk, syrups, etc. |
| Recipes | 12 | Product recipes with ingredient amounts |
| Staff | 1 | Staff member (staff@preylang.com) |

## Default Login Credentials

### Admin Account
- **Email:** panha.koeun142007@gmail.com
- **Password:** panha123!@#

### Staff Account
- **Email:** staff@preylang.com
- **Password:** staff123

## Viewing Data

You can verify the data in your database using:

```bash
# Using Laravel Tinker
php artisan tinker

# Then run:
App\Models\User::all();
App\Models\Category::all();
App\Models\Product::all();
App\Models\Ingredient::all();
App\Models\Recipe::all();
App\Models\Staff::all();
```

Or directly in MySQL:

```sql
USE coffee_preylang;
SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM products;
SELECT * FROM ingredients;
SELECT * FROM recipes;
SELECT * FROM staffs;
```

## Troubleshooting

### If you need to re-run migrations from scratch:
```bash
php artisan migrate:fresh --force
```

### If you need to rollback migrations:
```bash
php artisan migrate:rollback --force
```

### If you just need to re-seed:
```bash
php artisan db:seed --force
```

## File Modifications Made

During this migration, the following seeders were updated to be compatible with the current database schema:

1. **CategorySeeder** - Fixed to use `name` instead of `slug` for category lookup
2. **ProductSeeder** - Fixed to use `price_small`, `price_medium`, `price_large` instead of `price` and `badge`

## Notes

- Dining tables, orders, and settings tables are intentionally empty - they get populated as you use the POS system
- The database uses utf8mb4 charset for proper emoji and unicode support
- All timestamps are managed automatically by Laravel

---
Generated: March 9, 2026
