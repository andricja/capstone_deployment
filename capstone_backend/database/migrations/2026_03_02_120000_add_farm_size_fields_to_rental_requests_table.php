<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->decimal('farm_size_sqm', 12, 2)->nullable()->after('contact_number');
            $table->decimal('estimated_hours', 8, 2)->nullable()->after('farm_size_sqm');
            $table->decimal('base_cost', 12, 2)->nullable()->after('total_cost');
            $table->decimal('delivery_fee', 12, 2)->nullable()->after('base_cost');
            $table->decimal('service_charge', 12, 2)->nullable()->after('delivery_fee');
        });
    }

    public function down(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->dropColumn(['farm_size_sqm', 'estimated_hours', 'base_cost', 'delivery_fee', 'service_charge']);
        });
    }
};
