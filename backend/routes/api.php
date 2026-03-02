<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\SalesAnalyticsController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/login', [AuthController::class, 'login']);

// Dashboard statistics
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/dashboard/notifications', [DashboardController::class, 'notifications']);
Route::get('/sales-analytics', [SalesAnalyticsController::class, 'index']);

// User info
Route::post('/logout', [AuthController::class, 'logout'])->middleware('admin.api');
Route::get('/user/me', [UserController::class, 'me']);
Route::post('/user/me', [UserController::class, 'updateMe']);

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
Route::apiResource('purchases', PurchaseController::class);

// Receipts (paid orders)
Route::get('/receipts', [ReceiptController::class, 'index']);
