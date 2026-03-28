<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            // Add transportation fee per km field (owner sets their own rate)
            $table->decimal('transportation_fee_per_km', 8, 2)->default(15.00)->after('coverage_rate');
            
            // Add free distance threshold (distance within which delivery is free)
            $table->decimal('free_distance_km', 8, 2)->default(5.00)->after('transportation_fee_per_km');
            
            // Add base transportation fee (flat fee beyond free distance)
            $table->decimal('base_transportation_fee', 8, 2)->default(100.00)->after('free_distance_km');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn(['transportation_fee_per_km', 'free_distance_km', 'base_transportation_fee']);
        });
    }
};
