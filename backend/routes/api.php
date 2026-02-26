<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Staff routes
Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/staff/forgot-password', [AuthController::class, 'forgotPassword']);
Route::get('/staff/all', [AuthController::class, 'getAllStaff']);
Route::post('/staff/reset-password', [AuthController::class, 'sendPasswordReset']);

// Token-based password reset (15-second tokens)
Route::post('/staff/request-reset', [AuthController::class, 'requestPasswordReset']);
Route::post('/staff/reset-with-token', [AuthController::class, 'verifyAndResetPassword']);

// Database health check
Route::get('/health/db', [AuthController::class, 'dbHealth']);
