<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image')->nullable(); // Path to ad image
            $table->string('link_url')->nullable(); // Optional external link
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('display_order')->default(0); // For ordering ads
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamps();
            $table->softDeletes(); // For archiving
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ads');
    }
};
