<?php

// Test script to check Google OAuth configuration
// Run this with: php test_google_config.php

// Load Laravel
require __DIR__ . '/capstone_backend/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone_backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Google OAuth Configuration ===\n\n";

echo "Client ID from config:\n";
echo config('services.google.client_id') . "\n\n";

echo "Client Secret from config:\n";
echo config('services.google.client_secret') . "\n\n";

echo "Redirect URI from config:\n";
echo config('services.google.redirect') . "\n\n";

echo "=== From .env file directly ===\n\n";
echo "GOOGLE_CLIENT_ID: " . env('GOOGLE_CLIENT_ID') . "\n";
echo "GOOGLE_CLIENT_SECRET: " . env('GOOGLE_CLIENT_SECRET') . "\n";
echo "GOOGLE_REDIRECT_URI: " . env('GOOGLE_REDIRECT_URI') . "\n\n";

echo "=== Generating OAuth URL ===\n\n";
try {
    $url = \Laravel\Socialite\Facades\Socialite::driver('google')
        ->stateless()
        ->redirect()
        ->getTargetUrl();
    
    echo "Generated URL:\n";
    echo $url . "\n\n";
    
    // Parse the URL to extract client_id
    parse_str(parse_url($url, PHP_URL_QUERY), $params);
    echo "Client ID being sent to Google:\n";
    echo $params['client_id'] ?? 'NOT FOUND' . "\n";
} catch (\Exception $e) {
    echo "Error generating URL: " . $e->getMessage() . "\n";
}
