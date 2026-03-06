<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'table_id',
        'queue_number',
        'status',
        'total_price',
        'payment_type',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'table_id' => 'integer',
        'queue_number' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

}
