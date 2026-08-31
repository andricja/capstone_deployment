<?php

/**
 * Firebase API Diagnostic Script
 * Tests if Firebase Cloud Messaging API is properly configured
 */

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "===========================================\n";
echo "   Firebase API Diagnostic Test           \n";
echo "===========================================\n\n";

// Step 1: Check service account file
echo "Step 1: Checking service account file...\n";
$serviceAccountPath = storage_path('app/firebase-service-account.json');

if (!file_exists($serviceAccountPath)) {
    echo "❌ Service account file NOT found!\n";
    echo "Expected location: {$serviceAccountPath}\n";
    exit(1);
}

echo "✅ Service account file found\n";

try {
    $serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);
    echo "✅ Service account file is valid JSON\n";
    echo "   Project ID: {$serviceAccount['project_id']}\n";
    echo "   Client Email: {$serviceAccount['client_email']}\n\n";
} catch (\Exception $e) {
    echo "❌ Service account file is invalid\n";
    echo "Error: {$e->getMessage()}\n";
    exit(1);
}

// Step 2: Get Firebase access token
echo "Step 2: Getting Firebase access token...\n";

try {
    $service = app(\App\Services\NotificationService::class);
    
    // Use reflection to access private method
    $reflection = new \ReflectionClass($service);
    $method = $reflection->getMethod('getAccessToken');
    $method->setAccessible(true);
    
    $accessToken = $method->invoke($service);
    
    if (!$accessToken) {
        echo "❌ Failed to get access token\n";
        echo "Check Laravel logs: storage/logs/laravel.log\n";
        exit(1);
    }
    
    echo "✅ Access token obtained successfully\n";
    echo "   Token (first 30 chars): " . substr($accessToken, 0, 30) . "...\n\n";
    
} catch (\Exception $e) {
    echo "❌ Error getting access token\n";
    echo "Error: {$e->getMessage()}\n";
    exit(1);
}

// Step 3: Test Firebase Cloud Messaging API
echo "Step 3: Testing Firebase Cloud Messaging API...\n";
echo "Sending test request to Firebase...\n\n";

$projectId = env('FIREBASE_PROJECT_ID', 'ferms-93bfe');
$url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

$testPayload = [
    'message' => [
        'token' => 'test-invalid-token-for-api-check',
        'notification' => [
            'title' => 'API Test',
            'body' => 'Testing Firebase API'
        ]
    ]
];

try {
    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Authorization' => 'Bearer ' . $accessToken,
        'Content-Type' => 'application/json',
    ])->post($url, $testPayload);
    
    $statusCode = $response->status();
    $responseBody = $response->json();
    
    echo "Status Code: {$statusCode}\n";
    echo "Response:\n";
    echo json_encode($responseBody, JSON_PRETTY_PRINT) . "\n\n";
    
    // Analyze response
    echo "===========================================\n";
    echo "              DIAGNOSIS                    \n";
    echo "===========================================\n\n";
    
    if ($statusCode === 404) {
        echo "❌ PROBLEM IDENTIFIED: Firebase Cloud Messaging API is NOT ENABLED\n\n";
        echo "Solution:\n";
        echo "1. Go to: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project={$projectId}\n";
        echo "2. Click the ENABLE button\n";
        echo "3. Wait 2-3 minutes for the API to activate\n";
        echo "4. Run this test again\n\n";
        echo "Alternative link:\n";
        echo "https://console.firebase.google.com/project/{$projectId}/settings/cloudmessaging\n";
        
    } elseif ($statusCode === 400) {
        $errorStatus = $responseBody['error']['status'] ?? 'UNKNOWN';
        
        if ($errorStatus === 'INVALID_ARGUMENT') {
            echo "✅ SUCCESS! Firebase Cloud Messaging API is ENABLED and WORKING!\n\n";
            echo "The 400 error is EXPECTED because we used an invalid test token.\n";
            echo "This confirms the API is active and ready to send notifications.\n\n";
            echo "Next step:\n";
            echo "- Your Firebase API is configured correctly\n";
            echo "- The token invalid issue is likely:\n";
            echo "  1. Tokens generated for wrong Firebase project, OR\n";
            echo "  2. Service worker not properly registered, OR\n";
            echo "  3. VAPID key mismatch\n\n";
            echo "Try regenerating a new token:\n";
            echo "1. Clear browser cache\n";
            echo "2. Reload your app\n";
            echo "3. Grant notification permission again\n";
            echo "4. Test notification\n";
            
        } else {
            echo "⚠️ UNEXPECTED ERROR\n\n";
            echo "Error Status: {$errorStatus}\n";
            echo "Error Message: " . ($responseBody['error']['message'] ?? 'Unknown') . "\n";
        }
        
    } elseif ($statusCode === 403) {
        echo "❌ PROBLEM: Permission Denied\n\n";
        echo "The service account doesn't have permission to send messages.\n\n";
        echo "Solution:\n";
        echo "1. Go to: https://console.cloud.google.com/iam-admin/iam?project={$projectId}\n";
        echo "2. Find: {$serviceAccount['client_email']}\n";
        echo "3. Add these roles:\n";
        echo "   - Firebase Cloud Messaging Admin\n";
        echo "   - Firebase Admin SDK Administrator Service Agent\n";
        
    } else {
        echo "⚠️ UNEXPECTED STATUS CODE: {$statusCode}\n\n";
        echo "This might indicate:\n";
        echo "- Network issue\n";
        echo "- Firebase is down\n";
        echo "- Project configuration problem\n";
    }
    
} catch (\Exception $e) {
    echo "❌ EXCEPTION occurred\n";
    echo "Error: {$e->getMessage()}\n";
    exit(1);
}

echo "\n===========================================\n";
echo "Diagnostic test completed!\n";
echo "===========================================\n";
