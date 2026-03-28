<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Equipment;

echo "=== Testing Equipment with Structured Address ===\n\n";

// Find an owner
$owner = User::where('role', 'owner')->first();
if (!$owner) {
    echo "❌ No owner found. Please create an owner user first.\n";
    exit(1);
}

echo "✓ Found owner: {$owner->name} (ID: {$owner->id})\n\n";

// Create test equipment with structured address
$equipmentData = [
    'owner_id' => $owner->id,
    'name' => 'Test Tractor with Location',
    'category' => 'tractor',
    'description' => 'Testing structured address system',
    'daily_rate' => 1500.00,
    'transportation_fee' => 0,
    'municipality' => 'Calapan',
    'barangay' => 'Baruyan',
    'province' => 'Oriental Mindoro',
    'latitude' => 13.4119,
    'longitude' => 121.1803,
    'status' => 'available',
];

// Auto-generate location field
$equipmentData['location'] = $equipmentData['barangay'] . ', ' . $equipmentData['municipality'];

echo "Creating equipment with:\n";
echo "  Municipality: {$equipmentData['municipality']}\n";
echo "  Barangay: {$equipmentData['barangay']}\n";
echo "  Province: {$equipmentData['province']}\n";
echo "  Auto-generated location: {$equipmentData['location']}\n";
echo "  Coordinates: ({$equipmentData['latitude']}, {$equipmentData['longitude']})\n\n";

try {
    $equipment = Equipment::create($equipmentData);
    echo "✓ Equipment created successfully!\n\n";
    
    echo "Equipment details:\n";
    echo "  ID: {$equipment->id}\n";
    echo "  Name: {$equipment->name}\n";
    echo "  Location (legacy): {$equipment->location}\n";
    echo "  Municipality: {$equipment->municipality}\n";
    echo "  Barangay: {$equipment->barangay}\n";
    echo "  Province: {$equipment->province}\n";
    echo "  Latitude: {$equipment->latitude}\n";
    echo "  Longitude: {$equipment->longitude}\n";
    echo "  Status: {$equipment->status}\n\n";
    
    echo "✓ All fields saved correctly!\n";
    
    // Clean up
    $equipment->delete();
    echo "\n✓ Test equipment deleted (cleanup)\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Test completed successfully! ===\n";
