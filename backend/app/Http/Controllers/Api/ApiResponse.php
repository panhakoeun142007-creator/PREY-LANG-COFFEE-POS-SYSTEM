<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Success response
     */
    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Error response
     */
    public static function error(string $message = 'An error occurred', int $statusCode = 500, mixed $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Validation error response
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], 422);
    }

    /**
     * Not found response
     */
    public static function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    /**
     * Created response
     */
    public static function created(mixed $data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], 201);
    }

    /**
     * No content response
     */
    public static function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Paginated response
     */
    public static function paginated($paginator, mixed $transformer = null): JsonResponse
    {
        $data = $paginator->items();

        if ($transformer && is_callable($transformer)) {
            $data = array_map($transformer, $data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data retrieved successfully',
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'next_page_url' => $paginator->nextPageUrl(),
                'prev_page_url' => $paginator->previousPageUrl(),
            ],
        ], 200);
    }
}
