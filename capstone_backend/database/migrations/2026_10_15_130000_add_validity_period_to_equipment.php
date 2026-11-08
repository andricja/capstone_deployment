<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->integer('validity_period_years')->nullable()->after('approval_fee')->comment('How many years the equipment approval is valid');
            $table->timestamp('approval_expires_at')->nullable()->after('validity_period_years')->comment('When the equipment approval expires');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn(['validity_period_years', 'approval_expires_at']);
        });
    }
};
