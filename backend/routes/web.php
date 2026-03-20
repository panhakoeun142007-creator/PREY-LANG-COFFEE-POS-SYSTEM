<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/media/{path}', function (string $path) {
    if (str_contains($path, '..')) {
        abort(404);
    }

    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }

    $absolutePath = storage_path('app/public/' . ltrim($path, '/'));

    return response()->file($absolutePath);
})->where('path', '.*');
