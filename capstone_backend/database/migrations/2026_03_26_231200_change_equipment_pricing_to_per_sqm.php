<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            // Rename daily_rate to price_per_sqm
            $table->renameColumn('daily_rate', 'price_per_sqm');
            
            // Add coverage_rate column (sqm per hour)
            $table->decimal('coverage_rate', 10, 2)->after('price_per_sqm')->default(1500);
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn('coverage_rate');
            $table->renameColumn('price_per_sqm', 'daily_rate');
        });
    }
};
