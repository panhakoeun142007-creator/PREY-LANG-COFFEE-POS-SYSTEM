<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Support\AppSettings;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    /**
     * Return full application settings.
     */
    public function show(): JsonResponse
    {
        return response()->json(AppSettings::getMerged());
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
            'payment.khqr_enabled' => ['sometimes', 'boolean'],

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
            ['key' => AppSettings::SETTINGS_KEY],
            ['value' => AppSettings::defaults()]
        );

        $currentValue = is_array($setting->value) ? $setting->value : [];
        $current = AppSettings::mergeWithDefaults($currentValue);
        $next = array_replace_recursive($current, $validated);

        $setting->update(['value' => $next]);

        // Clear the cache for settings to ensure fresh data is returned
        Cache::forget('api_cache_' . md5('api/settings'));
        AppSettings::forgetCache();

        return response()->json($next);
    }
}
