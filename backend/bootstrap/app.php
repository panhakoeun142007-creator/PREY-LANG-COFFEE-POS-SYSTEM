<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
  ->withMiddleware(function (Middleware $middleware) {
    $aliases = [
        'admin.api' => \App\Http\Middleware\AdminApiTokenMiddleware::class,
        'staff.api' => \App\Http\Middleware\StaffApiTokenMiddleware::class,
    ];

    // Register Spatie permission middleware only if the package is installed.
    if (class_exists(\Spatie\Permission\Middleware\RoleMiddleware::class)) {
        $aliases['role'] = \Spatie\Permission\Middleware\RoleMiddleware::class;
    }
    if (class_exists(\Spatie\Permission\Middleware\PermissionMiddleware::class)) {
        $aliases['permission'] = \Spatie\Permission\Middleware\PermissionMiddleware::class;
    }
    if (class_exists(\Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class)) {
        $aliases['role_or_permission'] = \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class;
    }

    $middleware->alias($aliases);

})
  
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
