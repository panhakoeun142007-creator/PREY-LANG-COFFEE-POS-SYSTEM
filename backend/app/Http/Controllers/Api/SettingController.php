<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private const SETTINGS_KEY = 'app_settings';

    /**
     * Default settings payload returned when no record exists yet.
     *
     * @return array<string, mixed>
     */
    private function defaultSettings(): array
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
     * Return full application settings.
     */
    public function show(): JsonResponse
    {
        $setting = Setting::firstOrCreate(
            ['key' => self::SETTINGS_KEY],
            ['value' => $this->defaultSettings()]
        );

        return response()->json($this->mergeWithDefaults($setting->value ?? []));
    }

    /**
     * Update all or part of application settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'general' => ['sometimes', 'array'],
            'general.shop_name' => ['sometimes', 'string', 'max:150'],
            'general.address' => ['sometimes', 'string', 'max:255'],
            'general.phone' => ['sometimes', 'string', 'max:50'],
            'general.email' => ['sometimes', 'email', 'max:150'],

            'notifications' => ['sometimes', 'array'],
            'notifications.new_orders_push' => ['sometimes', 'boolean'],
            'notifications.new_orders_email' => ['sometimes', 'boolean'],
            'notifications.new_orders_sound' => ['sometimes', 'boolean'],
            'notifications.ready_for_pickup' => ['sometimes', 'boolean'],
            'notifications.cancelled_orders' => ['sometimes', 'boolean'],
            'notifications.low_stock_warning' => ['sometimes', 'boolean'],
            'notifications.out_of_stock' => ['sometimes', 'boolean'],
            'notifications.daily_summary' => ['sometimes', 'boolean'],
            'notifications.weekly_performance' => ['sometimes', 'boolean'],

            'payment' => ['sometimes', 'array'],
            'payment.currency' => ['sometimes', 'string', 'max:10'],
            'payment.tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'payment.cash_enabled' => ['sometimes', 'boolean'],
            'payment.credit_card_enabled' => ['sometimes', 'boolean'],
            'payment.aba_pay_enabled' => ['sometimes', 'boolean'],
            'payment.wing_money_enabled' => ['sometimes', 'boolean'],

            'receipt' => ['sometimes', 'array'],
            'receipt.shop_name' => ['sometimes', 'string', 'max:150'],
            'receipt.address' => ['sometimes', 'string', 'max:255'],
            'receipt.phone' => ['sometimes', 'string', 'max:50'],
            'receipt.tax_id' => ['sometimes', 'nullable', 'string', 'max:50'],
            'receipt.footer_message' => ['sometimes', 'string', 'max:2000'],
            'receipt.show_logo' => ['sometimes', 'boolean'],
            'receipt.show_qr_payment' => ['sometimes', 'boolean'],
            'receipt.show_order_number' => ['sometimes', 'boolean'],
            'receipt.show_customer_name' => ['sometimes', 'boolean'],
        ]);

        $setting = Setting::firstOrCreate(
            ['key' => self::SETTINGS_KEY],
            ['value' => $this->defaultSettings()]
        );

        $current = $this->mergeWithDefaults($setting->value ?? []);
        $next = array_replace_recursive($current, $validated);

        $setting->update(['value' => $next]);

        return response()->json($next);
    }

    /**
     * Ensure all required sections/keys always exist.
     *
     * @param array<string, mixed> $value
     * @return array<string, mixed>
     */
    private function mergeWithDefaults(array $value): array
    {
        return array_replace_recursive($this->defaultSettings(), $value);
    }
}
