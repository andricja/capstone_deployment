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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // 'create', 'update', 'delete', 'login', 'logout', 'approve', 'reject'
            $table->string('auditable_type')->nullable(); // Model name (Equipment, User, etc.)
            $table->unsignedBigInteger('auditable_id')->nullable(); // Model ID
            $table->json('old_values')->nullable(); // Before changes
            $table->json('new_values')->nullable(); // After changes
            $table->text('description')->nullable(); // Human-readable description
            $table->string('ip_address', 45)->nullable(); // IPv4 or IPv6
            $table->text('user_agent')->nullable(); // Browser/device info
            $table->timestamps();
            
            // Indexes for better query performance
            $table->index('user_id');
            $table->index('auditable_type');
            $table->index('created_at');
            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
