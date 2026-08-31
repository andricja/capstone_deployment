<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FcmTokenController extends Controller
{
    /**
     * Store or update FCM token for the authenticated user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|max:500',
            'device_type' => 'nullable|string|in:web,android,ios',
            'browser' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();

        // Check if token already exists
        $fcmToken = FcmToken::where('token', $validated['token'])->first();

        if ($fcmToken) {
            // Update existing token
            $fcmToken->update([
                'user_id' => $user->id,
                'device_type' => $validated['device_type'] ?? 'web',
                'browser' => $validated['browser'] ?? null,
                'is_active' => true,
                'last_used_at' => now(),
            ]);
        } else {
            // Create new token
            $fcmToken = FcmToken::create([
                'user_id' => $user->id,
                'token' => $validated['token'],
                'device_type' => $validated['device_type'] ?? 'web',
                'browser' => $validated['browser'] ?? null,
                'is_active' => true,
                'last_used_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'FCM token registered successfully',
            'token_id' => $fcmToken->id,
        ]);
    }

    /**
     * Get all FCM tokens for the authenticated user
     */
    public function index()
    {
        $user = Auth::user();
        $tokens = $user->fcmTokens()->active()->get();

        return response()->json([
            'success' => true,
            'tokens' => $tokens,
        ]);
    }

    /**
     * Delete FCM token
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();

        $deleted = FcmToken::where('token', $validated['token'])
            ->where('user_id', $user->id)
            ->delete();

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'FCM token removed successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Token not found',
        ], 404);
    }

    /**
     * Update notification preferences
     */
    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.rental_updates' => 'boolean',
            'preferences.payment_notifications' => 'boolean',
            'preferences.equipment_alerts' => 'boolean',
            'preferences.admin_notifications' => 'boolean',
            'preferences.marketing' => 'boolean',
        ]);

        $user = Auth::user();
        $user->update([
            'notification_preferences' => $validated['preferences'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated',
            'preferences' => $user->notification_preferences,
        ]);
    }

    /**
     * Get notification preferences
     */
    public function getPreferences()
    {
        $user = Auth::user();
        
        $defaultPreferences = [
            'rental_updates' => true,
            'payment_notifications' => true,
            'equipment_alerts' => true,
            'admin_notifications' => true,
            'marketing' => false,
        ];

        $preferences = $user->notification_preferences ?? $defaultPreferences;

        return response()->json([
            'success' => true,
            'preferences' => $preferences,
        ]);
    }

    /**
     * Test notification (for testing purposes)
     */
    public function testNotification(Request $request)
    {
        $user = Auth::user();
        
        $notificationService = app(\App\Services\NotificationService::class);
        
        $result = $notificationService->sendToUser($user, [
            'title' => '🔔 Test Notification',
            'body' => 'This is a test notification from FERMs!',
            'click_action' => '/' . $user->role . '/dashboard',
        ], [
            'type' => 'test',
            'user_id' => $user->id,
        ]);

        return response()->json($result);
    }
}
