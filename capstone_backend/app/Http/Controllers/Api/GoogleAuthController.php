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
    public function redirectToGoogle(Request $request)
    {
        try {
            // Get role and mode from request
            $role = $request->input('role', 'renter');
            $mode = $request->input('mode', 'login');
            
            // Generate a unique key for this OAuth attempt
            $oauthKey = 'google_oauth_' . uniqid() . '_' . time();
            
            // Store role and mode in cache for 10 minutes
            \Cache::put($oauthKey, [
                'role' => $role,
                'mode' => $mode,
            ], now()->addMinutes(10));
            
            // Pass the key as part of the state parameter
            $url = Socialite::driver('google')
                ->stateless()
                ->with(['state' => $oauthKey])
                ->redirect()
                ->getTargetUrl();

            return response()->json([
                'url' => $url
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
              ->header('Pragma', 'no-cache')
              ->header('Expires', '0');
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
            // Get the oauth key from state parameter
            $oauthKey = $request->input('state');
            
            // Retrieve role and mode from cache
            $data = \Cache::get($oauthKey, ['mode' => 'login', 'role' => 'renter']);
            $mode = $data['mode'];
            $role = $data['role'];
            
            // Clear the cache entry
            \Cache::forget($oauthKey);
            
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
                // User doesn't exist - check if registration is allowed
                if ($mode === 'login') {
                    // Login mode - do NOT create new account
                    $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
                    $errorUrl = $frontendUrl . '/?error=account_not_found&message=' . urlencode('No account found with this Google email. Please register first.');
                    return redirect($errorUrl);
                }
                
                // Register mode - create new user
                // Create new user with Google info
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'role' => $role, // Use role from state parameter
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
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
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
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
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
