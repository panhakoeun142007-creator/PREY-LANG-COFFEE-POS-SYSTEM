<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Base controller with common functionality.
 */
class BaseController extends Controller
{
    protected ImageService $imageService;

    public function __construct()
    {
        $this->imageService = new ImageService();
    }

    /**
     * Standard success response.
     */
    protected function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Standard error response.
     */
    protected function error(string $message, int $status = 400, mixed $errors = null): JsonResponse
    {
        $response = ['message' => $message];
        
        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Not found response.
     */
    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, 404);
    }

    /**
     * Validation error response.
     */
    protected function validationError(array $errors): JsonResponse
    {
        return $this->error('Validation failed', 422, $errors);
    }

    /**
     * Paginated response helper.
     */
    protected function paginated($paginator, array $transform = []): JsonResponse
    {
        $data = $paginator->toArray();
        
        if (!empty($transform)) {
            $data['data'] = array_map($transform, $data['data']);
        }

        return response()->json($data);
    }

    /**
     * Parse boolean field from request.
     */
    protected function parseBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array($value, ['true', '1', 'on', 'yes'], true);
    }

    /**
     * Get initials from name.
     */
    protected function getInitials(string $name): string
    {
        $words = array_filter(explode(' ', trim($name)));
        
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . end($words));
        }
        
        return strtoupper(substr($name, 0, 2));
    }

    /**
     * Build filter rules for common fields.
     */
    protected function buildFilterRules(array $fields): array
    {
        $rules = [];
        
        foreach ($fields as $field => $type) {
            $rules[$field] = match ($type) {
                'string' => ['sometimes', 'string', 'max:255'],
                'integer' => ['sometimes', 'integer'],
                'boolean' => ['sometimes', 'boolean'],
                'date' => ['sometimes', 'date'],
                'search' => ['sometimes', 'string', 'max:100'],
                default => ['sometimes'],
            };
        }

        return $rules;
    }

    /**
     * Apply search filter to query.
     */
    protected function applySearch($query, string $search, array $fields): void
    {
        $query->where(function ($q) use ($search, $fields) {
            foreach ($fields as $field) {
                $q->orWhere($field, 'like', "%{$search}%");
            }
        });
    }
}
