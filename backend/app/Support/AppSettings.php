<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class AppSettings
{
    public const SETTINGS_KEY = 'app_settings';

    /**
     * Cache key for merged settings.
     */
    private const CACHE_KEY = 'app_settings_merged';

    /**
     * Cache TTL in seconds.
     */
    private const CACHE_TTL = 300;

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'general' => [
                'shop_name' => 'Prey Lang Coffee Roastery',
                'address' => '123 Samdach Sihanouk Blvd, Phnom Penh, Cambodia',
                'phone' => '+855 23 123 456',
                'email' => 'hello@preylangcoffee.com',
            ],
            'notifications' => [
                'new_orders_push' => true,
                'new_orders_email' => false,
                'new_orders_sound' => true,
                'ready_for_pickup' => true,
                'cancelled_orders' => true,
                'low_stock_warning' => true,
                'out_of_stock' => true,
                'daily_summary' => true,
                'weekly_performance' => true,
            ],
            'payment' => [
                'currency' => 'USD',
                'tax_rate' => 10,
                'cash_enabled' => true,
                'credit_card_enabled' => true,
                'aba_pay_enabled' => true,
                'wing_money_enabled' => false,
                'khqr_enabled' => true,
            ],
            'receipt' => [
                'shop_name' => 'Prey Lang Coffee',
                'address' => 'St. 214, Phnom Penh, Cambodia',
                'phone' => '+855 12 345 678',
                'tax_id' => '',
                'footer_message' => 'Thank you for visiting! We hope you enjoyed your organic coffee. Save this receipt for a 5% discount on your next visit.',
                'show_logo' => true,
                'show_qr_payment' => true,
                'show_order_number' => true,
                'show_customer_name' => false,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function getMerged(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $setting = Setting::firstOrCreate(
                ['key' => self::SETTINGS_KEY],
                ['value' => self::defaults()]
            );

            $value = is_array($setting->value) ? $setting->value : [];

            return self::mergeWithDefaults($value);
        });
    }

    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @param array<string, mixed> $value
     * @return array<string, mixed>
     */
    public static function mergeWithDefaults(array $value): array
    {
        return array_replace_recursive(self::defaults(), $value);
    }

    /**
     * Enabled payment methods based on settings.
     *
     * @param array<string, mixed>|null $settings
     * @return array<string, bool>
     */
    public static function enabledPaymentTypes(?array $settings = null): array
    {
        $merged = $settings ?? self::getMerged();
        $payment = is_array($merged['payment'] ?? null) ? $merged['payment'] : [];

        $enabled = [
            'cash' => (bool) ($payment['cash_enabled'] ?? false),
            'credit_card' => (bool) ($payment['credit_card_enabled'] ?? false),
            'aba_pay' => (bool) ($payment['aba_pay_enabled'] ?? false),
            'wing_money' => (bool) ($payment['wing_money_enabled'] ?? false),
            'khqr' => (bool) ($payment['khqr_enabled'] ?? false),
        ];

        return array_filter($enabled, fn ($v) => $v);
    }
}

