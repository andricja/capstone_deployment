<?php

// Quick script to make payment columns nullable

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Making payment columns nullable in rental_requests table...\n\n";
    
    // Make payment_method nullable
    echo "1. Making payment_method nullable...\n";
    DB::statement("ALTER TABLE rental_requests MODIFY COLUMN payment_method VARCHAR(255) NULL");
    echo "   ✅ payment_method is now nullable\n\n";
    
    // Make paid_amount nullable
    echo "2. Making paid_amount nullable...\n";
    DB::statement("ALTER TABLE rental_requests MODIFY COLUMN paid_amount DECIMAL(10,2) NULL");
    echo "   ✅ paid_amount is now nullable\n\n";
    
    // Make payment_proof nullable
    echo "3. Making payment_proof nullable...\n";
    DB::statement("ALTER TABLE rental_requests MODIFY COLUMN payment_proof VARCHAR(255) NULL");
    echo "   ✅ payment_proof is now nullable\n\n";
    
    echo "═══════════════════════════════════════\n";
    echo "✅ ALL PAYMENT FIELDS NOW NULLABLE!\n";
    echo "═══════════════════════════════════════\n\n";
    
    // Verify the changes
    echo "Verifying columns...\n\n";
    $columns = DB::select("SHOW COLUMNS FROM rental_requests WHERE Field IN ('payment_method', 'paid_amount', 'payment_proof')");
    
    foreach ($columns as $col) {
        echo "Column: {$col->Field}\n";
        echo "  Type: {$col->Type}\n";
        echo "  Null: {$col->Null}\n";
        echo "  " . ($col->Null === 'YES' ? '✅ Nullable' : '❌ NOT NULL') . "\n\n";
    }
    
    echo "🎉 Payment Modal System Ready!\n";
    echo "You can now create rentals without payment.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nTry running: php artisan migrate\n";
}
