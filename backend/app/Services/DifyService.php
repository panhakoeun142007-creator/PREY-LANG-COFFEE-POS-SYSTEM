<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use stdClass;

class DifyService
{
    public function __construct(
        private readonly string $apiUrl = '',
        private readonly string $apiKey = '',
        private readonly int $timeout = 30,
    ) {
    }

    /**
     * @param array<string, mixed> $inputs
     * @return array{success: bool, answer?: string, data?: array<string, mixed>, error?: string}
     */
    public function chat(string $query, string $userId = 'system', array $inputs = []): array
    {
        $baseUrl = rtrim($this->apiUrl !== '' ? $this->apiUrl : (string) config('services.dify.url', ''), '/');
        $key = $this->apiKey !== '' ? $this->apiKey : (string) config('services.dify.key', '');
        $timeout = $this->timeout > 0 ? $this->timeout : (int) config('services.dify.timeout', 30);
        $responseMode = strtolower((string) config('services.dify.response_mode', 'streaming'));
        $requiredInputKey = trim((string) config('services.dify.required_input_key', ''));
        $requiredInputValue = config('services.dify.required_input_value', 'coffee');
        if (!in_array($responseMode, ['blocking', 'streaming'], true)) {
            $responseMode = 'streaming';
        }

        if ($requiredInputKey !== '' && !array_key_exists($requiredInputKey, $inputs)) {
            $inputs[$requiredInputKey] = $requiredInputValue;
        }

        if ($baseUrl === '' || $key === '') {
            return [
                'success' => false,
                'error' => 'Dify is not configured. Please set DIFY_API_URL and DIFY_API_KEY.',
            ];
        }

        try {
            $payload = [
                'inputs' => $this->normalizeInputs($inputs),
                'query' => $query,
                'response_mode' => $responseMode,
                'user' => $userId,
            ];

            $response = Http::timeout($timeout)
                ->acceptJson()
                ->withToken($key)
                ->post("{$baseUrl}/chat-messages", $payload);

            if ($response->successful()) {
                return $this->normalizeSuccessResponse($response, $responseMode);
            }

            $error = $this->extractErrorMessage($response);

            if (
                $responseMode === 'blocking'
                && str_contains(strtolower($error), 'does not support blocking mode')
            ) {
                $payload['response_mode'] = 'streaming';
                $retryResponse = Http::timeout($timeout)
                    ->acceptJson()
                    ->withToken($key)
                    ->post("{$baseUrl}/chat-messages", $payload);

                if ($retryResponse->successful()) {
                    return $this->normalizeSuccessResponse($retryResponse, 'streaming');
                }

                return [
                    'success' => false,
                    'error' => $this->extractErrorMessage($retryResponse),
                ];
            }

            return [
                'success' => false,
                'error' => $error,
            ];
        } catch (\Throwable $exception) {
            Log::error('DifyService error', [
                'message' => $exception->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $exception->getMessage(),
            ];
        }
    }

    /**
     * @param array<string, mixed> $inputs
     */
    private function normalizeInputs(array $inputs): object
    {
        if ($inputs === []) {
            return new stdClass();
        }

        $normalized = [];
        foreach ($inputs as $key => $value) {
            if (is_string($key)) {
                $normalized[$key] = $value;
            }
        }

        if ($normalized === []) {
            return new stdClass();
        }

        return (object) $normalized;
    }

    /**
     * @return array{success: bool, answer: string, data: array<string, mixed>}
     */
    private function normalizeSuccessResponse(Response $response, string $mode): array
    {
        if ($mode === 'streaming') {
            [$answer, $events] = $this->parseStreamingAnswer($response->body());

            return [
                'success' => true,
                'answer' => $answer,
                'data' => [
                    'mode' => 'streaming',
                    'events' => $events,
                ],
            ];
        }

        $data = $response->json();
        $answer = is_array($data) ? (string) ($data['answer'] ?? '') : '';

        return [
            'success' => true,
            'answer' => $answer,
            'data' => is_array($data) ? $data : [],
        ];
    }

    /**
     * @return array{0:string,1:list<array<string,mixed>>}
     */
    private function parseStreamingAnswer(string $body): array
    {
        $answer = '';
        $events = [];

        $lines = preg_split("/(\r\n|\n|\r)/", $body) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || !str_starts_with($line, 'data:')) {
                continue;
            }

            $jsonChunk = trim(substr($line, 5));
            if ($jsonChunk === '' || $jsonChunk === '[DONE]') {
                continue;
            }

            $event = json_decode($jsonChunk, true);
            if (!is_array($event)) {
                continue;
            }

            $events[] = $event;
            $chunk = (string) ($event['answer'] ?? '');
            if ($chunk !== '') {
                $answer .= $chunk;
            }
        }

        if ($answer === '' && $events !== []) {
            $lastEvent = $events[count($events) - 1];
            if (isset($lastEvent['message']) && is_string($lastEvent['message'])) {
                $answer = $lastEvent['message'];
            }
        }

        return [trim($answer), $events];
    }

    private function extractErrorMessage(Response $response): string
    {
        $error = $response->json('message')
            ?? $response->json('error.message')
            ?? $response->json('error')
            ?? $response->body()
            ?? 'Dify API error';

        return is_string($error) ? $error : 'Dify API error';
    }
}
