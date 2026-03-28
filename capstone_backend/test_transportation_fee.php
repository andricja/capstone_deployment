<?php

require __DIR__ . '/vendor/autoload.php';

use App\Services\TransportationFeeCalculator;

echo "=== Transportation Fee Calculator Test ===\n\n";

// Test 1: Short distance (free delivery)
echo "Test 1: Short Distance (3 km)\n";
$fee1 = TransportationFeeCalculator::calculate(13.4000, 121.1000, 13.4200, 121.1100);
$breakdown1 = TransportationFeeCalculator::getBreakdown(13.4000, 121.1000, 13.4200, 121.1100);
echo "Distance: {$breakdown1['distance_km']} km\n";
echo "Fee: ₱{$fee1}\n";
echo "Free Delivery: " . ($breakdown1['free_delivery'] ? 'Yes' : 'No') . "\n\n";

// Test 2: Medium distance
echo "Test 2: Medium Distance (10 km)\n";
$fee2 = TransportationFeeCalculator::calculate(13.4000, 121.1000, 13.4500, 121.1500);
$breakdown2 = TransportationFeeCalculator::getBreakdown(13.4000, 121.1000, 13.4500, 121.1500);
echo "Distance: {$breakdown2['distance_km']} km\n";
echo "Chargeable Distance: {$breakdown2['chargeable_distance_km']} km\n";
echo "Base Fee: ₱{$breakdown2['base_fee']}\n";
echo "Distance Fee: ₱{$breakdown2['distance_fee']}\n";
echo "Total Fee: ₱{$fee2}\n\n";

// Test 3: Long distance
echo "Test 3: Long Distance (25 km)\n";
$fee3 = TransportationFeeCalculator::calculate(13.4000, 121.1000, 13.6000, 121.3000);
$breakdown3 = TransportationFeeCalculator::getBreakdown(13.4000, 121.1000, 13.6000, 121.3000);
echo "Distance: {$breakdown3['distance_km']} km\n";
echo "Chargeable Distance: {$breakdown3['chargeable_distance_km']} km\n";
echo "Base Fee: ₱{$breakdown3['base_fee']}\n";
echo "Distance Fee: ₱{$breakdown3['distance_fee']}\n";
echo "Total Fee: ₱{$fee3}\n\n";

// Test 4: Missing coordinates
echo "Test 4: Missing Coordinates (fallback)\n";
$fee4 = TransportationFeeCalculator::calculate(null, null, 13.4000, 121.1000);
$breakdown4 = TransportationFeeCalculator::getBreakdown(null, null, 13.4000, 121.1000);
echo "Fee: ₱{$fee4}\n";
echo "Note: {$breakdown4['note']}\n\n";

echo "=== All Tests Completed ===\n";
