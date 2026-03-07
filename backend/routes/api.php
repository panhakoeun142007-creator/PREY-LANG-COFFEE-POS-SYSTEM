<?php

use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\RecipeLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Orders
Route::get('/orders', [OrderController::class, 'index']);
Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

// Recipe Logs
Route::get('/recipe-logs', [RecipeLogController::class, 'index']);
Route::post('/recipe-logs', [RecipeLogController::class, 'store']);
Route::delete('/recipe-logs/{id}', [RecipeLogController::class, 'destroy']);
