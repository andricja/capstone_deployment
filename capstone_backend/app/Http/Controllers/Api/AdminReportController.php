<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminReportController extends Controller
{
    /**
     * Revenue reports – list approved equipment with approval fees.
     *
     * Supported filters via query params:
     *   ?filter=day|week|month|year
     *   ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD  (custom range)
     */
    public function revenue(Request $request): JsonResponse
    {
        $query = Equipment::with('owner:id,name,email')
            ->whereNotNull('approved_at')
            ->whereNotNull('approval_fee');

        $this->applyDateFilter($query, $request, 'approved_at');

        if ($request->boolean('all')) {
            $transactions = $query->latest('approved_at')->get();
        } else {
            $transactions = $query->latest('approved_at')->paginate(15);
        }

        // Summary stats
        $statsQuery = Equipment::whereNotNull('approved_at')->whereNotNull('approval_fee');
        $this->applyDateFilter($statsQuery, $request, 'approved_at');

        $totalRevenue   = $statsQuery->sum('approval_fee');
        $totalApprovals = $statsQuery->count();
        $avgFee         = $totalApprovals > 0 ? $totalRevenue / $totalApprovals : 0;

        return response()->json([
            'transactions' => $transactions,
            'summary' => [
                'total_approvals' => $totalApprovals,
                'total_revenue'   => number_format((float) $totalRevenue, 2, '.', ''),
                'average_fee'     => number_format((float) $avgFee, 2, '.', ''),
            ],
        ]);
    }

    /**
     * Export revenue report as CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $query = Equipment::with('owner:id,name,email')
            ->whereNotNull('approved_at')
            ->whereNotNull('approval_fee');

        $this->applyDateFilter($query, $request, 'approved_at');

        $transactions = $query->latest('approved_at')->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="revenue_report.csv"',
        ];

        return response()->stream(function () use ($transactions) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Receipt No.',
                'Approved Date',
                'Owner Name',
                'Owner Email',
                'Equipment',
                'Category',
                'Location',
                'Daily Rate (₱)',
                'Approval Fee (₱)',
            ]);

            foreach ($transactions as $eq) {
                fputcsv($handle, [
                    'RCP-' . str_pad($eq->id, 5, '0', STR_PAD_LEFT),
                    $eq->approved_at?->toDateString(),
                    $eq->owner->name ?? 'N/A',
                    $eq->owner->email ?? 'N/A',
                    $eq->name,
                    $eq->category,
                    $eq->location,
                    $eq->daily_rate,
                    $eq->approval_fee,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /* ------------------------------------------------------------------ */
    /*  Private helpers                                                     */
    /* ------------------------------------------------------------------ */

    private function applyDateFilter($query, Request $request, string $column = 'created_at'): void
    {
        $filter = $request->input('filter');

        if ($filter) {
            $now = now();
            match ($filter) {
                'day'   => $query->whereDate($column, $now->toDateString()),
                'week'  => $query->whereBetween($column, [$now->startOfWeek(), $now->copy()->endOfWeek()]),
                'month' => $query->whereMonth($column, $now->month)->whereYear($column, $now->year),
                'year'  => $query->whereYear($column, $now->year),
                default => null,
            };
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween($column, [
                $request->input('start_date') . ' 00:00:00',
                $request->input('end_date') . ' 23:59:59',
            ]);
        }
    }
}
