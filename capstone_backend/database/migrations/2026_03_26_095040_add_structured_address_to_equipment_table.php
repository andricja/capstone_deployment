<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            // Add structured address fields
            $table->string('municipality')->nullable()->after('location');
            $table->string('barangay')->nullable()->after('municipality');
            $table->string('province')->default('Oriental Mindoro')->after('barangay');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn(['municipality', 'barangay', 'province']);
        });
    }
};
