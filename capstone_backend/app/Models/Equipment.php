<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipment';

    protected $fillable = [
        'owner_id',
        'name',
        'category',
        'description',
        'price_per_sqm',
        'coverage_rate',
        'transportation_fee',
        'transportation_fee_per_km',
        'free_distance_km',
        'base_transportation_fee',
        'location',
        'municipality',
        'barangay',
        'province',
        'latitude',
        'longitude',
        'image',
        'status',
        'approval_fee',
        'approved_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'price_per_sqm' => 'decimal:2',
            'coverage_rate' => 'decimal:2',
            'transportation_fee' => 'decimal:2',
            'transportation_fee_per_km' => 'decimal:2',
            'free_distance_km' => 'decimal:2',
            'base_transportation_fee' => 'decimal:2',
            'approval_fee' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'approved_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Status helpers                                                     */
    /* ------------------------------------------------------------------ */

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function isRented(): bool
    {
        return $this->status === 'rented';
    }

    public function isInMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /* ------------------------------------------------------------------ */
    /*  Scopes                                                             */
    /* ------------------------------------------------------------------ */

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeApproved($query)
    {
        return $query->whereIn('status', ['available', 'rented', 'maintenance']);
    }

    public function scopeByLocation($query, string $location)
    {
        return $query->where('location', $location);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function rentalRequests(): HasMany
    {
        return $this->hasMany(RentalRequest::class);
    }
}
