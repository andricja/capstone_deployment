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
        // Equipment indexes - improve search and filtering performance
        Schema::table('equipment', function (Blueprint $table) {
            $table->index('status', 'idx_equipment_status');
            $table->index('owner_id', 'idx_equipment_owner');
            $table->index('category', 'idx_equipment_category');
            $table->index('municipality', 'idx_equipment_municipality');
            $table->index(['status', 'owner_id'], 'idx_equipment_status_owner');
            $table->index(['status', 'category'], 'idx_equipment_status_category');
            $table->index('created_at', 'idx_equipment_created');
        });

        // Rental requests indexes - improve dashboard queries
        Schema::table('rental_requests', function (Blueprint $table) {
            $table->index('status', 'idx_rental_status');
            $table->index('renter_id', 'idx_rental_renter');
            $table->index('equipment_id', 'idx_rental_equipment');
            $table->index(['renter_id', 'status'], 'idx_rental_renter_status');
            $table->index(['equipment_id', 'status'], 'idx_rental_equipment_status');
            $table->index('start_date', 'idx_rental_start_date');
            $table->index('end_date', 'idx_rental_end_date');
            $table->index('created_at', 'idx_rental_created');
        });

        // Users indexes - improve authentication and filtering
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('account_status', 'idx_users_account_status');
            $table->index(['role', 'account_status'], 'idx_users_role_status');
            $table->index('created_at', 'idx_users_created');
        });

        // Audit logs indexes - improve admin log viewing
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('user_id', 'idx_audit_user');
            $table->index('action', 'idx_audit_action');
            $table->index('created_at', 'idx_audit_created');
            $table->index(['user_id', 'created_at'], 'idx_audit_user_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropIndex('idx_equipment_status');
            $table->dropIndex('idx_equipment_owner');
            $table->dropIndex('idx_equipment_category');
            $table->dropIndex('idx_equipment_municipality');
            $table->dropIndex('idx_equipment_status_owner');
            $table->dropIndex('idx_equipment_status_category');
            $table->dropIndex('idx_equipment_created');
        });

        Schema::table('rental_requests', function (Blueprint $table) {
            $table->dropIndex('idx_rental_status');
            $table->dropIndex('idx_rental_renter');
            $table->dropIndex('idx_rental_equipment');
            $table->dropIndex('idx_rental_renter_status');
            $table->dropIndex('idx_rental_equipment_status');
            $table->dropIndex('idx_rental_start_date');
            $table->dropIndex('idx_rental_end_date');
            $table->dropIndex('idx_rental_created');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_account_status');
            $table->dropIndex('idx_users_role_status');
            $table->dropIndex('idx_users_created');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_user');
            $table->dropIndex('idx_audit_action');
            $table->dropIndex('idx_audit_created');
            $table->dropIndex('idx_audit_user_created');
        });
    }
};
