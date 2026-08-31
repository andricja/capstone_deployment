<?php

namespace App\Services;

use App\Models\User;
use App\Models\FcmToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class NotificationService
{
    private $projectId;
    private $serviceAccountPath;

    public function __construct()
    {
        $this->projectId = env('FIREBASE_PROJECT_ID', 'ferms-93bfe');
        $this->serviceAccountPath = storage_path('app/firebase-service-account.json');
    }

    /**
     * Get OAuth 2.0 access token for Firebase
     */
    private function getAccessToken(): ?string
    {
        if (!file_exists($this->serviceAccountPath)) {
            Log::error('Firebase service account file not found');
            return null;
        }

        try {
            $serviceAccount = json_decode(file_get_contents($this->serviceAccountPath), true);

            // Create JWT
            $now = time();
            $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
            $claim = json_encode([
                'iss' => $serviceAccount['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ]);

            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64UrlClaim = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($claim));
            $signature = '';
            openssl_sign(
                $base64UrlHeader . '.' . $base64UrlClaim,
                $signature,
                $serviceAccount['private_key'],
                'SHA256'
            );
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            $jwt = $base64UrlHeader . '.' . $base64UrlClaim . '.' . $base64UrlSignature;

            // Exchange JWT for access token
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            $result = $response->json();
            return $result['access_token'] ?? null;
        } catch (\Exception $e) {
            Log::error('Failed to get Firebase access token', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send notification to a specific user
     */
    public function sendToUser(User $user, array $notification, array $data = []): array
    {
        $tokens = $user->fcmTokens()->active()->pluck('token')->toArray();
        
        if (empty($tokens)) {
            return [
                'success' => false,
                'message' => 'No active FCM tokens found for user',
            ];
        }

        return $this->sendToTokens($tokens, $notification, $data);
    }

    /**
     * Send notification to multiple users
     */
    public function sendToUsers(array $userIds, array $notification, array $data = []): array
    {
        $tokens = FcmToken::whereIn('user_id', $userIds)
            ->active()
            ->pluck('token')
            ->toArray();

        if (empty($tokens)) {
            return [
                'success' => false,
                'message' => 'No active FCM tokens found',
            ];
        }

        return $this->sendToTokens($tokens, $notification, $data);
    }

    /**
     * Send notification to specific tokens (V1 API)
     */
    public function sendToTokens(array $tokens, array $notification, array $data = []): array
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Firebase not configured properly',
            ];
        }

        $successCount = 0;
        $failureCount = 0;
        $errors = [];

        foreach ($tokens as $token) {
            $result = $this->sendToSingleToken($token, $notification, $data, $accessToken);
            
            if ($result['success']) {
                $successCount++;
            } else {
                $failureCount++;
                $errors[] = $result['error'] ?? 'Unknown error';
                
                // Deactivate invalid tokens
                if (isset($result['error']) && in_array($result['error'], ['NOT_FOUND', 'INVALID_ARGUMENT', 'UNREGISTERED'])) {
                    FcmToken::where('token', $token)->update(['is_active' => false]);
                    Log::info('Deactivated invalid FCM token', ['token' => substr($token, 0, 20) . '...']);
                }
            }
        }

        Log::info('FCM notifications sent (V1 API)', [
            'success' => $successCount,
            'failure' => $failureCount,
        ]);

        return [
            'success' => $successCount > 0,
            'result' => [
                'success' => $successCount,
                'failure' => $failureCount,
                'errors' => $errors,
            ],
        ];
    }

    /**
     * Send notification to a single token (V1 API)
     */
    private function sendToSingleToken(string $token, array $notification, array $data, string $accessToken): array
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

        // Build webpush-specific payload (required for web notifications)
        $payload = [
            'message' => [
                'token' => trim($token), // Ensure no whitespace
                'notification' => [
                    'title' => $notification['title'] ?? 'FERMs Notification',
                    'body' => $notification['body'] ?? '',
                ],
                'webpush' => [
                    'headers' => [
                        'Urgency' => 'high',
                    ],
                    'notification' => [
                        'title' => $notification['title'] ?? 'FERMs Notification',
                        'body' => $notification['body'] ?? '',
                        'icon' => $notification['icon'] ?? '/logo.png',
                        'badge' => $notification['badge'] ?? '/logo.png',
                        'requireInteraction' => false,
                        'tag' => $data['type'] ?? 'general',
                    ],
                    'fcm_options' => [
                        'link' => $notification['click_action'] ?? '/',
                    ],
                    'data' => array_map('strval', array_merge($data, [
                        'timestamp' => now()->toIso8601String(),
                        'click_action' => $notification['click_action'] ?? '/',
                    ])),
                ],
            ],
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->successful()) {
                return ['success' => true];
            }

            $error = $response->json();
            Log::error('FCM send failed', [
                'status' => $response->status(),
                'error' => $error,
                'token_preview' => substr($token, 0, 20) . '...',
            ]);
            
            return [
                'success' => false,
                'error' => $error['error']['status'] ?? 'UNKNOWN',
                'message' => $error['error']['message'] ?? 'Unknown error',
                'details' => $error['error']['details'] ?? [],
            ];
        } catch (\Exception $e) {
            Log::error('FCM exception', [
                'message' => $e->getMessage(),
                'token_preview' => substr($token, 0, 20) . '...',
            ]);
            
            return [
                'success' => false,
                'error' => 'EXCEPTION',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send notification to users by role
     */
    public function sendToRole(string $role, array $notification, array $data = []): array
    {
        $userIds = User::where('role', $role)->pluck('id')->toArray();
        return $this->sendToUsers($userIds, $notification, $data);
    }

    /**
     * Helper method: Send notification for new rental request
     */
    public function notifyNewRentalRequest($rentalRequest): array
    {
        $owner = $rentalRequest->equipment->user;
        $renter = $rentalRequest->user;
        
        return $this->sendToUser($owner, [
            'title' => '🔔 New Rental Request',
            'body' => "{$renter->name} wants to rent your {$rentalRequest->equipment->name}",
            'click_action' => '/owner/rentals',
            'icon' => '/logo.png',
        ], [
            'type' => 'rental_request',
            'rental_id' => (string)$rentalRequest->id,
            'equipment_id' => (string)$rentalRequest->equipment_id,
        ]);
    }

    /**
     * Helper method: Send notification for rental approved
     */
    public function notifyRentalApproved($rentalRequest): array
    {
        $renter = $rentalRequest->user;
        
        return $this->sendToUser($renter, [
            'title' => '✅ Rental Approved!',
            'body' => "Your rental request for {$rentalRequest->equipment->name} has been approved!",
            'click_action' => '/renter/rentals',
            'icon' => '/logo.png',
        ], [
            'type' => 'rental_approved',
            'rental_id' => (string)$rentalRequest->id,
            'equipment_id' => (string)$rentalRequest->equipment_id,
        ]);
    }

    /**
     * Helper method: Send notification for rental rejected
     */
    public function notifyRentalRejected($rentalRequest): array
    {
        $renter = $rentalRequest->user;
        $reason = $rentalRequest->rejection_reason ?? 'No reason provided';
        
        return $this->sendToUser($renter, [
            'title' => '❌ Rental Request Rejected',
            'body' => "Your rental request for {$rentalRequest->equipment->name} was rejected. Reason: {$reason}",
            'click_action' => '/renter/rentals',
            'icon' => '/logo.png',
        ], [
            'type' => 'rental_rejected',
            'rental_id' => (string)$rentalRequest->id,
            'equipment_id' => (string)$rentalRequest->equipment_id,
        ]);
    }

    /**
     * Helper method: Send notification for payment received
     */
    public function notifyPaymentReceived($rentalRequest): array
    {
        $owner = $rentalRequest->equipment->user;
        $renter = $rentalRequest->user;
        
        return $this->sendToUser($owner, [
            'title' => '💰 Payment Received',
            'body' => "{$renter->name} has paid for {$rentalRequest->equipment->name} rental",
            'click_action' => '/owner/rentals',
            'icon' => '/logo.png',
        ], [
            'type' => 'payment_received',
            'rental_id' => (string)$rentalRequest->id,
            'equipment_id' => (string)$rentalRequest->equipment_id,
        ]);
    }

    /**
     * Helper method: Send notification for payment verified
     */
    public function notifyPaymentVerified($rentalRequest): array
    {
        $renter = $rentalRequest->user;
        
        return $this->sendToUser($renter, [
            'title' => '✅ Payment Verified',
            'body' => "Your payment for {$rentalRequest->equipment->name} has been verified!",
            'click_action' => '/renter/rentals',
            'icon' => '/logo.png',
        ], [
            'type' => 'payment_verified',
            'rental_id' => (string)$rentalRequest->id,
            'equipment_id' => (string)$rentalRequest->equipment_id,
        ]);
    }

    /**
     * Helper method: Send notification for equipment approved
     */
    public function notifyEquipmentApproved($equipment): array
    {
        $owner = $equipment->user;
        
        return $this->sendToUser($owner, [
            'title' => '✅ Equipment Approved',
            'body' => "Your equipment {$equipment->name} has been approved and is now listed!",
            'click_action' => '/owner/equipment',
            'icon' => '/logo.png',
        ], [
            'type' => 'equipment_approved',
            'equipment_id' => (string)$equipment->id,
        ]);
    }

    /**
     * Helper method: Send notification for equipment rejected
     */
    public function notifyEquipmentRejected($equipment): array
    {
        $owner = $equipment->user;
        
        return $this->sendToUser($owner, [
            'title' => '❌ Equipment Rejected',
            'body' => "Your equipment {$equipment->name} was not approved. Please check the details.",
            'click_action' => '/owner/equipment',
            'icon' => '/logo.png',
        ], [
            'type' => 'equipment_rejected',
            'equipment_id' => (string)$equipment->id,
        ]);
    }

    /**
     * Helper method: Send notification for account approved
     */
    public function notifyAccountApproved($user): array
    {
        return $this->sendToUser($user, [
            'title' => '🎉 Account Approved!',
            'body' => "Your {$user->role} account has been approved. You can now use FERMs!",
            'click_action' => '/' . $user->role . '/dashboard',
            'icon' => '/logo.png',
        ], [
            'type' => 'account_approved',
            'user_id' => (string)$user->id,
        ]);
    }

    /**
     * Helper method: Send notification for account rejected
     */
    public function notifyAccountRejected($user): array
    {
        return $this->sendToUser($user, [
            'title' => '❌ Account Not Approved',
            'body' => "Unfortunately, your {$user->role} account was not approved.",
            'click_action' => '/',
            'icon' => '/logo.png',
        ], [
            'type' => 'account_rejected',
            'user_id' => (string)$user->id,
        ]);
    }

    /**
     * Notification templates (kept for backward compatibility)
     */
    public function rentalRequestApproved($rental): array
    {
        return [
            'title' => '✅ Rental Request Approved',
            'body' => "Your rental request for {$rental->equipment->name} has been approved!",
            'click_action' => '/renter/rentals',
            'icon' => '/icons/check-circle.png',
        ];
    }

    public function rentalRequestRejected($rental, $reason = ''): array
    {
        $body = "Your rental request for {$rental->equipment->name} was rejected.";
        if ($reason) {
            $body .= " Reason: {$reason}";
        }

        return [
            'title' => '❌ Rental Request Rejected',
            'body' => $body,
            'click_action' => '/renter/rentals',
            'icon' => '/icons/x-circle.png',
        ];
    }

    public function newRentalRequest($rental): array
    {
        return [
            'title' => '🔔 New Rental Request',
            'body' => "New rental request for your {$rental->equipment->name}",
            'click_action' => '/owner/rentals',
            'icon' => '/icons/bell.png',
        ];
    }

    public function paymentReceived($rental): array
    {
        return [
            'title' => '💰 Payment Received',
            'body' => "Payment confirmed for {$rental->equipment->name} rental",
            'click_action' => '/owner/sales',
            'icon' => '/icons/dollar-sign.png',
        ];
    }

    public function pointsPurchaseApproved($pointsRequest): array
    {
        return [
            'title' => '🎉 Points Purchase Approved',
            'body' => "Your purchase of {$pointsRequest->points} points has been approved!",
            'click_action' => '/renter/buy-points',
            'icon' => '/icons/coins.png',
        ];
    }

    public function rentalExpiringSoon($rental): array
    {
        return [
            'title' => '⏰ Rental Expiring Soon',
            'body' => "Your rental for {$rental->equipment->name} ends in 24 hours",
            'click_action' => '/renter/rentals',
            'icon' => '/icons/clock.png',
        ];
    }

    public function newUserRegistration($user): array
    {
        return [
            'title' => '📝 New User Registration',
            'body' => "New {$user->role} '{$user->name}' is waiting for approval",
            'click_action' => '/admin/accounts',
            'icon' => '/icons/user-plus.png',
        ];
    }

    public function newEquipmentListing($equipment): array
    {
        return [
            'title' => '🚜 New Equipment Listing',
            'body' => "New equipment '{$equipment->name}' is pending approval",
            'click_action' => '/admin/equipment',
            'icon' => '/icons/tractor.png',
        ];
    }
}
