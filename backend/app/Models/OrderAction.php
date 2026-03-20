<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderAction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'order_id',
        'actor_type',
        'actor_id',
        'actor_name',
        'action_type',
        'from_status',
        'to_status',
        'description',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
