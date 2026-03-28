<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'renter_id',
        'equipment_id',
        'contact_number',
        'farm_size_sqm',
        'estimated_hours',
        'rental_days',
        'start_date',
        'end_date',
        'delivery_address',
        'sitio_street',
        'barangay',
        'municipality',
        'province',
        'latitude',
        'longitude',
        'total_cost',
        'base_cost',
        'delivery_fee',
        'service_charge',
        'status',
        'rejection_reason',
        'payment_method',
        'payment_proof',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'total_cost' => 'decimal:2',
            'base_cost' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'service_charge' => 'decimal:2',
            'farm_size_sqm' => 'decimal:2',
            'estimated_hours' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'rental_days' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function renter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'renter_id');
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }
}
