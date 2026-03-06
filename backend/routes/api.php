<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\SalesAnalyticsController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\AuthController as OriginalAuthController;
use App\Http\Controllers\ForgotPasswordController;
use Illuminate\Support\Facades\Route;


Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Original Auth Routes (from develop)
Route::post('/register', [OriginalAuthController::class, 'register']);
Route::post('/login', [OriginalAuthController::class, 'login']);
Route::post('/logout', [OriginalAuthController::class, 'logout']);
Route::post('/send-reset-link', [OriginalAuthController::class, 'sendResetLink']);
Route::post('/verify-code', [OriginalAuthController::class, 'verifyCode']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

// Admin API Routes (from feature/admin-develop)
Route::post('/admin/login', [AuthController::class, 'login']);

// Dashboard statistics
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/dashboard/notifications', [DashboardController::class, 'notifications']);
Route::get('/sales-analytics', [SalesAnalyticsController::class, 'index']);

// User info (requires auth)
Route::post('/logout', [AuthController::class, 'logout'])->middleware('admin.api');
Route::get('/user/me', [UserController::class, 'me']);
Route::post('/user/me', [UserController::class, 'updateMe']);
Route::get('/settings', [SettingController::class, 'show']);
Route::put('/settings', [SettingController::class, 'update']);

Route::apiResource('categories', CategoryController::class);
Route::apiResource('staffs', StaffController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('tables', DiningTableController::class);

// Custom order routes (must be before apiResource)
Route::get('/orders/history', [OrderController::class, 'history']);
Route::get('/orders/live', [OrderController::class, 'live']);
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

Route::apiResource('orders', OrderController::class);
Route::apiResource('order-items', OrderItemController::class);
Route::apiResource('ingredients', IngredientController::class);
Route::get('/recipes-board', [RecipeController::class, 'boardIndex']);
Route::post('/recipes-board', [RecipeController::class, 'boardStore']);
Route::put('/recipes-board/{product}', [RecipeController::class, 'boardUpdate']);
Route::patch('/recipes-board/{product}/status', [RecipeController::class, 'boardUpdateStatus']);
Route::delete('/recipes-board/{product}/{size}', [RecipeController::class, 'boardDestroy']);
Route::apiResource('recipes', RecipeController::class);
Route::apiResource('expenses', ExpenseController::class);
Route::get('/finance/income', [FinanceController::class, 'income']);
Route::apiResource('purchases', PurchaseController::class);

// Receipts (paid orders)
Route::get('/receipts', [ReceiptController::class, 'index']);
