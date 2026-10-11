<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing GCash Data ===\n\n";

// Get all owners with GCash settings
$owners = \App\Models\User::where('role', 'owner')
    ->with('gcashSetting')
    ->get();

echo "Total owners: " . $owners->count() . "\n\n";

foreach ($owners as $owner) {
    echo "Owner: {$owner->name} ({$owner->email})\n";
    echo "ID: {$owner->id}\n";
    
    if ($owner->gcashSetting) {
        echo "GCash Settings:\n";
        echo "  - Account Name: {$owner->gcashSetting->account_name}\n";
        echo "  - Account Number: {$owner->gcashSetting->account_number}\n";
        echo "  - QR Code Image: {$owner->gcashSetting->qr_code_image}\n";
        
        // Check if file exists
        $filePath = storage_path('app/public/' . $owner->gcashSetting->qr_code_image);
        if (file_exists($filePath)) {
            echo "  - File exists: ✓ YES\n";
            echo "  - File size: " . filesize($filePath) . " bytes\n";
        } else {
            echo "  - File exists: ✗ NO (Expected at: {$filePath})\n";
        }
    } else {
        echo "GCash Settings: ✗ NOT SET UP\n";
    }
    echo "\n" . str_repeat('-', 50) . "\n\n";
}

// Test rental request data structure
echo "=== Testing Rental Request Data ===\n\n";

$rental = \App\Models\RentalRequest::with([
    'equipment' => function($query) {
        $query->with([
            'owner' => function($q) {
                $q->with('gcashSetting');
            }
        ]);
    }
])->first();

if ($rental) {
    echo "Sample Rental ID: {$rental->id}\n";
    echo "Equipment: " . ($rental->equipment ? $rental->equipment->name : 'NULL') . "\n";
    echo "Owner: " . ($rental->equipment->owner ?? null ? $rental->equipment->owner->name : 'NULL') . "\n";
    echo "GCash: " . ($rental->equipment->owner->gcashSetting ?? null ? 'EXISTS' : 'NULL') . "\n";
    
    if ($rental->equipment->owner->gcashSetting ?? null) {
        echo "\nGCash Data Structure:\n";
        echo json_encode($rental->equipment->owner->gcashSetting, JSON_PRETTY_PRINT);
    }
} else {
    echo "No rental requests found in database.\n";
}

echo "\n\nDone!\n";

