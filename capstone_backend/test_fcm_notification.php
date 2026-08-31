<?php

/**
 * FCM Push Notification Test Script
 * 
 * This script tests if FCM push notifications are working properly.
 * It sends a test notification to user ID 15.
 */

// Include Laravel bootstrap
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "===========================================\n";
echo "    FCM Push Notification Test Script     \n";
echo "===========================================\n\n";

// Step 1: Check if user exists
echo "Step 1: Checking if user exists...\n";
$user = App\Models\User::find(15);

if (!$user) {
    echo "❌ ERROR: User with ID 15 not found!\n";
    echo "Please change the user ID in the script to a valid user.\n";
    exit(1);
}

echo "✅ User found: {$user->name} (ID: {$user->id}, Role: {$user->role})\n\n";

// Step 2: Check active FCM tokens
echo "Step 2: Checking active FCM tokens...\n";
$tokens = $user->fcmTokens()->active()->get();
$tokenCount = $tokens->count();

echo "Found {$tokenCount} active token(s) for this user.\n";

if ($tokenCount === 0) {
    echo "⚠️ WARNING: No active FCM tokens found!\n";
    echo "The user needs to grant notification permission in the browser.\n\n";
    
    // Show all tokens (including inactive)
    $allTokens = $user->fcmTokens()->get();
    if ($allTokens->count() > 0) {
        echo "Found {$allTokens->count()} total token(s) (including inactive):\n";
        foreach ($allTokens as $token) {
            $status = $token->is_active ? '✅ ACTIVE' : '❌ INACTIVE';
            $tokenPreview = substr($token->token, 0, 20) . '...';
            echo "  - {$status} | {$token->device_type} | {$token->browser} | {$tokenPreview}\n";
        }
    }
    
    echo "\nCannot send notification without active tokens.\n";
    exit(1);
}

foreach ($tokens as $token) {
    $tokenPreview = substr($token->token, 0, 20) . '...';
    echo "  ✅ Token ID {$token->id}: {$token->device_type} / {$token->browser} - {$tokenPreview}\n";
}

echo "\n";

// Step 3: Initialize NotificationService
echo "Step 3: Initializing NotificationService...\n";

try {
    $notificationService = app(\App\Services\NotificationService::class);
    echo "✅ NotificationService initialized successfully.\n\n";
} catch (\Exception $e) {
    echo "❌ ERROR: Failed to initialize NotificationService!\n";
    echo "Error: {$e->getMessage()}\n";
    exit(1);
}

// Step 4: Send test notification
echo "Step 4: Sending test notification...\n";
echo "Title: 🎉 Test Notification\n";
echo "Body: FCM Push Notifications are working!\n";
echo "Click Action: /{$user->role}/dashboard\n\n";

try {
    $result = $notificationService->sendToUser($user, [
        'title' => '🎉 Test Notification',
        'body' => 'FCM Push Notifications are working! This is a test from the backend.',
        'click_action' => '/' . $user->role . '/dashboard',
    ], [
        'type' => 'test',
        'user_id' => $user->id,
        'timestamp' => now()->toIso8601String(),
    ]);
    
    echo "✅ Notification sent!\n\n";
    
} catch (\Exception $e) {
    echo "❌ ERROR: Failed to send notification!\n";
    echo "Error: {$e->getMessage()}\n";
    exit(1);
}

// Step 5: Display results
echo "===========================================\n";
echo "              TEST RESULTS                 \n";
echo "===========================================\n\n";

if ($result['success']) {
    echo "✅ SUCCESS!\n\n";
    echo "Notifications Sent: {$result['stats']['success']}\n";
    echo "Failures: {$result['stats']['failure']}\n\n";
    
    if ($result['stats']['success'] > 0) {
        echo "🔔 CHECK YOUR BROWSER!\n";
        echo "You should see a notification popup in Chrome.\n\n";
        echo "If you don't see it:\n";
        echo "1. Check if notification permission is granted\n";
        echo "2. Check browser notification settings\n";
        echo "3. Look in the browser's notification center\n";
    }
    
    if ($result['stats']['failure'] > 0) {
        echo "⚠️ Some notifications failed to send.\n";
        echo "Check the Laravel logs for more details:\n";
        echo "storage/logs/laravel.log\n";
    }
    
} else {
    echo "❌ FAILED!\n\n";
    echo "Message: {$result['message']}\n";
    echo "Check the Laravel logs for more details.\n";
}

echo "\n";
echo "===========================================\n";
echo "To check active tokens in database:\n";
echo "php artisan tinker --execute=\"DB::table('fcm_tokens')->where('is_active', 1)->get()\"\n";
echo "\nTo view Laravel logs:\n";
echo "Get-Content storage/logs/laravel.log -Tail 50\n";
echo "===========================================\n";

exit(0);
