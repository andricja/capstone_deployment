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
            // Make payment fields nullable to support "Pay Later" feature
            $table->string('payment_method')->nullable()->change();
            $table->decimal('paid_amount', 10, 2)->nullable()->change();
            $table->string('payment_proof')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            // Revert to non-nullable (but this might fail if there's NULL data)
            $table->string('payment_method')->nullable(false)->change();
            $table->decimal('paid_amount', 10, 2)->nullable(false)->change();
            $table->string('payment_proof')->nullable(false)->change();
        });
    }
};
