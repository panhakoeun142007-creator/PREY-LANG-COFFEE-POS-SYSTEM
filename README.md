# PREY LANG COFFEE POS SYSTEM

## Run Both Together (Recommended)

```powershell
cd c:\Users\USER\Desktop\PREY-LANG-COFFEE-POS-SYSTEM
npm run dev
```

This starts backend and frontend in two PowerShell windows.

## Run Backend (Laravel)

```powershell
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

Backend URLs:
- `http://127.0.0.1:8000/` (backend status message)
- `http://127.0.0.1:8000/api/health` (API health check)

## Run Frontend (React + Vite)

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend URL:
- `http://127.0.0.1:5173`

Notes:
- Frontend proxies `/api/*` to Laravel using `VITE_BACKEND_URL`.
- Keep both backend and frontend servers running at the same time.
