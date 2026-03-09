<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CORS Configuration
    |--------------------------------------------------------------------------
    |
    | Cross-Origin Resource Sharing (CORS) allows the API to be accessed
    | from frontend applications on different domains.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost',
        'http://127.0.0.1',
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Accept-Language',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-Frontend-URL',
    ],

    'exposed_headers' => [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
    ],

    'max_age' => 86400,

    'supports_credentials' => true,
];
