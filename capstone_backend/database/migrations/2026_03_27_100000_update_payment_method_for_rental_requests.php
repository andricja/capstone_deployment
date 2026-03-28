<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            // Change payment_method column to accommodate new values
            $table->string('payment_method', 20)->default('downpayment')->change();
        });
        
        // Update existing records: convert 'cod' and 'gcash' to 'downpayment'
        DB::table('rental_requests')
            ->whereIn('payment_method', ['cod', 'gcash'])
            ->update(['payment_method' => 'downpayment']);
    }

    public function down(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->string('payment_method', 10)->default('cod')->change();
        });
    }
};
