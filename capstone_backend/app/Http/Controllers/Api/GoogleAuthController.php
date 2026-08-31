<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        try {
            $url = Socialite::driver('google')
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json([
                'url' => $url
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate Google auth URL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            // Get user info from Google
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Check if user exists by email
            $user = User::where('email', $googleUser->email)->first();

            if ($user) {
                // Update existing user with Google info
                $user->update([
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                ]);

                // If user hasn't verified email, mark as verified
                if (!$user->email_verified_at) {
                    $user->email_verified_at = now();
                    $user->save();
                }
            } else {
                // Create new user with Google info
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'role' => 'renter', // Default role for new users
                    'email_verified_at' => now(), // Google emails are pre-verified
                    'password' => null, // No password for Google-only users
                ]);
            }

            // Generate authentication token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Prepare user data
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'email_verified_at' => $user->email_verified_at,
            ];

            // Build frontend callback URL with data
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $callbackUrl = $frontendUrl . '/auth/google/callback';
            
            // Encode data as query parameters
            $queryParams = http_build_query([
                'success' => 'true',
                'token' => $token,
                'user' => json_encode($userData),
            ]);

            // Redirect to frontend callback
            return redirect($callbackUrl . '?' . $queryParams);

        } catch (\Exception $e) {
            // Redirect to frontend with error
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $errorUrl = $frontendUrl . '/?error=google_auth_failed&message=' . urlencode($e->getMessage());
            return redirect($errorUrl);
        }
    }

    /**
     * Link Google account to existing user
     */
    public function linkGoogleAccount(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $user = Auth::user();

            // Check if Google account is already linked to another user
            $existingUser = User::where('google_id', $googleUser->id)
                ->where('id', '!=', $user->id)
                ->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'This Google account is already linked to another user',
                ], 400);
            }

            // Link Google account
            $user->update([
                'google_id' => $googleUser->id,
                'avatar' => $googleUser->avatar,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Google account linked successfully',
                'user' => $user,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to link Google account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unlink Google account from user
     */
    public function unlinkGoogleAccount(Request $request)
    {
        try {
            $user = Auth::user();

            // Check if user has a password (so they can still log in)
            if (!$user->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot unlink Google account. Please set a password first.',
                ], 400);
            }

            $user->update([
                'google_id' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Google account unlinked successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unlink Google account',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
