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
     */
    public function adminDashboard(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $query = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified');

        if ($request->filled('start_date')) {
            $query->whereDate('payment_verified_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('payment_verified_at', '<=', $request->end_date);
        }

        // Key Metrics
        $totalRevenue = (float) $query->sum('total_cost');
        $totalBookings = $query->count();
        $avgTransactionValue = $totalBookings > 0 ? $totalRevenue / $totalBookings : 0;
        $activeEquipment = Equipment::where('status', 'available')->count();

        // Previous period for comparison
        $previousPeriodQuery = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified');
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $daysDiff = now()->parse($request->end_date)->diffInDays(now()->parse($request->start_date));
            $previousStart = now()->parse($request->start_date)->subDays($daysDiff);
            $previousEnd = now()->parse($request->start_date);
            $previousPeriodQuery->whereBetween('payment_verified_at', [$previousStart, $previousEnd]);
        } else {
            $previousPeriodQuery->whereMonth('payment_verified_at', now()->subMonth()->month)
                ->whereYear('payment_verified_at', now()->subMonth()->year);
        }

        $previousRevenue = (float) $previousPeriodQuery->sum('total_cost');
        $revenueGrowth = $previousRevenue > 0 ? (($totalRevenue - $previousRevenue) / $previousRevenue) * 100 : 0;

        // Top Equipment by Revenue
        $topEquipment = Equipment::select('equipment.*')
            ->withCount(['rentalRequests' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'verified');
            }])
            ->withSum(['rentalRequests as total_revenue' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'verified');
            }], 'total_cost')
            ->with('owner:id,name')
            ->having('total_revenue', '>', 0)
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        // Revenue by Owner
        $revenueByOwner = User::where('role', 'owner')
            ->select('users.id', 'users.name')
            ->withSum(['equipment as total_revenue' => function ($q) {
                $q->join('rental_requests', 'equipment.id', '=', 'rental_requests.equipment_id')
                    ->where('rental_requests.status', 'approved')
                    ->where('rental_requests.payment_status', 'verified');
            }], 'rental_requests.total_cost')
            ->having('total_revenue', '>', 0)
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        return response()->json([
            'metrics' => [
                'total_revenue' => $totalRevenue,
                'total_bookings' => $totalBookings,
                'avg_transaction_value' => round($avgTransactionValue, 2),
                'active_equipment' => $activeEquipment,
                'revenue_growth' => round($revenueGrowth, 2),
            ],
            'top_equipment' => $topEquipment,
            'revenue_by_owner' => $revenueByOwner,
        ]);
    }

    /**
     * Revenue trends over time
     */
    public function revenueOverTime(Request $request): JsonResponse
    {
        $request->validate([
            'period' => ['required', 'in:daily,weekly,monthly,yearly'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer'], // For owner-specific trends
        ]);

        $period = $request->period;
        $query = RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified');

        // Filter by owner if specified (for owner dashboard)
        if ($request->filled('owner_id')) {
            $query->whereHas('equipment', fn ($q) => $q->where('owner_id', $request->owner_id));
        }

        // Date range
        if ($request->filled('start_date')) {
            $query->whereDate('payment_verified_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('payment_verified_at', '<=', $request->end_date);
        }

        // Group by period
        $dateFormat = match ($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%u',
            'monthly' => '%Y-%m',
            'yearly' => '%Y',
        };

        $trends = $query->select(
                DB::raw("DATE_FORMAT(payment_verified_at, '{$dateFormat}') as period"),
                DB::raw('SUM(total_cost) as revenue'),
                DB::raw('COUNT(*) as bookings')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($trends);
    }

    /**
     * Owner sales dashboard
     */
    public function ownerDashboard(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Key Metrics
        $totalEarnings = (float) RentalRequest::where('status', 'approved')
            ->where('payment_status', 'verified')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->sum('total_cost');

        $totalBookings = RentalRequest::where('status', 'approved')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
            ->count();

        $avgBookingValue = $totalBookings > 0 ? $totalEarnings / $totalBookings : 0;

        // Equipment Performance
        $equipmentPerformance = Equipment::where('owner_id', $userId)
            ->select('equipment.*')
            ->withCount(['rentalRequests' => function ($q) {
                $q->where('status', 'approved');
            }])
            ->withSum(['rentalRequests as total_revenue' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'verified');
            }], 'total_cost')
            ->orderByDesc('total_revenue')
            ->get();

        // Best performing equipment
        $bestEquipment = $equipmentPerformance->first();

        // Monthly earnings (last 6 months)
        $monthlyEarnings = RentalRequest::select(
                DB::raw('DATE_FORMAT(payment_verified_at, "%Y-%m") as month'),
                DB::raw('SUM(total_cost) as revenue'),
                DB::raw('COUNT(*) as bookings')
            )
            ->where('status', 'approved')
            ->where('payment_status', 'verified')
            ->where('payment_verified_at', '>=', now()->subMonths(6))
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId))
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
     * Top performing equipment
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
                $q->where('status', 'approved');
            }])
            ->withSum(['rentalRequests as total_revenue' => function ($q) {
                $q->where('status', 'approved')->where('payment_status', 'verified');
            }], 'total_cost')
            ->with('owner:id,name')
            ->having('rental_requests_count', '>', 0);

        if ($sortBy === 'revenue') {
            $query->orderByDesc('total_revenue');
        } else {
            $query->orderByDesc('rental_requests_count');
        }

        $topEquipment = $query->limit($limit)->get();

        return response()->json($topEquipment);
    }
}

