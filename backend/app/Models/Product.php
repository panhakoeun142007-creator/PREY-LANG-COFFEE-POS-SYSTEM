<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'sku',
        'price_small',
        'price_medium',
        'price_large',
        'image',
        'is_available',
        'is_popular',
        'discount_type',
        'discount_value',
        'discount_start_date',
        'discount_end_date',
        'discount_active',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'price_small' => 'decimal:2',
        'price_medium' => 'decimal:2',
        'price_large' => 'decimal:2',
        'is_available' => 'boolean',
        'is_popular' => 'boolean',
        'discount_value' => 'decimal:2',
        'discount_start_date' => 'datetime',
        'discount_end_date' => 'datetime',
        'discount_active' => 'boolean',
    ];

    /**
     * Check if discount is currently active.
     */
    public function hasActiveDiscount(): bool
    {
        if (!$this->discount_active) {
            return false;
        }

        $now = now();
        
        if ($this->discount_start_date && $now->lt($this->discount_start_date)) {
            return false;
        }
        
        if ($this->discount_end_date && $now->gt($this->discount_end_date)) {
            return false;
        }
        
        return true;
    }

    /**
     * Calculate discounted price for a given size.
     */
    public function getDiscountedPrice(string $size = 'medium'): float
    {
        if (!$this->hasActiveDiscount()) {
            return (float) $this->{"price_$size"};
        }

        $originalPrice = (float) $this->{"price_$size"};
        $discountValue = (float) $this->discount_value;

        return match ($this->discount_type) {
            'percentage' => max(0, $originalPrice * (1 - $discountValue / 100)),
            'fixed' => max(0, $originalPrice - $discountValue),
            'promo' => $discountValue, // Direct promo price
            default => $originalPrice,
        };
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get recipes for this product.
     */
    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }
}
