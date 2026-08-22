<?php

/**
 * Test IP Detection Script
 * 
 * Run this to test if your IP address detection is working correctly
 * 
 * Usage:
 * php test_ip_detection.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Simulate a request with various headers
$request = Illuminate\Http\Request::create('/test', 'GET', [], [], [], [
    'REMOTE_ADDR' => '127.0.0.1',
    'HTTP_X_FORWARDED_FOR' => '203.177.45.123, 10.0.0.1',
    'HTTP_X_REAL_IP' => '203.177.45.100',
    'HTTP_CF_CONNECTING_IP' => '203.177.45.200',
    'HTTP_USER_AGENT' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
]);

$app->instance('request', $request);

echo "==========================================\n";
echo "IP DETECTION TEST\n";
echo "==========================================\n\n";

echo "1. Direct IP (REMOTE_ADDR):\n";
echo "   " . $_SERVER['REMOTE_ADDR'] ?? 'Not set' . "\n\n";

echo "2. Request IP (Laravel):\n";
echo "   " . $request->ip() . "\n\n";

echo "3. Headers:\n";
echo "   X-Forwarded-For: " . ($request->header('X-Forwarded-For') ?? 'Not set') . "\n";
echo "   X-Real-IP: " . ($request->header('X-Real-IP') ?? 'Not set') . "\n";
echo "   CF-Connecting-IP: " . ($request->header('CF-Connecting-IP') ?? 'Not set') . "\n\n";

echo "4. User Agent:\n";
echo "   " . ($request->userAgent() ?? 'Not set') . "\n\n";

echo "5. AuditService Detection:\n";
$ipAddress = $request->ip();
if ($ipAddress === '127.0.0.1' || $ipAddress === '::1') {
    $ipAddress = $request->header('X-Forwarded-For') 
        ?? $request->header('X-Real-IP') 
        ?? $request->header('CF-Connecting-IP')
        ?? $ipAddress;
    
    if (str_contains($ipAddress, ',')) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }
}
echo "   Final IP: " . $ipAddress . "\n\n";

echo "==========================================\n";
echo "TEST COMPLETE\n";
echo "==========================================\n";
echo "\nIf you see real IPs (not 127.0.0.1), configuration is working!\n";
