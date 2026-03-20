<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'description',
        'sku',
        'price_small',
        'price_medium',
        'price_large',
        'cost',
        'image',
        'supplier_id',
        'is_available',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'supplier_id' => 'integer',
        'price_small' => 'decimal:2',
        'price_medium' => 'decimal:2',
        'price_large' => 'decimal:2',
        'cost' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the full image URL for this product.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }
        
        // If it's already a full URL or data URI, return as-is
        if (str_starts_with($this->image, 'http://') || 
            str_starts_with($this->image, 'https://') || 
            str_starts_with($this->image, 'data:')) {
            return $this->image;
        }
        
        // For local files stored in public disk, use /storage/ path
        return asset('storage/' . $this->image);
    }

    /**
     * Get recipes for this product.
     */
    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }
}
