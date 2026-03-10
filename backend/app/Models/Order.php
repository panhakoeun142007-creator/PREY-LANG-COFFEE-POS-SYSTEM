<?php

namespace App\Models;

<<<<<<< HEAD
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
=======
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
>>>>>>> feature/staff-dashboard-copy
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
<<<<<<< HEAD
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
=======
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
>>>>>>> feature/staff-dashboard-copy
}
