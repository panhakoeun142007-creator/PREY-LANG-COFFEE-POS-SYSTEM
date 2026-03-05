# PREY-LANG COFFEE POS SYSTEM - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure Overview](#project-structure-overview)
3. [MySQL Database Setup](#mysql-database-setup)
4. [Backend Configuration (Laravel)](#backend-configuration-laravel)
5. [Frontend Configuration (React + Vite)](#frontend-configuration-react--vite)
6. [Database Migration & Seeding](#database-migration--seeding)
7. [Running the Application](#running-the-application)
8. [Verification Steps](#verification-steps)
9. [Testing the Application](#testing-the-application)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Prerequisites

### Required Software
| Software | Version | Purpose |
|----------|---------|---------|
| **PHP** | 8.2+ | Laravel backend runtime |
| **Composer** | Latest | PHP dependency manager |
| **Node.js** | 18+ | Frontend runtime |
| **npm** | 9+ | Frontend package manager |
| **MySQL** | 8.0+ | Database server |
| **Git** | Latest | Version control (optional) |

### Verify Installation
```powershell
php --version        # Should show PHP 8.2+
composer --version   # Should show Composer version
node --version      # Should show Node 18+
npm --version       # Should show npm 9+
mysql --version     # Should show MySQL 8.0+
```

---

## Project Structure Overview

```
PREY-LANG-COFFEE-POS-SYSTEM/
├── backend/                    # Laravel 12 API
│   ├── .env                    # Environment configuration
│   ├── artisan                # Laravel CLI
│   ├── composer.json          # PHP dependencies
│   ├── config/
│   │   └── database.php       # Database configuration
│   └── database/
│       ├── migrations/        # Database migrations (17 files)
│       └── seeders/           # Database seeders
├── frontend/                   # React 18 + Vite
│   ├── .env                   # Frontend environment
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite configuration with proxy
│   └── src/                   # React source code
├── scripts/
│   └── dev.ps1               # Development launcher script
└── package.json              # Root package.json
```

---

## MySQL Database Setup

### Step 1: Start MySQL Service
```powershell
# Windows - Start MySQL service
net start mysql

# Or use MySQL Workbench/XAMPP/WAMP to start MySQL
```

### Step 2: Create the Database
Connect to MySQL and create the database:

```sql
-- Login to MySQL
mysql -u root -p

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS coffee_preylang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify database created
SHOW DATABASES;
```

**MySQL Connection Details:**
| Parameter | Value |
|-----------|-------|
| Host | 127.0.0.1 |
| Port | 3306 |
| Database | coffee_preylang |
| Username | root |
| Password | (empty by default) |

**Connection String Format:**
```
mysql:host=127.0.0.1;port=3306;dbname=coffee_preylang
```

Or in Laravel .env format:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coffee_preylang
DB_USERNAME=root
DB_PASSWORD=
```

---

## Backend Configuration (Laravel)

### Step 1: Navigate to Backend Directory
```powershell
cd backend
```

### Step 2: Install PHP Dependencies
```powershell
composer install
```

### Step 3: Create Environment File
```powershell
copy .env.example .env
```

### Step 4: Configure .env File
Edit the `backend/.env` file with your database credentials:

```env
APP_NAME=PREY-LANG-COFFEE-POS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

# Database Configuration - UPDATE THESE VALUES
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coffee_preylang
DB_USERNAME=root
DB_PASSWORD=your_password_here

# Session & Cache
SESSION_DRIVER=file
CACHE_STORE=database
QUEUE_CONNECTION=database
```

**Important:** If your MySQL has a password, set `DB_PASSWORD=your_actual_password`.

### Step 5: Generate Application Key
```powershell
php artisan key:generate
```
This generates a unique APP_KEY in your .env file required for encryption.

### Step 6: Verify Configuration
```powershell
php artisan config:clear
php artisan config:show database
```

---

## Frontend Configuration (React + Vite)

### Step 1: Navigate to Frontend Directory
```powershell
cd frontend
```

### Step 2: Install Node Dependencies
```powershell
npm install
```

### Step 3: Configure Environment File
The `.env` file should already exist with default values. Verify or create it:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_API_URL=/api
```

### Step 4: Verify Vite Proxy Configuration
The `vite.config.ts` automatically proxies `/api` requests to the backend:

```typescript
proxy: {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
  },
}
```

---

## Database Migration & Seeding

### Step 1: Run Migrations
```powershell
cd backend
php artisan migrate
```

This creates 17 tables:
- `users` - User accounts
- `categories` - Product categories
- `products` - Menu items/products
- `dining_tables` - Restaurant tables
- `orders` - Customer orders
- `order_items` - Individual order items
- `ingredients` - Inventory ingredients
- `expenses` - Expense tracking
- `recipes recipes
- `` - Productpurchases` - Purchase orders
- `staffs` - Staff members
- `migrations` - Migration tracking
- `password_reset_tokens` - Password reset
- `personal_access_tokens` - API tokens
- `sessions` - User sessions
- `cache` - Cache storage
- `jobs` - Queue jobs

### Step 2: Seed Database (Optional - Creates Sample Data)
```powershell
php artisan db:seed
```

Or run specific seeders:
```powershell
php artisan db:seed --class=DatabaseSeeder
```

### Step 3: Verify Tables Created
```powershell
php artisan tinker
>>> Schema::getColumnListing('users')
>>> Schema::getColumnListing('products')
>>> exit
```

---

## Running the Application

### Option 1: Run Both Backend and Frontend Together (Recommended)
```powershell
# From project root
npm run dev
```

This opens two PowerShell windows:
- **Backend**: http://127.0.0.1:8000
- **Frontend**: http://127.0.0.1:5173

### Option 2: Run Backend Separately
```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

### Option 3: Run Frontend Separately
```powershell
cd frontend
npm run dev
```

---

## Verification Steps

### 1. Verify Backend is Running
```powershell
# Test backend health endpoint
curl http://127.0.0.1:8000/api/health
```

Expected response: JSON with health status

### 2. Verify Database Connection
```powershell
cd backend
php artisan tinker
>>> DB::connection()->getPdo();
>>> exit
```

### 3. Verify API Endpoints
Access these URLs in browser:
- `http://127.0.0.1:8000/api/health` - API health check
- `http://127.0.0.1:8000/` - Laravel welcome page

### 4. Verify Frontend
- Open `http://127.0.0.1:5173` in browser
- Frontend should load without errors

### 5. Verify Database Tables Have Data
```powershell
cd backend
php artisan tinker
>>> User::count()     # Should be > 0 if seeded
>>> Product::count()  # Should be > 0 if seeded
>>> Category::count() # Should be > 0 if seeded
>>> exit
```

---

## Testing the Application

### Backend Tests (PHPUnit)
```powershell
cd backend
php artisan test
```

### Run Specific Test
```powershell
cd backend
php artisan test --filter=ExampleTest
```

### Test API Endpoints with cURL
```powershell
# Test categories API
curl http://127.0.0.1:8000/api/categories

# Test products API
curl http://127.0.0.1:8000/api/products

# Test tables API
curl http://127.0.0.1:8000/api/tables
```

### Test Database Connection
```powershell
cd backend
php artisan migrate:status
```
Should show all migrations as "Yes" (ran successfully)

---

## Troubleshooting Common Issues

### Issue 1: "SQLSTATE[HY000] [1049] Unknown database 'coffee_preylang'"
**Solution:** Create the database first
```sql
CREATE DATABASE coffee_preylang;
```

### Issue 2: "SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'"
**Solution:** Check your MySQL credentials in `.env`
```env
DB_PASSWORD=your_actual_password
```

### Issue 3: "PHP Fatal error: Unsupported operand types"
**Solution:** Clear config cache
```powershell
php artisan config:clear
php artisan cache:clear
```

### Issue 4: "Class 'PDO' not found"
**Solution:** Enable PDO extension in php.ini
```ini
extension=pdo_mysql
```

### Issue 5: "VITE_BACKEND_URL is not set"
**Solution:** Ensure `.env` file exists in frontend directory
```powershell
cd frontend
copy .env.example .env
```

### Issue 6: Frontend shows "Network Error" when calling API
**Solution:** 
1. Verify backend is running on port 8000
2. Check CORS configuration in `backend/config/cors.php`
3. Ensure `VITE_BACKEND_URL` matches backend URL

### Issue 7: "Session store not set"
**Solution:** Generate application key
```powershell
php artisan key:generate
```

### Issue 8: "SQLSTATE[42000]: Syntax error or access violation"
**Solution:** Ensure MySQL strict mode is compatible or adjust strict setting in `config/database.php`:
```php
'strict' => false, // Change from true to false if needed
```

### Issue 9: Port 8000 or 5173 Already in Use
**Solution:** Use different ports
```powershell
# Backend on different port
php artisan serve --port=8001

# Edit frontend .env
VITE_BACKEND_URL=http://127.0.0.1:8001
```

### Issue 10: npm install fails with ERR
**Solution:** Clear npm cache and retry
```powershell
npm cache clean --force
npm install
```

---

## Quick Setup Checklist

- [ ] MySQL service is running
- [ ] Database `coffee_preylang` created
- [ ] `backend/.env` created and configured
- [ ] `composer install` completed in backend
- [ ] `php artisan key:generate` executed
- [ ] `php artisan migrate` executed successfully
- [ ] `npm install` completed in frontend
- [ ] Backend running on http://127.0.0.1:8000
- [ ] Frontend running on http.0.1://127.0:5173
- [ ] API health check returns success

---

## API Endpoints Summary

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/categories` | List categories |
| `GET /api/products` | List products |
| `GET /api/tables` | List dining tables |
| `GET /api/orders` | List orders |
| `GET /api/staff` | List staff members |
| `GET /api/ingredients` | List ingredients |
| `POST /api/auth/login` | User login |

---

## Additional Commands

```powershell
# Clear all caches
php artisan optimize:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# List routes
php artisan route:list

# View environment info
php artisan env
```

---

For more information, see the README.md file in the project root.
