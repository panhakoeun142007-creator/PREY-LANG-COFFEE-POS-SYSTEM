<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\ManagerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\RecipeLogController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\SalesAnalyticsController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\ForgotPasswordController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Database connectivity health check (safe, returns JSON)
Route::get('/health/db', function () {
    if (!app()->environment('local', 'testing')) {
        return response()->json(['message' => 'Not found'], 404);
    }

    try {
        DB::select('SELECT 1');

        $usersProfileImage = null;
        $staffsProfileImage = null;

        try {
            $usersProfileImage = DB::table('information_schema.columns')
                ->select(['DATA_TYPE', 'COLUMN_TYPE', 'CHARACTER_MAXIMUM_LENGTH'])
                ->where('table_schema', DB::raw('DATABASE()'))
                ->where('table_name', 'users')
                ->where('column_name', 'profile_image')
                ->first();

            $staffsProfileImage = DB::table('information_schema.columns')
                ->select(['DATA_TYPE', 'COLUMN_TYPE', 'CHARACTER_MAXIMUM_LENGTH'])
                ->where('table_schema', DB::raw('DATABASE()'))
                ->where('table_name', 'staffs')
                ->where('column_name', 'profile_image')
                ->first();
        } catch (\Throwable) {
            // Optional: information_schema access may be restricted.
        }

        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'columns' => [
                'users.profile_image' => $usersProfileImage,
                'staffs.profile_image' => $staffsProfileImage,
            ],
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'database' => 'disconnected',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// Public routes - Login
Route::post('/login', [AuthController::class, 'login']);

// Public routes - Password reset
Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
Route::post('/send-reset-link', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/verify-code', [ForgotPasswordController::class, 'verifyCode']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

// Recipe Logs (public)
Route::get('/recipe-logs', [RecipeLogController::class, 'index']);
Route::post('/recipe-logs', [RecipeLogController::class, 'store']);
Route::delete('/recipe-logs/{id}', [RecipeLogController::class, 'destroy']);

// Staff and Admin routes (both can access)
Route::middleware('staff.api')->group(function () {
    Route::get('/user/me', [UserController::class, 'me']);
    Route::post('/user/me', [UserController::class, 'updateMe']);
    Route::apiResource('tables', DiningTableController::class);
    Route::apiResource('ingredients', IngredientController::class);
    Route::apiResource('recipes', RecipeController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/expenses/income', [ExpenseController::class, 'income']);
    Route::apiResource('purchases', PurchaseController::class);
    Route::get('/finance/income', [FinanceController::class, 'income']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Admin-only routes
Route::middleware('admin.api')->group(function () {
    Route::put('/settings', [SettingController::class, 'update']);
    Route::apiResource('staffs', StaffController::class);
    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
    Route::delete('/receipts/{order}', [ReceiptController::class, 'destroy']);
});

// Staff and Admin routes (both can access)
Route::middleware('staff.api')->group(function () {
    Route::get('/staff/me', [StaffController::class, 'me']);
    Route::post('/staff/me', [StaffController::class, 'updateMyProfile']);
    Route::get('/manager', [ManagerController::class, 'show']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/notifications', [DashboardController::class, 'notifications']);
    Route::get('/notifications', [DashboardController::class, 'notifications']);
    Route::get('/sales-analytics', [SalesAnalyticsController::class, 'index']);
    Route::get('/analytics', [SalesAnalyticsController::class, 'index']);
    Route::get('/orders/history', [OrderController::class, 'history']);
    Route::get('/orders/live', [OrderController::class, 'live']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('order-items', OrderItemController::class);
    Route::get('/receipts', [ReceiptController::class, 'index']);
    Route::get('/receipts/{order}', [ReceiptController::class, 'show']);
    Route::get('/settings', [SettingController::class, 'show'])->middleware('api.cache');
    // Products - allow both admin and staff to manage
    Route::apiResource('products', ProductController::class);
    Route::get('/products/popular', [ProductController::class, 'popular']);
    Route::patch('/products/{product}/popular', [ProductController::class, 'togglePopular']);
    Route::get('/recipes-board', [RecipeController::class, 'boardIndex']);
    Route::post('/recipes-board', [RecipeController::class, 'boardStore']);
    Route::put('/recipes-board/{product}', [RecipeController::class, 'boardUpdate']);
    Route::patch('/recipes-board/{product}/status', [RecipeController::class, 'boardUpdateStatus']);
    Route::delete('/recipes-board/{product}/{size}', [RecipeController::class, 'boardDestroy']);
});

// Public routes with caching
Route::middleware('api.cache')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
});

// Public customer-facing routes (no auth required)
Route::prefix('customer')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/popular', [ProductController::class, 'popular']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'customerStore']);
    Route::get('/orders/{order}', [OrderController::class, 'customerStatus']);
    Route::post('/orders/{order}/pickup', [OrderController::class, 'pickup']);
});
asd