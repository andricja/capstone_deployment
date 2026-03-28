<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\MessageRequest;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Return role-specific dashboard data for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return match ($user->role) {
            'renter' => $this->renterDashboard($user, $request),
            'owner'  => $this->ownerDashboard($user, $request),
            'admin'  => $this->adminDashboard($request),
            default  => response()->json(['message' => 'Unknown role.'], 403),
        };
    }

    private function renterDashboard($user, Request $request): JsonResponse
    {
        $period = $request->input('period', 'yearly');

        // ── Determine date range & SQL grouping based on period ──
        switch ($period) {
            case 'today':
                $from        = now()->startOfDay();
                $groupFormat = '%H:00';
                break;
            case 'weekly':
                $from        = now()->subDays(6)->startOfDay();
                $groupFormat = '%Y-%m-%d';
                break;
            case 'monthly':
                $from        = now()->startOfMonth();
                $groupFormat = '%Y-%m-%d';
                break;
            default:
                $from        = now()->subMonths(11)->startOfMonth();
                $groupFormat = '%Y-%m';
                break;
        }

        // ── Build time-slot scaffolding ──
        $slots = [];
        switch ($period) {
            case 'today':
                for ($h = 0; $h < 24; $h++) {
                    $key         = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
                    $slots[$key] = ['label' => now()->startOfDay()->addHours($h)->format('g A'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
            case 'weekly':
                for ($i = 6; $i >= 0; $i--) {
                    $d = now()->subDays($i);
                    $slots[$d->format('Y-m-d')] = ['label' => $d->format('D, M j'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
            case 'monthly':
                $d   = now()->startOfMonth();
                $end = now();
                while ($d->lte($end)) {
                    $slots[$d->format('Y-m-d')] = ['label' => $d->format('M j'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                    $d = $d->addDay();
                }
                break;
            default:
                for ($i = 11; $i >= 0; $i--) {
                    $slots[now()->subMonths($i)->format('Y-m')] = ['label' => now()->subMonths($i)->format('M Y'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
        }

        // ── Rental requests grouped by period ──
        $rentalsByPeriod = $user->rentalRequests()
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, status, COUNT(*) as count")
            ->groupBy('period_key', 'status')
            ->orderBy('period_key')
            ->get();

        foreach ($rentalsByPeriod as $row) {
            if (isset($slots[$row->period_key])) {
                $slots[$row->period_key][$row->status] = $row->count;
            }
        }

        // ── Spending grouped by period ──
        $spendingByPeriod = $user->rentalRequests()
            ->where('status', 'approved')
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, SUM(total_cost) as spending")
            ->groupBy('period_key')
            ->orderBy('period_key')
            ->get()
            ->keyBy('period_key');

        $rentalChart   = [];
        $spendingChart = [];
        foreach ($slots as $key => $slot) {
            $rentalChart[]   = ['month' => $slot['label'], 'forwarded' => $slot['forwarded'], 'approved' => $slot['approved'], 'rejected' => $slot['rejected']];
            $spendingChart[] = ['month' => $slot['label'], 'spending' => (float) ($spendingByPeriod[$key]->spending ?? 0)];
        }

        // ── Top rented equipment (by this renter, top 5) ──
        $topEquipment = $user->rentalRequests()
            ->where('rental_requests.status', 'approved')
            ->where('rental_requests.created_at', '>=', $from)
            ->join('equipment', 'rental_requests.equipment_id', '=', 'equipment.id')
            ->selectRaw('equipment.name, SUM(rental_requests.total_cost) as spending, COUNT(*) as rentals')
            ->groupBy('equipment.name')
            ->orderByDesc('spending')
            ->take(5)
            ->get();

        // ── Category distribution of renter's approved rentals ──
        $categoryDistribution = $user->rentalRequests()
            ->where('rental_requests.status', 'approved')
            ->join('equipment', 'rental_requests.equipment_id', '=', 'equipment.id')
            ->selectRaw('equipment.category, COUNT(*) as count')
            ->groupBy('equipment.category')
            ->get();

        // ── Payment method distribution ──
        $paymentMethods = $user->rentalRequests()
            ->where('created_at', '>=', $from)
            ->selectRaw('payment_method, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'role'   => 'renter',
            'period' => $period,
            'rental_requests' => [
                'total'     => $user->rentalRequests()->count(),
                'forwarded' => $user->rentalRequests()->where('status', 'forwarded')->count(),
                'approved'  => $user->rentalRequests()->where('status', 'approved')->count(),
                'rejected'  => $user->rentalRequests()->where('status', 'rejected')->count(),
            ],
            'total_spending' => $user->rentalRequests()->where('status', 'approved')->sum('total_cost'),
            'charts' => [
                'rental_requests'       => $rentalChart,
                'spending'              => $spendingChart,
                'top_equipment'         => $topEquipment,
                'category_distribution' => $categoryDistribution,
                'payment_methods'       => $paymentMethods,
            ],
            'recent_rentals' => $user->rentalRequests()
                ->with('equipment:id,name,category,image,status')
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }

    private function ownerDashboard($user, Request $request): JsonResponse
    {
        $period       = $request->input('period', 'yearly');
        $equipmentIds = $user->equipment()->pluck('id');

        // ── Determine date range & SQL grouping based on period ──
        switch ($period) {
            case 'today':
                $from        = now()->startOfDay();
                $groupFormat = '%H:00';
                break;
            case 'weekly':
                $from        = now()->subDays(6)->startOfDay();
                $groupFormat = '%Y-%m-%d';
                break;
            case 'monthly':
                $from        = now()->startOfMonth();
                $groupFormat = '%Y-%m-%d';
                break;
            default: // yearly
                $from        = now()->subMonths(11)->startOfMonth();
                $groupFormat = '%Y-%m';
                break;
        }

        // ── Build time-slot scaffolding ──
        $slots = [];
        switch ($period) {
            case 'today':
                for ($h = 0; $h < 24; $h++) {
                    $key         = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
                    $slots[$key] = ['label' => now()->startOfDay()->addHours($h)->format('g A'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
            case 'weekly':
                for ($i = 6; $i >= 0; $i--) {
                    $d = now()->subDays($i);
                    $slots[$d->format('Y-m-d')] = ['label' => $d->format('D, M j'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
            case 'monthly':
                $d = now()->startOfMonth();
                $end = now();
                while ($d->lte($end)) {
                    $slots[$d->format('Y-m-d')] = ['label' => $d->format('M j'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                    $d = $d->addDay();
                }
                break;
            default:
                for ($i = 11; $i >= 0; $i--) {
                    $slots[now()->subMonths($i)->format('Y-m')] = ['label' => now()->subMonths($i)->format('M Y'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
        }

        // ── Rental requests grouped by period ──
        $rentalsByPeriod = RentalRequest::whereIn('equipment_id', $equipmentIds)
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, status, COUNT(*) as count")
            ->groupBy('period_key', 'status')
            ->orderBy('period_key')
            ->get();

        foreach ($rentalsByPeriod as $row) {
            if (isset($slots[$row->period_key])) {
                $slots[$row->period_key][$row->status] = $row->count;
            }
        }

        // ── Revenue grouped by period ──
        $revenueByPeriod = RentalRequest::whereIn('equipment_id', $equipmentIds)
            ->where('status', 'approved')
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, SUM(total_cost) as revenue")
            ->groupBy('period_key')
            ->orderBy('period_key')
            ->get()
            ->keyBy('period_key');

        $rentalChart  = [];
        $revenueChart = [];
        foreach ($slots as $key => $slot) {
            $rentalChart[]  = ['month' => $slot['label'], 'forwarded' => $slot['forwarded'], 'approved' => $slot['approved'], 'rejected' => $slot['rejected']];
            $revenueChart[] = ['month' => $slot['label'], 'revenue' => (float) ($revenueByPeriod[$key]->revenue ?? 0)];
        }

        // ── Revenue by equipment (top 5, filtered by period) ──
        $revenueByEquipment = RentalRequest::whereIn('rental_requests.equipment_id', $equipmentIds)
            ->where('rental_requests.status', 'approved')
            ->where('rental_requests.created_at', '>=', $from)
            ->join('equipment', 'rental_requests.equipment_id', '=', 'equipment.id')
            ->selectRaw('equipment.name, SUM(rental_requests.total_cost) as revenue, COUNT(*) as rentals')
            ->groupBy('equipment.name')
            ->orderByDesc('revenue')
            ->take(5)
            ->get();

        // ── Category distribution (current state, not period-filtered) ──
        $categoryDistribution = $user->equipment()
            ->whereNotIn('status', ['pending', 'rejected'])
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get();

        return response()->json([
            'role'   => 'owner',
            'period' => $period,
            'equipment' => [
                'total'       => $user->equipment()->count(),
                'available'   => $user->equipment()->where('status', 'available')->count(),
                'rented'      => $user->equipment()->where('status', 'rented')->count(),
                'maintenance' => $user->equipment()->where('status', 'maintenance')->count(),
                'pending'     => $user->equipment()->where('status', 'pending')->count(),
            ],
            'rental_requests' => [
                'total'     => RentalRequest::whereIn('equipment_id', $equipmentIds)->count(),
                'forwarded' => RentalRequest::whereIn('equipment_id', $equipmentIds)->where('status', 'forwarded')->count(),
                'approved'  => RentalRequest::whereIn('equipment_id', $equipmentIds)->where('status', 'approved')->count(),
                'rejected'  => RentalRequest::whereIn('equipment_id', $equipmentIds)->where('status', 'rejected')->count(),
            ],
            'charts' => [
                'monthly_rentals'       => $rentalChart,
                'monthly_revenue'       => $revenueChart,
                'revenue_by_equipment'  => $revenueByEquipment,
                'category_distribution' => $categoryDistribution,
            ],
            'recent_requests' => RentalRequest::with('renter:id,name,email', 'equipment:id,name')
                ->whereIn('equipment_id', $equipmentIds)
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }

    private function adminDashboard(Request $request): JsonResponse
    {
        $period = $request->input('period', 'yearly');

        // ── Determine date range & SQL grouping based on period ──
        switch ($period) {
            case 'today':
                $from        = now()->startOfDay();
                $groupFormat = '%H:00';
                break;
            case 'weekly':
                $from        = now()->subDays(6)->startOfDay();
                $groupFormat = '%Y-%m-%d';
                break;
            case 'monthly':
                $from        = now()->startOfMonth();
                $groupFormat = '%Y-%m-%d';
                break;
            default: // yearly
                $from        = now()->subMonths(11)->startOfMonth();
                $groupFormat = '%Y-%m';
                break;
        }

        // ── Build time-slot scaffolding ──
        $slots = [];
        switch ($period) {
            case 'today':
                for ($h = 0; $h < 24; $h++) {
                    $key         = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
                    $slots[$key] = ['label' => now()->startOfDay()->addHours($h)->format('g A'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
            case 'weekly':
                for ($i = 6; $i >= 0; $i--) {
                    $d = now()->subDays($i);
                    $slots[$d->format('Y-m-d')] = ['label' => $d->format('D, M j'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
            case 'monthly':
                $d = now()->startOfMonth();
                $end = now();
                while ($d->lte($end)) {
                    $slots[$d->format('Y-m-d')] = ['label' => $d->format('M j'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                    $d = $d->addDay();
                }
                break;
            default:
                for ($i = 11; $i >= 0; $i--) {
                    $slots[now()->subMonths($i)->format('Y-m')] = ['label' => now()->subMonths($i)->format('M Y'), 'forwarded' => 0, 'approved' => 0, 'rejected' => 0];
                }
                break;
        }

        // ── Rental requests grouped by period (all system) ──
        $rentalsByPeriod = RentalRequest::where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, status, COUNT(*) as count")
            ->groupBy('period_key', 'status')
            ->orderBy('period_key')
            ->get();

        foreach ($rentalsByPeriod as $row) {
            if (isset($slots[$row->period_key])) {
                $slots[$row->period_key][$row->status] = $row->count;
            }
        }

        // ── Revenue grouped by period ──
        $revenueByPeriod = RentalRequest::where('status', 'approved')
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, SUM(total_cost) as revenue")
            ->groupBy('period_key')
            ->orderBy('period_key')
            ->get()
            ->keyBy('period_key');

        $rentalChart  = [];
        $revenueChart = [];
        foreach ($slots as $key => $slot) {
            $rentalChart[]  = ['month' => $slot['label'], 'forwarded' => $slot['forwarded'], 'approved' => $slot['approved'], 'rejected' => $slot['rejected']];
            $revenueChart[] = ['month' => $slot['label'], 'revenue' => (float) ($revenueByPeriod[$key]->revenue ?? 0)];
        }

        // ── User registrations by period ──
        $userSlots = [];
        switch ($period) {
            case 'today':
                for ($h = 0; $h < 24; $h++) {
                    $key            = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
                    $userSlots[$key] = ['label' => now()->startOfDay()->addHours($h)->format('g A'), 'renters' => 0, 'owners' => 0];
                }
                break;
            case 'weekly':
                for ($i = 6; $i >= 0; $i--) {
                    $d = now()->subDays($i);
                    $userSlots[$d->format('Y-m-d')] = ['label' => $d->format('D, M j'), 'renters' => 0, 'owners' => 0];
                }
                break;
            case 'monthly':
                $d = now()->startOfMonth();
                $end = now();
                while ($d->lte($end)) {
                    $userSlots[$d->format('Y-m-d')] = ['label' => $d->format('M j'), 'renters' => 0, 'owners' => 0];
                    $d = $d->addDay();
                }
                break;
            default:
                for ($i = 11; $i >= 0; $i--) {
                    $userSlots[now()->subMonths($i)->format('Y-m')] = ['label' => now()->subMonths($i)->format('M Y'), 'renters' => 0, 'owners' => 0];
                }
                break;
        }

        $usersByPeriod = \App\Models\User::where('role', '!=', 'admin')
            ->where('created_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period_key, role, COUNT(*) as count")
            ->groupBy('period_key', 'role')
            ->orderBy('period_key')
            ->get();

        foreach ($usersByPeriod as $row) {
            if (isset($userSlots[$row->period_key])) {
                $roleKey = $row->role === 'renter' ? 'renters' : 'owners';
                $userSlots[$row->period_key][$roleKey] = $row->count;
            }
        }

        $userChart = [];
        foreach ($userSlots as $slot) {
            $userChart[] = ['month' => $slot['label'], 'renters' => $slot['renters'], 'owners' => $slot['owners']];
        }

        // ── Top equipment by revenue ──
        $topEquipment = RentalRequest::join('equipment', 'rental_requests.equipment_id', '=', 'equipment.id')
            ->where('rental_requests.status', 'approved')
            ->where('rental_requests.created_at', '>=', $from)
            ->selectRaw('equipment.name, SUM(rental_requests.total_cost) as revenue, COUNT(*) as rentals')
            ->groupBy('equipment.name')
            ->orderByDesc('revenue')
            ->take(5)
            ->get();

        // ── Equipment by category (all approved equipment in system) ──
        $categoryDistribution = Equipment::whereNotIn('status', ['pending', 'rejected'])
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get();

        // ── Equipment status distribution (system-wide) ──
        $equipmentStatuses = Equipment::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($r) => [$r->status => $r->count]);

        // ── Payment method distribution ──
        $paymentMethods = RentalRequest::where('created_at', '>=', $from)
            ->selectRaw("payment_method, COUNT(*) as count")
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'role'   => 'admin',
            'period' => $period,
            'pending_equipment_approvals'=> Equipment::where('status', 'pending')->count(),
            'pending_message_requests'   => MessageRequest::where('status', 'pending')->count(),
            'total_renters'  => \App\Models\User::where('role', 'renter')->count(),
            'total_owners'   => \App\Models\User::where('role', 'owner')->count(),
            'total_equipment'=> Equipment::count(),
            'total_rentals'  => RentalRequest::count(),
            'revenue_this_month' => RentalRequest::where('status', 'approved')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total_cost'),
            'rental_requests' => [
                'forwarded' => RentalRequest::where('status', 'forwarded')->count(),
                'approved'  => RentalRequest::where('status', 'approved')->count(),
                'rejected'  => RentalRequest::where('status', 'rejected')->count(),
            ],
            'equipment_statuses' => $equipmentStatuses,
            'charts' => [
                'rental_requests'       => $rentalChart,
                'revenue'               => $revenueChart,
                'users'                 => $userChart,
                'top_equipment'         => $topEquipment,
                'category_distribution' => $categoryDistribution,
                'payment_methods'       => $paymentMethods,
            ],
        ]);
    }
}
