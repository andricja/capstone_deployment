<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_status')->default('pending')->after('role');
            // pending → email not verified yet
            // email_verified → email confirmed, waiting admin approval
            // approved → admin approved, can log in
            // rejected → admin rejected

            $table->string('email_verification_code', 6)->nullable()->after('account_status');
            $table->timestamp('email_code_expires_at')->nullable()->after('email_verification_code');
            $table->string('admin_rejection_reason')->nullable()->after('email_code_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['account_status', 'email_verification_code', 'email_code_expires_at', 'admin_rejection_reason']);
        });
    }
};
