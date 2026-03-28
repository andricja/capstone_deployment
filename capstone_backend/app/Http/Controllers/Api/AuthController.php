<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Helpers\DynamicMailer;
use App\Mail\EmailVerificationCode;
use App\Models\Equipment;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new user (renter or owner).
     * Sends a 6-digit email verification code instead of auto-login.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role'     => ['required', 'in:renter,owner'],
        ]);

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'name'                    => $validated['name'],
            'email'                   => $validated['email'],
            'password'                => $validated['password'],
            'role'                    => $validated['role'],
            'account_status'          => 'pending',
            'email_verification_code' => $code,
            'email_code_expires_at'   => now()->addMinutes(15),
        ]);

        // Send verification email
        try {
            DynamicMailer::send(
                new EmailVerificationCode($user->name, $code),
                $user->email
            );
        } catch (\Throwable $e) {
            // If mail fails, still return success but note the issue
            return response()->json([
                'message'      => 'Registration successful but verification email could not be sent. Please contact admin.',
                'requires_verification' => true,
                'email'        => $user->email,
            ], 201);
        }

        return response()->json([
            'message'      => 'Registration successful! A verification code has been sent to your email.',
            'requires_verification' => true,
            'email'        => $user->email,
        ], 201);
    }

    /**
     * Verify the email with the 6-digit code.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $validated['email'])
            ->where('account_status', 'pending')
            ->first();

        if (! $user) {
            return response()->json(['message' => 'User not found or already verified.'], 404);
        }

        if ($user->email_verification_code !== $validated['code']) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        if ($user->email_code_expires_at && $user->email_code_expires_at->isPast()) {
            return response()->json(['message' => 'Verification code has expired. Please register again.'], 422);
        }

        // Renters are auto-approved; owners need admin approval
        $newStatus = $user->role === 'renter' ? 'approved' : 'email_verified';

        $user->update([
            'account_status'          => $newStatus,
            'email_verified_at'       => now(),
            'email_verification_code' => null,
            'email_code_expires_at'   => null,
        ]);

        if ($newStatus === 'approved') {
            return response()->json([
                'message'       => 'Email verified! Your account is ready — you can now log in.',
                'auto_approved' => true,
            ]);
        }

        return response()->json([
            'message'       => 'Email verified! Your account is now pending admin approval.',
            'auto_approved' => false,
        ]);
    }

    /**
     * Resend the verification code.
     */
    public function resendVerificationCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])
            ->where('account_status', 'pending')
            ->first();

        if (! $user) {
            return response()->json(['message' => 'User not found or already verified.'], 404);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'email_verification_code' => $code,
            'email_code_expires_at'   => now()->addMinutes(15),
        ]);

        try {
            DynamicMailer::send(
                new EmailVerificationCode($user->name, $code),
                $user->email
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to send verification email. Please try again.'], 500);
        }

        return response()->json(['message' => 'A new verification code has been sent to your email.']);
    }

    /**
     * Authenticate user and return token.
     * Only approved accounts (or admin) can log in.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // Allow admin to always login
        if ($user->role !== 'admin') {
            if ($user->account_status === 'pending') {
                Auth::guard('web')->logout();
                return response()->json([
                    'message'      => 'Please verify your email first.',
                    'requires_verification' => true,
                    'email'        => $user->email,
                ], 403);
            }

            if ($user->account_status === 'email_verified') {
                Auth::guard('web')->logout();
                return response()->json([
                    'message' => 'Your account is pending admin approval. You will receive an email once approved.',
                    'pending_approval' => true,
                ], 403);
            }

            if ($user->account_status === 'rejected') {
                Auth::guard('web')->logout();
                return response()->json([
                    'message' => 'Your account has been rejected. Please contact the administrator.',
                ], 403);
            }

            if ($user->account_status !== 'approved') {
                Auth::guard('web')->logout();
                return response()->json(['message' => 'Account not active.'], 403);
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    /**
     * Revoke current access token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Return the authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Toggle archive status on an owner (admin only).
     */
    public function archiveOwner(int $id): JsonResponse
    {
        $owner = User::where('role', 'owner')->findOrFail($id);
        $owner->archived_at = $owner->archived_at ? null : now();
        $owner->save();

        return response()->json([
            'message'     => $owner->archived_at ? 'Owner archived.' : 'Owner unarchived.',
            'archived_at' => $owner->archived_at,
        ]);
    }

    /**
     * List all users with the owner role (admin only).
     */
    public function owners(Request $request): JsonResponse
    {
        $owners = User::where('role', 'owner')
            ->whereNull('archived_at')
            ->withCount(['equipment', 'equipment as approved_equipment_count' => function ($q) {
                $q->where('status', '!=', 'rejected');
            }])
            ->orderBy('created_at', 'desc');

        if ($request->boolean('all')) {
            return response()->json($owners->get());
        }

        return response()->json($owners->paginate(15));
    }

    /**
     * Show a single owner with their equipment list.
     */
    public function ownerShow(int $id): JsonResponse
    {
        $owner = User::where('role', 'owner')
            ->withCount(['equipment', 'equipment as approved_equipment_count' => function ($q) {
                $q->where('status', '!=', 'rejected');
            }])
            ->findOrFail($id);

        $equipment = $owner->equipment()
            ->orderByDesc('created_at')
            ->get();

        $totalRentals = \App\Models\RentalRequest::whereIn('equipment_id', $owner->equipment()->pluck('id'))->count();
        $activeRentals = \App\Models\RentalRequest::whereIn('equipment_id', $owner->equipment()->pluck('id'))->where('status', 'approved')->count();
        $totalRevenue = \App\Models\RentalRequest::whereIn('equipment_id', $owner->equipment()->pluck('id'))->where('status', 'approved')->sum('total_cost');

        return response()->json([
            'owner' => $owner,
            'equipment' => $equipment,
            'total_rentals' => $totalRentals,
            'active_rentals' => $activeRentals,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }

    /**
     * Summary statistics for the admin owners page.
     */
    public function ownerStats(): JsonResponse
    {
        $totalOwners  = User::where('role', 'owner')->whereNull('archived_at')->count();
        $totalRenters = User::where('role', 'renter')->count();
        $totalEquipment = Equipment::whereNull('archived_at')->count();
        $activeRentals  = RentalRequest::where('status', 'approved')->whereNull('archived_at')->count();
        $newOwnersThisMonth = User::where('role', 'owner')
            ->whereNull('archived_at')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        return response()->json([
            'total_owners'          => $totalOwners,
            'total_renters'         => $totalRenters,
            'total_equipment'       => $totalEquipment,
            'active_rentals'        => $activeRentals,
            'new_owners_this_month' => $newOwnersThisMonth,
        ]);
    }

    /**
     * Chart-friendly data for the admin owners page.
     * Accepts ?period=daily|weekly|monthly|yearly (default: yearly).
     */
    public function ownerChartData(Request $request): JsonResponse
    {
        $period = $request->query('period', 'yearly');

        // Determine the date boundary
        $from = match ($period) {
            'daily'   => now()->startOfDay(),
            'weekly'  => now()->subDays(6)->startOfDay(),
            'monthly' => now()->subDays(29)->startOfDay(),
            default   => now()->subMonths(11)->startOfMonth(), // yearly
        };

        // Equipment by category (within period)
        $equipmentByCategory = Equipment::where('created_at', '>=', $from)
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        // Equipment status distribution (within period)
        $equipmentByStatus = Equipment::where('created_at', '>=', $from)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Owner registrations over time – grouping adapts to the period
        $ownersQuery = User::where('role', 'owner')->where('created_at', '>=', $from);

        $ownersTrend = match ($period) {
            'daily' => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%H:00') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
            'weekly' => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%m-%d') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
            'monthly' => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%m-%d') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
            default => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
        };

        // Top 5 owners by equipment count (equipment created within period)
        $topOwners = User::where('role', 'owner')
            ->withCount(['equipment' => fn ($q) => $q->where('created_at', '>=', $from)])
            ->orderByDesc('equipment_count')
            ->get()
            ->filter(fn ($u) => $u->equipment_count > 0)
            ->take(5)
            ->values()
            ->map(fn ($u) => ['name' => $u->name, 'equipment_count' => $u->equipment_count]);

        return response()->json([
            'equipment_by_category' => $equipmentByCategory,
            'equipment_by_status'   => $equipmentByStatus,
            'owners_trend'          => $ownersTrend,
            'top_owners'            => $topOwners,
            'period'                => $period,
        ]);
    }

    /* ================================================================== */
    /*  ACCOUNT SETTINGS (any authenticated user)                          */
    /* ================================================================== */

    /**
     * Update authenticated user's profile (name & email).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $user->only('id', 'name', 'email', 'role'),
        ]);
    }

    /**
     * Update authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
                'errors'  => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
