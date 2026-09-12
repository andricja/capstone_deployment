<?php
// Debug script to see actual OAuth URL being generated
// Access at: https://ferms.net/capstone_backend/debug_oauth_url.php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

header('Content-Type: text/plain');

echo "=== OAuth URL Debug ===\n\n";

try {
    echo "1. Configuration Values:\n";
    echo "   Client ID: " . config('services.google.client_id') . "\n";
    echo "   Redirect: " . config('services.google.redirect') . "\n\n";
    
    echo "2. Generating OAuth URL:\n";
    $driver = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless();
    $url = $driver->redirect()->getTargetUrl();
    
    echo "   Full URL:\n   " . $url . "\n\n";
    
    // Parse URL to extract parameters
    $parsed = parse_url($url);
    parse_str($parsed['query'] ?? '', $params);
    
    echo "3. URL Parameters:\n";
    echo "   client_id: " . ($params['client_id'] ?? 'NOT FOUND') . "\n";
    echo "   redirect_uri: " . ($params['redirect_uri'] ?? 'NOT FOUND') . "\n";
    echo "   scope: " . ($params['scope'] ?? 'NOT FOUND') . "\n\n";
    
    echo "4. Verification:\n";
    $expectedClientId = '639221514224-0ofvgbhe2ka6n38k2n51pdsbi4v4aarp.apps.googleusercontent.com';
    if (isset($params['client_id']) && $params['client_id'] === $expectedClientId) {
        echo "   ✓ Client ID in URL matches expected value\n";
    } else {
        echo "   ✗ Client ID MISMATCH!\n";
        echo "   Expected: $expectedClientId\n";
        echo "   Got: " . ($params['client_id'] ?? 'NONE') . "\n";
    }
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== END ===\n";

$kernel->terminate($request, $response);
