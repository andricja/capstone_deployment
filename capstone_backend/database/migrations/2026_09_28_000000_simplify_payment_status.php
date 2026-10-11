<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all 'verified' status to 'paid' before changing ENUM
        DB::table('rental_requests')
            ->where('payment_status', 'verified')
            ->update(['payment_status' => 'paid']);

        // Modify the ENUM to remove 'verified'
        DB::statement("ALTER TABLE rental_requests MODIFY COLUMN payment_status ENUM('pending', 'paid', 'overdue', 'refunded') DEFAULT 'pending'");
        
        // Drop the verification tracking columns (no longer needed)
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->dropForeign(['payment_verified_by']);
            $table->dropColumn([
                'payment_verified_at',
                'payment_verified_by',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back verification columns
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->timestamp('payment_verified_at')->nullable()->after('paid_at');
            $table->unsignedBigInteger('payment_verified_by')->nullable()->after('payment_verified_at');
            $table->foreign('payment_verified_by')->references('id')->on('users')->onDelete('set null');
        });

        // Add 'verified' back to ENUM
        DB::statement("ALTER TABLE rental_requests MODIFY COLUMN payment_status ENUM('pending', 'paid', 'verified', 'overdue', 'refunded') DEFAULT 'pending'");
    }
};
