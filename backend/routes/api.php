<?php

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
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Dashboard statistics
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/dashboard/notifications', [DashboardController::class, 'notifications']);

// User info
Route::get('/user/me', [UserController::class, 'me']);

Route::apiResource('categories', CategoryController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('tables', DiningTableController::class);

// Custom order routes (must be before apiResource)
Route::get('/orders/history', [OrderController::class, 'history']);
Route::get('/orders/live', [OrderController::class, 'live']);
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

Route::apiResource('orders', OrderController::class);
Route::apiResource('order-items', OrderItemController::class);
Route::apiResource('ingredients', IngredientController::class);
Route::apiResource('recipes', RecipeController::class);
Route::apiResource('expenses', ExpenseController::class);
Route::apiResource('purchases', PurchaseController::class);
