<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'dify' => [
        'url' => env('DIFY_API_URL', 'https://api.dify.ai/v1'),
        'key' => env('DIFY_API_KEY'),
        'timeout' => (int) env('DIFY_TIMEOUT', 30),
        'response_mode' => env('DIFY_RESPONSE_MODE', 'streaming'),
        'required_input_key' => env('DIFY_REQUIRED_INPUT_KEY', ''),
        'required_input_value' => env('DIFY_REQUIRED_INPUT_VALUE', 'coffee'),
    ],

];
