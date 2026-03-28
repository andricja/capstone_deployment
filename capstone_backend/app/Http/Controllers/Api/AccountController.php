<?php

namespace App\Http\Controllers\Api;

use App\Helpers\DynamicMailer;
use App\Http\Controllers\Controller;
use App\Mail\AccountApproved;
use App\Mail\AccountRejected;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * List all accounts pending admin approval (email_verified status).
     * Optionally filter by ?status=pending|email_verified|approved|rejected|all
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'email_verified');

        $query = User::where('role', '!=', 'admin')
            ->orderByDesc('created_at');

        if ($status && $status !== 'all') {
            $query->where('account_status', $status);
        }

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Get stats for the accounts page.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'pending'        => User::where('role', '!=', 'admin')->where('account_status', 'pending')->count(),
            'email_verified' => User::where('role', '!=', 'admin')->where('account_status', 'email_verified')->count(),
            'approved'       => User::where('role', '!=', 'admin')->where('account_status', 'approved')->count(),
            'rejected'       => User::where('role', '!=', 'admin')->where('account_status', 'rejected')->count(),
        ]);
    }

    /**
     * Approve an account. Sends approval email.
     */
    public function approve(int $id): JsonResponse
    {
        $user = User::where('role', '!=', 'admin')->findOrFail($id);

        if ($user->account_status === 'approved') {
            return response()->json(['message' => 'Account is already approved.'], 422);
        }

        $user->update(['account_status' => 'approved']);

        try {
            DynamicMailer::send(new AccountApproved($user->name), $user->email);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Account approved but email notification could not be sent.',
            ]);
        }

        return response()->json(['message' => 'Account approved. Notification email sent.']);
    }

    /**
     * Reject an account. Sends rejection email with reason.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::where('role', '!=', 'admin')->findOrFail($id);

        $reason = $validated['reason'] ?? 'No reason provided.';

        $user->update([
            'account_status'         => 'rejected',
            'admin_rejection_reason' => $reason,
        ]);

        try {
            DynamicMailer::send(new AccountRejected($user->name, $reason), $user->email);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Account rejected but email notification could not be sent.',
            ]);
        }

        return response()->json(['message' => 'Account rejected. Notification email sent.']);
    }

    /**
     * Delete an account permanently.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::where('role', '!=', 'admin')->findOrFail($id);

        $userName = $user->name;
        $user->delete();

        return response()->json(['message' => "Account '{$userName}' has been deleted successfully."]);
    }
}
