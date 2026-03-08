<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiCacheMiddleware
{
    /**
     * Routes that should be cached.
     */
    protected array $cacheableRoutes = [
        'api/settings',
        'api/categories',
        'api/products',
    ];

    /**
     * Cache TTL in seconds (5 minutes).
     */
    protected int $cacheTtl = 300;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Check if this route should be cached
        $path = $request->path();
        if (!$this->shouldCache($path)) {
            return $next($request);
        }

        // Build cache key from full URL
        $cacheKey = 'api_cache_' . md5($request->fullUrl());

        // Try to get cached response
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            
            return response($cachedResponse['content'], $cachedResponse['status'])
                ->withHeaders($cachedResponse['headers']);
        }

        // Process request and cache response
        $response = $next($request);

        // Only cache successful responses
        if ($response->getStatusCode() === 200) {
            $cacheData = [
                'content' => $response->getContent(),
                'status' => $response->getStatusCode(),
                'headers' => $response->headers->all(),
            ];
            
            Cache::put($cacheKey, $cacheData, $this->cacheTtl);
        }

        return $response;
    }

    /**
     * Check if the route should be cached.
     */
    protected function shouldCache(string $path): bool
    {
        foreach ($this->cacheableRoutes as $route) {
            if (str_starts_with($path, $route)) {
                return true;
            }
        }
        return false;
    }
}
