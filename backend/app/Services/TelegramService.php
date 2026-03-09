<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    /**
     * @return array{success: bool, data?: array<string, mixed>, results?: array<string, array<string, mixed>>, error?: string}
     */
    public function sendMessage(string $message, ?string $chatIdOverride = null): array
    {
        $botToken = trim((string) config('services.telegram.bot_token', ''));
        $timeout = (int) config('services.telegram.timeout', 10);

        if ($botToken === '') {
            return [
                'success' => false,
                'error' => 'Telegram is not configured. Please set TELEGRAM_BOT_TOKEN.',
            ];
        }

        if ($chatIdOverride !== null && trim($chatIdOverride) !== '') {
            return $this->sendSingleMessage($message, trim($chatIdOverride), $botToken, $timeout);
        }

        $chatIds = $this->getConfiguredChatIds();
        if ($chatIds === []) {
            return [
                'success' => false,
                'error' => 'Telegram is not configured. Please set TELEGRAM_CHAT_ID or TELEGRAM_CHAT_IDS.',
            ];
        }

        if (count($chatIds) === 1) {
            return $this->sendSingleMessage($message, $chatIds[0], $botToken, $timeout);
        }

        $results = [];
        $successCount = 0;
        foreach ($chatIds as $chatId) {
            $result = $this->sendSingleMessage($message, $chatId, $botToken, $timeout);
            $results[$chatId] = $result;
            if (($result['success'] ?? false) === true) {
                $successCount++;
            }
        }

        if ($successCount === 0) {
            return [
                'success' => false,
                'error' => 'Failed to send to all configured Telegram chats.',
                'results' => $results,
            ];
        }

        return [
            'success' => true,
            'results' => $results,
        ];
    }

    /**
     * @return array{success: bool, data?: array<string, mixed>, error?: string}
     */
    private function sendSingleMessage(string $message, string $chatId, string $botToken, int $timeout): array
    {
        try {
            $response = Http::timeout($timeout)
                ->asForm()
                ->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                    'chat_id' => $chatId,
                    'text' => $message,
                    'disable_web_page_preview' => true,
                ]);

            if ($response->successful() && $response->json('ok') === true) {
                $payload = $response->json();

                return [
                    'success' => true,
                    'data' => is_array($payload) ? $payload : [],
                ];
            }

            $error = $response->json('description')
                ?? $response->json('message')
                ?? $response->body()
                ?? 'Telegram API error';

            return [
                'success' => false,
                'error' => is_string($error) ? $error : 'Telegram API error',
            ];
        } catch (\Throwable $exception) {
            Log::error('TelegramService error', [
                'message' => $exception->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $exception->getMessage(),
            ];
        }
    }

    /**
     * @return list<string>
     */
    private function getConfiguredChatIds(): array
    {
        $chatIds = [];

        $single = trim((string) config('services.telegram.chat_id', ''));
        if ($single !== '') {
            $chatIds[] = $single;
        }

        $many = config('services.telegram.chat_ids', []);
        if (is_array($many)) {
            foreach ($many as $chatId) {
                $normalized = trim((string) $chatId);
                if ($normalized !== '') {
                    $chatIds[] = $normalized;
                }
            }
        }

        return array_values(array_unique($chatIds));
    }
}