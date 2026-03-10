<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id',
        'table_no',
        'name',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function toArray(): array
    {
        return [
            'id'      => $this->id,
            'orderId' => $this->order_id,
            'tableNo' => $this->table_no,
            'name'    => $this->name,
        ];
    }
}
