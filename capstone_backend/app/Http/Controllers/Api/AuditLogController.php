<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Get all audit logs (paginated, with filters)
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search in description
        if ($request->has('search') && $request->search) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        return $query->paginate(50);
    }

    /**
     * Get session logs (login/logout events)
     */
    public function sessions(Request $request)
    {
        $query = AuditLog::with('user:id,name,email,role')
            ->whereIn('action', ['login', 'logout'])
            ->orderBy('created_at', 'desc');

        // Filter by date
        if ($request->has('date') && $request->date) {
            $query->whereDate('created_at', $request->date);
        }

        return $query->paginate(50);
    }

    /**
     * Get audit statistics
     */
    public function stats()
    {
        $actionsBreakdown = AuditLog::selectRaw('action, count(*) as count')
            ->groupBy('action')
            ->get()
            ->map(function ($item) {
                return [
                    'action' => $item->action,
                    'count' => $item->count
                ];
            });

        return response()->json([
            'total_logs' => AuditLog::count(),
            'today_logs' => AuditLog::whereDate('created_at', today())->count(),
            'active_sessions' => AuditLog::where('action', 'login')
                ->whereDate('created_at', today())
                ->distinct('user_id')
                ->count('user_id'),
            'actions_breakdown' => $actionsBreakdown,
        ]);
    }
}
