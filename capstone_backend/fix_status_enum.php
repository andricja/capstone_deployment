<?php

// Quick script to fix the status ENUM in rental_requests table

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Fixing rental_requests status ENUM...\n";
    
    // Update the ENUM to include pending_payment
    DB::statement("ALTER TABLE rental_requests MODIFY COLUMN status ENUM('pending_payment', 'forwarded', 'approved', 'rejected', 'active', 'completed') NOT NULL DEFAULT 'forwarded'");
    
    echo "✅ Successfully updated status ENUM!\n";
    echo "New values: pending_payment, forwarded, approved, rejected, active, completed\n";
    
    // Verify the change
    $result = DB::select("SHOW COLUMNS FROM rental_requests WHERE Field = 'status'");
    echo "\nCurrent status column definition:\n";
    print_r($result);
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
