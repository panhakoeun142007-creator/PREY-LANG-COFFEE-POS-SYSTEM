<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'table_id',
        'status',
        'total_price',
        'payment_type',
        'queue_number',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_price' => 'decimal:2',
            'queue_number' => 'integer',
        ];
    }

    /**
     * Get the table tied to this order.
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    /**
     * Get line items for the order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get active (non-cancelled) line items for the order.
     */
    public function activeItems(): HasMany
    {
        return $this->hasMany(OrderItem::class)->active();
    }

    /**
     * Recalculate total_price based on active items + tax.
     */
    public function recalculateTotalPrice(): void
    {
        $settings = \App\Support\AppSettings::getMerged();
        $taxRate = (float) (($settings['payment']['tax_rate'] ?? 0) / 100);

        $subtotal = $this->activeItems()->sum(DB::raw('qty * price'));
        $taxAmount = round($subtotal * $taxRate, 2);
        $total = round($subtotal + $taxAmount, 2);

        $this->update(['total_price' => $total]);
    }
}
