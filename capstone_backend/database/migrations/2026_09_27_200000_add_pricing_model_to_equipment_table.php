<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            // Add pricing model field (per_hectare or per_equipment)
            $table->enum('pricing_model', ['per_hectare', 'per_equipment'])
                ->default('per_hectare')
                ->after('price_per_hectare');
            
            // Add price_per_equipment field (flat rate pricing)
            $table->decimal('price_per_equipment', 10, 2)
                ->nullable()
                ->after('pricing_model');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn(['pricing_model', 'price_per_equipment']);
        });
    }
};
