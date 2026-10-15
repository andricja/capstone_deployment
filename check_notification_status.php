<?php

require __DIR__ . '/capstone_backend/vendor/autoload.php';
$app = require_once __DIR__ . '/capstone_backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==============================================\n";
echo "📊 Notification Delivery Status Check\n";
echo "==============================================\n\n";

// Read last 20 lines of log
$logFile = __DIR__ . '/capstone_backend/storage/logs/laravel.log';
$lines = file($logFile);
$last20 = array_slice($lines, -20);

echo "Recent notification activity:\n";
echo "----------------------------------------------\n";

$successCount = 0;
$failureCount = 0;

foreach ($last20 as $line) {
    if (strpos($line, 'FCM notifications sent') !== false) {
        // Extract success and failure counts
        if (preg_match('/"success":(\d+)/', $line, $matches)) {
            $successCount = $matches[1];
        }
        if (preg_match('/"failure":(\d+)/', $line, $matches)) {
            $failureCount = $matches[1];
        }
        
        $timestamp = substr($line, 1, 19);
        echo "⏰ Time: $timestamp\n";
        echo "✅ Successfully delivered: $successCount\n";
        echo "❌ Failed: $failureCount\n\n";
    }
}

if ($successCount > 0) {
    echo "==============================================\n";
    echo "✅ NOTIFICATIONS ARE WORKING!\n";
    echo "==============================================\n";
    echo "$successCount notification(s) were delivered.\n\n";
    
    echo "Where to check:\n";
    echo "1. Bottom-right corner of Windows (notification area)\n";
    echo "2. Browser console (F12 → Console tab)\n";
    echo "3. Windows notification center (click 🔔 icon)\n\n";
    
    echo "If you didn't see it:\n";
    echo "- It might have appeared and auto-closed\n";
    echo "- Check Windows notification center\n";
    echo "- Browser might have been minimized\n";
} else {
    echo "==============================================\n";
    echo "⚠️  No recent successful deliveries\n";
    echo "==============================================\n";
}

// Check browser console messages
echo "\n📱 What to check in browser:\n";
echo "----------------------------------------------\n";
echo "Open http://localhost:5173 and press F12\n";
echo "You should see in Console:\n";
echo "  • 'Service Worker registered successfully'\n";
echo "  • 'FCM Token: ...'\n";
echo "  • 'Notification permission granted'\n";
echo "\nIf notification was received, you'll see:\n";
echo "  • 'Foreground message received: {...}'\n\n";

// Check current active tokens
$user = App\Models\User::find(1);
$tokens = $user->fcmTokens()->active()->get();

echo "\n📲 Your Active Tokens:\n";
echo "----------------------------------------------\n";
foreach ($tokens as $token) {
    $lastUsed = $token->last_used_at ?? 'Never';
    echo "Token: " . substr($token->token, 0, 30) . "...\n";
    echo "  Last used: $lastUsed\n";
    echo "  Status: " . ($token->is_active ? '✅ Active' : '❌ Inactive') . "\n\n";
}

echo "==============================================\n";
