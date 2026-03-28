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
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->string('sitio_street')->nullable()->after('delivery_address');
            $table->string('barangay')->nullable()->after('sitio_street');
            $table->string('municipality')->nullable()->after('barangay');
            $table->string('province')->default('Oriental Mindoro')->after('municipality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->dropColumn(['sitio_street', 'barangay', 'municipality', 'province']);
        });
    }
};
