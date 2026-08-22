<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalRequest;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /* ================================================================== */
    /*  ADMIN PAYMENT TRACKER                                             */
    /* ================================================================== */

    /**
     * List all payments for admin (system-wide)
     */
    public function index(Request $request): JsonResponse
    {
        $query = RentalRequest::with(['renter:id,name,email', 'equipment:id,name', 'equipment.owner:id,name', 'paymentVerifier:id,name'])
            ->whereNull('archived_at')
            ->where('status', 'approved'); // Only show approved rentals

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('renter', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('equipment', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        $query->orderBy('created_at', 'desc');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Get payment statistics for admin
     */
    public function stats(): JsonResponse
    {
        $totalRevenue = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified')
            ->sum('total_cost');

        $pendingAmount = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'paid')
            ->sum('total_cost');

        $verifiedThisMonth = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified')
            ->whereMonth('payment_verified_at', now()->month)
            ->whereYear('payment_verified_at', now()->year)
            ->sum('total_cost');

        $overdueAmount = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'overdue')
            ->sum('total_cost');

        $totalCount = RentalRequest::where('status', 'approved')->count();
        $pendingCount = RentalRequest::where('status', 'approved')->where('payment_status', 'pending')->count();
        $paidCount = RentalRequest::where('status', 'approved')->where('payment_status', 'paid')->count();
        $verifiedCount = RentalRequest::where('status', 'approved')->where('payment_status', 'verified')->count();
        $overdueCount = RentalRequest::where('status', 'approved')->where('payment_status', 'overdue')->count();

        return response()->json([
            'total_revenue' => (float) $totalRevenue,
            'pending_amount' => (float) $pendingAmount,
            'verified_this_month' => (float) $verifiedThisMonth,
            'overdue_amount' => (float) $overdueAmount,
            'total_count' => $totalCount,
            'pending_count' => $pendingCount,
            'paid_count' => $paidCount,
            'verified_count' => $verifiedCount,
            'overdue_count' => $overdueCount,
        ]);
    }

    /**
     * Verify payment (admin only)
     */
    public function verifyPayment(Request $request, int $id): JsonResponse
    {
        $rental = RentalRequest::findOrFail($id);

        if ($rental->payment_status !== 'paid') {
            return response()->json([
                'message' => 'Only payments with status "paid" can be verified.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $rental->update([
            'payment_status' => 'verified',
            'payment_verified_at' => now(),
            'payment_verified_by' => $request->user()->id,
            'payment_notes' => $validated['payment_notes'] ?? null,
        ]);

        // Log audit
        AuditService::log(
            'verify_payment',
            RentalRequest::class,
            $rental->id,
            null,
            ['payment_status' => 'verified'],
            "Verified payment for rental #{$rental->id}"
        );

        return response()->json([
            'message' => 'Payment verified successfully.',
            'rental' => $rental->load(['renter', 'equipment', 'paymentVerifier']),
        ]);
    }

    /**
     * Update payment status (admin only)
     */
    public function updatePaymentStatus(Request $request, int $id): JsonResponse
    {
        $rental = RentalRequest::findOrFail($id);

        $validated = $request->validate([
            'payment_status' => ['required', 'in:pending,paid,verified,overdue,refunded'],
            'payment_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldStatus = $rental->payment_status;

        $rental->update($validated);

        // Log audit
        AuditService::logStatusChange(
            $rental,
            $oldStatus,
            $validated['payment_status'],
            "Payment status changed from {$oldStatus} to {$validated['payment_status']}"
        );

        return response()->json([
            'message' => 'Payment status updated successfully.',
            'rental' => $rental->fresh(),
        ]);
    }

    /* ================================================================== */
    /*  OWNER EARNINGS                                                    */
    /* ================================================================== */

    /**
     * List payments for owner's equipment
     */
    public function ownerPayments(Request $request): JsonResponse
    {
        $query = RentalRequest::with(['renter:id,name,email', 'equipment:id,name'])
            ->whereNull('archived_at')
            ->where('status', 'approved')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $request->user()->id));

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by equipment
        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->equipment_id);
        }

        $query->orderBy('created_at', 'desc');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Get earnings statistics for owner
     */
    public function ownerStats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $totalEarned = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->sum('total_cost');

        $pendingEarnings = RentalRequest::where('status', 'approved')
            ->whereIn('payment_status', ['pending', 'paid'])
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->sum('total_cost');

        $thisMonthEarnings = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified')
            ->whereMonth('payment_verified_at', now()->month)
            ->whereYear('payment_verified_at', now()->year)
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->sum('total_cost');

        // Earnings by equipment
        $earningsByEquipment = RentalRequest::select('equipment_id', DB::raw('SUM(total_cost) as total'))
            ->where('status', 'approved')
            ->where('payment_status', 'verified')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->groupBy('equipment_id')
            ->with('equipment:id,name')
            ->get();

        // Monthly earnings (last 6 months)
        $monthlyEarnings = RentalRequest::select(
                DB::raw('DATE_FORMAT(payment_verified_at, "%Y-%m") as month'),
                DB::raw('SUM(total_cost) as total')
            )
            ->where('status', 'approved')
            ->where('payment_status', 'verified')
            ->where('payment_verified_at', '>=', now()->subMonths(6))
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'total_earned' => (float) $totalEarned,
            'pending_earnings' => (float) $pendingEarnings,
            'this_month_earnings' => (float) $thisMonthEarnings,
            'earnings_by_equipment' => $earningsByEquipment,
            'monthly_earnings' => $monthlyEarnings,
        ]);
    }

    /* ================================================================== */
    /*  RENTER PAYMENTS                                                   */
    /* ================================================================== */

    /**
     * List renter's payment history
     */
    public function renterPayments(Request $request): JsonResponse
    {
        $query = RentalRequest::with(['equipment:id,name', 'equipment.owner:id,name'])
            ->whereNull('archived_at')
            ->where('renter_id', $request->user()->id)
            ->where('status', 'approved');

        $query->orderBy('created_at', 'desc');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Upload payment proof (renter only)
     */
    public function uploadPaymentProof(Request $request, int $id): JsonResponse
    {
        $rental = RentalRequest::findOrFail($id);

        // Verify ownership
        if ($rental->renter_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($rental->status !== 'approved') {
            return response()->json([
                'message' => 'Can only upload payment proof for approved rentals.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_proof' => ['required', 'image', 'max:5120'], // 5MB max
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
        ]);

        $data = [];

        if ($request->hasFile('payment_proof')) {
            $data['payment_proof'] = $request->file('payment_proof')->store('payment_proofs', 'public');
        }

        $data['payment_status'] = 'paid';
        $data['paid_at'] = now();
        $data['amount_paid'] = $validated['amount_paid'] ?? $rental->total_cost;

        $rental->update($data);

        // Log audit
        AuditService::log(
            'upload_payment_proof',
            RentalRequest::class,
            $rental->id,
            null,
            ['payment_status' => 'paid'],
            "Uploaded payment proof for rental #{$rental->id}"
        );

        return response()->json([
            'message' => 'Payment proof uploaded successfully. Awaiting admin verification.',
            'rental' => $rental->fresh(),
        ]);
    }
}
