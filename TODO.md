# Fix Menu Not Showing Results (http://localhost:5173/menu?table=1&amp;name=Table3)

## Status: ✅ Started

**Root Cause**: Backend API (http://127.0.0.1:8000) not running or no categories/products data, causing empty menu.

**Port Fixed**: Frontend now on 5173 (vite.config.js).

### Steps Completed:
- [x] Created this TODO

### Next Steps:

#### 1. [ ] Start Backend Server
   ```cmd
   cd backend
   php artisan serve --port=8000
   ```
   **Verify**: http://127.0.0.1:8000/api/customer/categories returns JSON array.

#### 2. [ ] Start Frontend Server (Port 5173)
   ```cmd
   cd frontend
   npm run dev
   ```
   **Access**: http://localhost:5173/menu?table=1&amp;name=Table3

#### 3. [ ] Seed Database (if no products)
   ```cmd
   cd backend
   php artisan db:seed --class=CategorySeeder
   php artisan db:seed --class=ProductSeeder
   php artisan db:seed --class=DiningTableSeeder
   ```

#### 4. [ ] Test APIs
   ```
   curl http://127.0.0.1:8000/api/customer/categories
   curl http://127.0.0.1:8000/api/customer/products  
   ```

#### 5. [ ] Update Table QR (Optional)
   ```cmd
   cd backend
   php artisan tinker
   ```
   ```php
   App\Models\\DiningTable::where('id', 1)->update(['qr_code' => 'http://localhost:5173/menu?table=1&name=Table3']);
   ```

## Check Browser:
- **Console**: API errors?
- **Network tab**: 404/500 on /api/customer/* ?

## Backend Logs
`backend/storage/logs/laravel.log`

**Expected Result**: Menu shows categories/products, add to cart works.

Run Step 1 first!

