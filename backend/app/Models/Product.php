<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'name',
        'sku',
        'price_small',
        'price_medium',
        'price_large',
        'stock_quantity',
        'low_stock_threshold',
        'is_active',
        'image',
        'is_available',
    ];

    /**
     * The accessors to append to model arrays/json.
     *
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
            'is_active' => 'boolean',
            'price_small' => 'decimal:2',
            'price_medium' => 'decimal:2',
            'price_large' => 'decimal:2',
        ];
    }

    /**
     * Return browser-accessible URL in image field.
     */
    public function getImageAttribute(?string $value): ?string
    {
        return $this->buildPublicImageUrl($value);
    }

    /**
     * Get browser-accessible URL for image path.
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->buildPublicImageUrl($this->getRawOriginal('image'));
    }

    private function buildPublicImageUrl(?string $imagePath): ?string
    {
        if (!$imagePath) {
            return null;
        }

        if (Str::startsWith($imagePath, ['http://', 'https://'])) {
            return $imagePath;
        }

        $path = Storage::disk('public')->url($imagePath);

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $baseUrl = rtrim((string) config('app.url'), '/');

        return $baseUrl !== '' ? $baseUrl . $path : url($path);
    }

    /**
     * Get the category of this product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get order items for this product.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get recipe rows for this product.
     */
    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }
}
