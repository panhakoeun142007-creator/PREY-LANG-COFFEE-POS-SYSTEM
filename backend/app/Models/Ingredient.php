<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'unit',
        'stock_qty',
        'min_stock',
        'unit_cost',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stock_qty' => 'decimal:2',
            'min_stock' => 'decimal:2',
            'unit_cost' => 'decimal:2',
        ];
    }

    /**
     * Get recipe rows for this ingredient.
     */
    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    /**
     * Get purchase rows for this ingredient.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }
}
