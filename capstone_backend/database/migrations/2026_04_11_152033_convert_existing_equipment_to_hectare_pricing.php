<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Convert existing equipment prices from price_per_sqm to price_per_hectare.
     * Formula: price_per_hectare = price_per_sqm * 10000
     */
    public function up(): void
    {
        // Update all equipment that has price_per_sqm but no price_per_hectare
        DB::statement('
            UPDATE equipment 
            SET price_per_hectare = price_per_sqm * 10000 
            WHERE price_per_sqm IS NOT NULL 
            AND (price_per_hectare IS NULL OR price_per_hectare = 0)
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally revert: price_per_sqm = price_per_hectare / 10000
        DB::statement('
            UPDATE equipment 
            SET price_per_sqm = price_per_hectare / 10000 
            WHERE price_per_hectare IS NOT NULL 
            AND price_per_hectare > 0
        ');
    }
};
