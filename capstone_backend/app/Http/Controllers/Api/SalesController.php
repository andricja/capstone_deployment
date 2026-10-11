<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    /**
     * Admin sales dashboard - System-wide analytics
     * Tracks ADMIN REVENUE ONLY (approval fees + service charges)
     */
    public function adminDashboard(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        // ── Admin Revenue from Service Charges (per rental) ──
        $serviceChargeQuery = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'paid');

        if ($request->filled('start_date')) {
            $serviceChargeQuery->whereDate('paid_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $serviceChargeQuery->whereDate('paid_at', '<=', $request->end_date);
        }

        $totalServiceCharges = (float) $serviceChargeQuery->sum('service_charge');
        $totalBookings = $serviceChargeQuery->count();

        // ── Admin Revenue from Equipment Approval Fees (one-time) ──
        $approvalFeeQuery = Equipment::whereNotNull('approved_at')
            ->whereNotNull('approval_fee');

        if ($request->filled('start_date')) {
            $approvalFeeQuery->whereDate('approved_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $approvalFeeQuery->whereDate('approved_at', '<=', $request->end_date);
        }

        $totalApprovalFees = (float) $approvalFeeQuery->sum('approval_fee');
        $totalApprovals = $approvalFeeQuery->count();

        // ── Total Admin Revenue ──
        $totalRevenue = $totalServiceCharges + $totalApprovalFees;
        $avgTransactionValue = $totalBookings > 0 ? $totalServiceCharges / $totalBookings : 0;
        $activeEquipment = Equipment::where('status', 'available')->count();

        // ── Previous Period Comparison ──
        $previousServiceQuery = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'paid');
        $previousApprovalQuery = Equipment::whereNotNull('approved_at')
            ->whereNotNull('approval_fee');
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $daysDiff = now()->parse($request->end_date)->diffInDays(now()->parse($request->start_date));
            $previousStart = now()->parse($request->start_date)->subDays($daysDiff);
            $previousEnd = now()->parse($request->start_date);
            $previousServiceQuery->whereBetween('paid_at', [$previousStart, $previousEnd]);
            $previousApprovalQuery->whereBetween('approved_at', [$previousStart, $previousEnd]);
        } else {
            $previousServiceQuery->whereMonth('paid_at', now()->subMonth()->month)
                ->whereYear('paid_at', now()->subMonth()->year);
            $previousApprovalQuery->whereMonth('approved_at', now()->subMonth()->month)
                ->whereYear('approved_at', now()->subMonth()->year);
        }

        $previousServiceRevenue = (float) $previousServiceQuery->sum('service_charge');
        $previousApprovalRevenue = (float) $previousApprovalQuery->sum('approval_fee');
        $previousRevenue = $previousServiceRevenue + $previousApprovalRevenue;
        $revenueGrowth = $previousRevenue > 0 ? (($totalRevenue - $previousRevenue) / $previousRevenue) * 100 : 0;

        // ── Top Equipment by Service Charges (admin commission) ──
        $topEquipment = Equipment::select('equipment.*')
            ->withCount(['rentalRequests' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'paid');
            }])
            ->withSum(['rentalRequests as admin_revenue' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'paid');
            }], 'service_charge')
            ->with('owner:id,name')
            ->having('admin_revenue', '>', 0)
            ->orderByDesc('admin_revenue')
            ->limit(10)
            ->get();

        // ── Revenue by Owner (equipment approval fees) ──
        $revenueByOwner = User::where('role', 'owner')
            ->select('users.id', 'users.name')
            ->withSum(['equipment as total_approval_fees' => function ($q) {
                $q->whereNotNull('approved_at')->whereNotNull('approval_fee');
            }], 'approval_fee')
            ->withSum(['equipment as total_service_charges' => function ($q) {
                $q->join('rental_requests', 'equipment.id', '=', 'rental_requests.equipment_id')
                    ->where('rental_requests.status', 'approved')
                    ->where('rental_requests.payment_status', 'paid');
            }], 'rental_requests.service_charge')
            ->orderByDesc('total_approval_fees')
            ->having('total_approval_fees', '>', 0)
            ->limit(10)
            ->get()
            ->map(function ($owner) {
                $owner->total_admin_revenue = ($owner->total_approval_fees ?? 0) + ($owner->total_service_charges ?? 0);
                return $owner;
            })
            ->sortByDesc('total_admin_revenue')
            ->values();

        return response()->json([
            'metrics' => [
                'total_revenue' => $totalRevenue,
                'service_charge_revenue' => $totalServiceCharges,
                'approval_fee_revenue' => $totalApprovalFees,
                'total_bookings' => $totalBookings,
                'total_approvals' => $totalApprovals,
                'avg_service_charge' => round($avgTransactionValue, 2),
                'active_equipment' => $activeEquipment,
                'revenue_growth' => round($revenueGrowth, 2),
            ],
            'top_equipment' => $topEquipment,
            'revenue_by_owner' => $revenueByOwner,
        ]);
    }

    /**
     * Revenue trends over time
     * Tracks admin revenue (service charges + approval fees)
     */
    public function revenueOverTime(Request $request): JsonResponse
    {
        $request->validate([
            'period' => ['required', 'in:daily,weekly,monthly,yearly'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $period = $request->period;

        // ── Service Charges Query ──
        $serviceQuery = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'paid');

        // Date range
        if ($request->filled('start_date')) {
            $serviceQuery->whereDate('paid_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $serviceQuery->whereDate('paid_at', '<=', $request->end_date);
        }

        // Group by period
        $dateFormat = match ($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%u',
            'monthly' => '%Y-%m',
            'yearly' => '%Y',
        };

        $serviceTrends = $serviceQuery->select(
                DB::raw("DATE_FORMAT(paid_at, '{$dateFormat}') as period"),
                DB::raw('SUM(service_charge) as service_revenue'),
                DB::raw('COUNT(*) as bookings')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->keyBy('period');

        // ── Approval Fees Query ──
        $approvalQuery = Equipment::whereNotNull('approved_at')
            ->whereNotNull('approval_fee');

        if ($request->filled('start_date')) {
            $approvalQuery->whereDate('approved_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $approvalQuery->whereDate('approved_at', '<=', $request->end_date);
        }

        $approvalTrends = $approvalQuery->select(
                DB::raw("DATE_FORMAT(approved_at, '{$dateFormat}') as period"),
                DB::raw('SUM(approval_fee) as approval_revenue'),
                DB::raw('COUNT(*) as approvals')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->keyBy('period');

        // ── Merge both revenue streams ──
        $allPeriods = $serviceTrends->keys()->merge($approvalTrends->keys())->unique()->sort();
        
        $trends = $allPeriods->map(function ($period) use ($serviceTrends, $approvalTrends) {
            $serviceData = $serviceTrends->get($period);
            $approvalData = $approvalTrends->get($period);

            return [
                'period' => $period,
                'service_revenue' => (float) ($serviceData->service_revenue ?? 0),
                'approval_revenue' => (float) ($approvalData->approval_revenue ?? 0),
                'total_revenue' => (float) (($serviceData->service_revenue ?? 0) + ($approvalData->approval_revenue ?? 0)),
                'bookings' => (int) ($serviceData->bookings ?? 0),
                'approvals' => (int) ($approvalData->approvals ?? 0),
            ];
        })->values();

        return response()->json($trends);
    }

    /**
     * Owner sales dashboard
     * Shows what renters actually paid (paid_amount)
     * Supports date filtering
     */
    public function ownerDashboard(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        // Base query for paid rentals
        $paidQuery = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'paid')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId));

        // Apply date filters if provided
        if ($request->filled('start_date')) {
            $paidQuery->whereDate('paid_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $paidQuery->whereDate('paid_at', '<=', $request->end_date);
        }

        // Key Metrics - Based on actual payments received (paid_amount)
        $totalEarnings = (float) (clone $paidQuery)->sum('paid_amount');

        $totalBookings = RentalRequest::where('status', 'approved')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->count();

        $avgBookingValue = $totalBookings > 0 ? $totalEarnings / $totalBookings : 0;

        // Equipment Performance - Based on actual payments
        $equipmentQuery = Equipment::where('owner_id', $userId)
            ->select('equipment.*')
            ->withCount(['rentalRequests' => function ($q) {
                $q->where('status', 'approved');
            }])
            ->withSum(['rentalRequests as total_revenue' => function ($q) use ($request) {
                $q->where('status', 'approved')->where('payment_status', 'paid');
                if ($request->filled('start_date')) {
                    $q->whereDate('paid_at', '>=', $request->start_date);
                }
                if ($request->filled('end_date')) {
                    $q->whereDate('paid_at', '<=', $request->end_date);
                }
            }], 'paid_amount')
            ->orderByDesc('total_revenue');

        $equipmentPerformance = $equipmentQuery->get();

        // Best performing equipment
        $bestEquipment = $equipmentPerformance->first();

        // Monthly earnings - Based on actual payments with date filter
        $monthlyQuery = RentalRequest::select(
                DB::raw('DATE_FORMAT(paid_at, "%Y-%m") as month'),
                DB::raw('SUM(paid_amount) as revenue'),
                DB::raw('COUNT(*) as bookings')
            )
            ->where('status', 'approved')
            ->where('payment_status', 'paid')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId));

        // Default to last 6 months if no date filter
        if (!$request->filled('start_date')) {
            $monthlyQuery->where('paid_at', '>=', now()->subMonths(6));
        } else {
            $monthlyQuery->whereDate('paid_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $monthlyQuery->whereDate('paid_at', '<=', $request->end_date);
        }

        $monthlyEarnings = $monthlyQuery
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'metrics' => [
                'total_earnings' => $totalEarnings,
                'total_bookings' => $totalBookings,
                'avg_booking_value' => round($avgBookingValue, 2),
                'best_equipment' => $bestEquipment ? [
                    'name' => $bestEquipment->name,
                    'revenue' => $bestEquipment->total_revenue,
                    'bookings' => $bestEquipment->rental_requests_count,
                ] : null,
            ],
            'equipment_performance' => $equipmentPerformance,
            'monthly_earnings' => $monthlyEarnings,
        ]);
    }

    /**
     * Top performing equipment by admin commission (service charges)
     */
    public function topEquipment(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'sort_by' => ['nullable', 'in:revenue,bookings'],
        ]);

        $limit = $request->input('limit', 10);
        $sortBy = $request->input('sort_by', 'revenue');

        $query = Equipment::select('equipment.*')
            ->withCount(['rentalRequests' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'paid');
            }])
            ->withSum(['rentalRequests as admin_commission' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'paid');
            }], 'service_charge')
            ->with('owner:id,name')
            ->having('rental_requests_count', '>', 0);

        if ($sortBy === 'revenue') {
            $query->orderByDesc('admin_commission');
        } else {
            $query->orderByDesc('rental_requests_count');
        }

        $topEquipment = $query->limit($limit)->get();

        return response()->json($topEquipment);
    }
}

