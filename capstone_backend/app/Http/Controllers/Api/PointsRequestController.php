<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePointsRequestRequest;
use App\Models\PointsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PointsRequestController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  RENTER – create and view own points requests                       */
    /* ------------------------------------------------------------------ */

    /**
     * List points requests for the authenticated renter.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $requests = $request->user()
            ->pointsRequests()
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    /**
     * Submit a new points purchase request.
     * Rate: ₱20 per point. Amount is auto-calculated.
     */
    public function store(StorePointsRequestRequest $request): JsonResponse
    {
        $pointsRequested = $request->input('points_requested');
        $amountPaid      = $pointsRequested * 20; // ₱20 per point

        $proofPath = $request->file('payment_proof')->store('payment_proofs', 'public');

        $pointsRequest = PointsRequest::create([
            'renter_id'        => $request->user()->id,
            'amount_paid'      => $amountPaid,
            'points_requested' => $pointsRequested,
            'payment_proof'    => $proofPath,
            'status'           => 'pending',
        ]);

        return response()->json([
            'message'        => 'Points purchase request submitted. Awaiting admin verification.',
            'points_request' => $pointsRequest,
        ], 201);
    }

    /* ------------------------------------------------------------------ */
    /*  ADMIN – manage points requests                                     */
    /* ------------------------------------------------------------------ */

    /**
     * List all points requests (admin view).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PointsRequest::with('renter:id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $requests = $query->latest()->paginate(15);

        return response()->json($requests);
    }

    /**
     * Admin approves a points request → credits points to renter.
     */
    public function approve(PointsRequest $pointsRequest): JsonResponse
    {
        if ($pointsRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        // Credit points to renter
        $renter = $pointsRequest->renter;
        $renter->increment('points', $pointsRequest->points_requested);

        $pointsRequest->update(['status' => 'approved']);

        return response()->json([
            'message'        => "Approved. {$pointsRequest->points_requested} points credited to {$renter->name}.",
            'points_request' => $pointsRequest->fresh()->load('renter:id,name,email,points'),
        ]);
    }

    /**
     * Admin rejects a points request → deletes it so renter can resubmit.
     */
    public function reject(PointsRequest $pointsRequest): JsonResponse
    {
        if ($pointsRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected.'], 422);
        }

        $pointsRequest->update(['status' => 'rejected']);

        return response()->json([
            'message' => 'Points request rejected. The renter may resubmit.',
        ]);
    }
}
