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
        // For MySQL, we need to use raw SQL to alter ENUM
        DB::statement("ALTER TABLE rental_requests MODIFY COLUMN status ENUM('pending_payment', 'forwarded', 'approved', 'rejected', 'active', 'completed') NOT NULL DEFAULT 'forwarded'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original ENUM values
        DB::statement("ALTER TABLE rental_requests MODIFY COLUMN status ENUM('forwarded', 'approved', 'rejected') NOT NULL DEFAULT 'forwarded'");
    }
};
