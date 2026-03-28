<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->enum('category', [
                'tractor',
                'harvester',
                'planter',
                'irrigation',
                'cultivator',
                'sprayer',
                'trailer',
                'other',
            ]);
            $table->text('description')->nullable();
            $table->decimal('daily_rate', 10, 2);
            $table->decimal('transportation_fee', 10, 2)->default(0);
            $table->string('location'); // municipality within Oriental Mindoro
            $table->string('image')->nullable();
            $table->enum('status', ['pending', 'available', 'rented', 'maintenance', 'rejected'])
                  ->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
