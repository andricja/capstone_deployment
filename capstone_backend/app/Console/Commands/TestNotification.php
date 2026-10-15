<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class TestNotification extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'notification:test {user_id?}';

    /**
     * The console command description.
     */
    protected $description = 'Test push notification for a specific user';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService)
    {
        $userId = $this->argument('user_id');
        
        // If no user ID provided, show list of users
        if (!$userId) {
            $this->info('Available users:');
            $users = User::select('id', 'name', 'email', 'role')->get();
            
            foreach ($users as $user) {
                $tokenCount = $user->fcmTokens()->active()->count();
                $this->line("ID: {$user->id} | {$user->name} ({$user->email}) | Role: {$user->role} | Tokens: {$tokenCount}");
            }
            
            $userId = $this->ask('Enter user ID to test');
        }
        
        // Find user
        $user = User::find($userId);
        
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return 1;
        }
        
        // Check FCM tokens
        $tokens = $user->fcmTokens()->active()->get();
        
        if ($tokens->isEmpty()) {
            $this->error("No active FCM tokens found for user: {$user->name}");
            $this->line("User needs to:");
            $this->line("1. Open the website");
            $this->line("2. Allow notifications when prompted");
            $this->line("3. Check Settings > Notifications to enable");
            return 1;
        }
        
        $this->info("Found {$tokens->count()} active token(s) for user: {$user->name}");
        
        foreach ($tokens as $token) {
            $this->line("  - Token: " . substr($token->token, 0, 30) . "...");
            $this->line("    Device: {$token->device_type}");
            $this->line("    Last used: {$token->last_used_at}");
        }
        
        // Send test notification
        $this->info("\nSending test notification...");
        
        $notification = [
            'title' => '🔔 Test Notification',
            'body' => 'This is a test notification from FERMs system. If you see this, notifications are working!',
            'icon' => '/logo.png',
            'click_action' => '/',
        ];
        
        $data = [
            'type' => 'test',
            'message' => 'Test notification sent at ' . now()->format('Y-m-d H:i:s'),
        ];
        
        $result = $notificationService->sendToUser($user, $notification, $data);
        
        if ($result['success']) {
            $this->info("✅ Notification sent successfully!");
            $this->line("Success: {$result['success_count']}");
            $this->line("Failed: {$result['failure_count']}");
            
            if (!empty($result['results'])) {
                $this->line("\nDetailed results:");
                foreach ($result['results'] as $tokenResult) {
                    $status = $tokenResult['success'] ? '✅ Success' : '❌ Failed';
                    $this->line("  {$status}: " . ($tokenResult['error'] ?? 'Sent'));
                }
            }
        } else {
            $this->error("❌ Failed to send notification");
            $this->error("Reason: {$result['message']}");
            
            if (isset($result['error'])) {
                $this->error("Error: {$result['error']}");
            }
        }
        
        $this->line("\n📝 Check your browser/phone for the notification!");
        $this->line("If you didn't receive it, check:");
        $this->line("1. Browser console (F12) for errors");
        $this->line("2. Browser notification permission is enabled");
        $this->line("3. Laravel log: storage/logs/laravel.log");
        
        return 0;
    }
}
