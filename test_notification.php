<?php

// Quick test script for push notifications
// Run: php test_notification.php

require __DIR__ . '/capstone_backend/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone_backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Services\NotificationService;

echo "==============================================\n";
echo "🔔 FERMs Push Notification Test\n";
echo "==============================================\n\n";

// Get all users with FCM tokens
echo "📋 Users with active FCM tokens:\n";
echo "----------------------------------------------\n";

$users = \App\Models\User::whereHas('fcmTokens', function($q) {
    $q->where('is_active', true);
})->get();

foreach ($users as $user) {
    $tokenCount = $user->fcmTokens()->active()->count();
    echo "ID: {$user->id} | {$user->name} ({$user->email})\n";
    echo "   Role: {$user->role} | Tokens: {$tokenCount}\n\n";
}

echo "----------------------------------------------\n";
echo "Enter user ID to send test notification: ";
$userId = trim(fgets(STDIN));

$user = User::find($userId);

if (!$user) {
    echo "❌ User not found!\n";
    exit(1);
}

echo "\n✅ Testing notification for: {$user->name}\n\n";

// Check tokens
$tokens = $user->fcmTokens()->active()->get();
echo "📱 Active tokens: {$tokens->count()}\n";

foreach ($tokens as $token) {
    echo "   - " . substr($token->token, 0, 40) . "...\n";
    echo "     Device: {$token->device_type}, Last used: {$token->last_used_at}\n";
}

echo "\n";

// Send notification
$notificationService = app(NotificationService::class);

$notification = [
    'title' => '🎉 Test Notification',
    'body' => 'Hello from FERMs! This is a test notification sent at ' . now()->format('H:i:s'),
    'icon' => '/logo.png',
    'click_action' => '/',
];

$data = [
    'type' => 'test',
    'timestamp' => now()->toIso8601String(),
];

echo "📤 Sending notification...\n";

$result = $notificationService->sendToUser($user, $notification, $data);

echo "\n";
echo "==============================================\n";
echo "📊 Results:\n";
echo "==============================================\n";

if ($result['success']) {
    echo "✅ Status: SUCCESS\n";
    echo "📈 Sent: {$result['result']['success']}\n";
    echo "❌ Failed: {$result['result']['failure']}\n\n";
    
    if (!empty($result['result']['errors'])) {
        echo "❌ Errors encountered:\n";
        foreach ($result['result']['errors'] as $idx => $error) {
            echo "  • Error " . ($idx + 1) . ": $error\n";
        }
        echo "\n";
    }
    
    if ($result['result']['success'] > 0) {
        echo "✅ SUCCESS! Notification(s) were delivered.\n";
        echo "\nWhere to check:\n";
        echo "  • Browser console (F12 → Console tab)\n";
        echo "  • Bottom-right corner of Windows\n";
        echo "  • Windows notification center (🔔 icon)\n";
    }
} else {
    echo "❌ Status: FAILED\n";
    echo "Reason: {$result['message']}\n";
    
    if (isset($result['error'])) {
        echo "Error: {$result['error']}\n";
    }
}

echo "\n==============================================\n";
echo "🔍 Troubleshooting:\n";
echo "==============================================\n";
echo "1. Check your browser/phone for notification\n";
echo "2. Open browser console (F12) for errors\n";
echo "3. Check Laravel log: capstone_backend/storage/logs/laravel.log\n";
echo "4. Verify notification permission is allowed in browser\n";
echo "\n";

// Check service account file
$serviceAccountPath = __DIR__ . '/capstone_backend/storage/app/firebase-service-account.json';
if (file_exists($serviceAccountPath)) {
    echo "✅ Firebase service account file exists\n";
    $serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);
    echo "   Project ID: " . ($serviceAccount['project_id'] ?? 'N/A') . "\n";
} else {
    echo "❌ Firebase service account file NOT FOUND\n";
    echo "   Expected at: {$serviceAccountPath}\n";
}

echo "\n";
echo "Done! Check your browser for the notification 🔔\n";
