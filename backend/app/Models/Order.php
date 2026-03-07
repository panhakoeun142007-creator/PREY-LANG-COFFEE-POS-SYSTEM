<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasUuids;

    protected $fillable = [
        'table_no',
        'status',
        'items',
        'time_elapsed',
        'customer_name',
        'total',
        'payment_method',
        'completed_at',
    ];

    protected $casts = [
        'items'        => 'array',
        'total'        => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function recipeLogs(): HasMany
    {
        return $this->hasMany(RecipeLog::class);
    }

    /**
     * Map model to the JSON shape the frontend expects.
     */
    public function toArray(): array
    {
        return [
            'id'            => $this->id,
            'tableNo'       => $this->table_no,
            'status'        => $this->status,
            'items'         => $this->items,
            'timeElapsed'   => $this->time_elapsed,
            'timestamp'     => $this->created_at?->toIso8601String(),
            'customerName'  => $this->customer_name,
            'total'         => (float) $this->total,
            'paymentMethod' => $this->payment_method,
            'completedAt'   => $this->completed_at?->toIso8601String(),
        ];
    }
}
