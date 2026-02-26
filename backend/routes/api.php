<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/staff/forgot-password', [AuthController::class, 'forgotPassword']);
Route::get('/health/db', [AuthController::class, 'dbHealth']);
