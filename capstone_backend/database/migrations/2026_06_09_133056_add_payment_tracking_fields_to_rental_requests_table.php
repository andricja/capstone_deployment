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
            // Payment tracking fields
            $table->enum('payment_status', ['pending', 'paid', 'verified', 'overdue', 'refunded'])
                ->default('pending')
                ->after('payment_proof');
            
            $table->timestamp('paid_at')->nullable()->after('payment_status');
            $table->timestamp('payment_verified_at')->nullable()->after('paid_at');
            $table->unsignedBigInteger('payment_verified_by')->nullable()->after('payment_verified_at');
            $table->text('payment_notes')->nullable()->after('payment_verified_by');
            $table->decimal('amount_paid', 10, 2)->nullable()->after('payment_notes');
            
            // Foreign key for payment verifier (admin)
            $table->foreign('payment_verified_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->dropForeign(['payment_verified_by']);
            $table->dropColumn([
                'payment_status',
                'paid_at',
                'payment_verified_at',
                'payment_verified_by',
                'payment_notes',
                'amount_paid',
            ]);
        });
    }
};
