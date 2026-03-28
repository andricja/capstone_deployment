<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRentalRequestRequest;
use App\Models\Equipment;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalRequestController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  RENTER – create and view own requests                              */
    /* ------------------------------------------------------------------ */

    /**
     * Calculate transportation fee for a potential rental.
     * Used for preview before submitting the rental request.
     * Calculates actual distance in kilometers using coordinates.
     */
    public function calculateTransportationFee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id' => ['required', 'exists:equipment,id'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $equipment = Equipment::findOrFail($validated['equipment_id']);

        // Check if equipment has coordinates
        if (!$equipment->latitude || !$equipment->longitude) {
            return response()->json([
                'message' => 'Equipment location coordinates are not available.',
                'equipment_location' => [
                    'name' => $equipment->location,
                    'latitude' => null,
                    'longitude' => null,
                ],
            ], 422);
        }

        $breakdown = \App\Services\TransportationFeeCalculator::getBreakdown(
            $equipment->latitude,
            $equipment->longitude,
            $validated['latitude'],
            $validated['longitude']
        );

        return response()->json([
            'equipment_location' => [
                'name' => $equipment->location,
                'municipality' => $equipment->municipality,
                'barangay' => $equipment->barangay,
                'latitude' => $equipment->latitude,
                'longitude' => $equipment->longitude,
            ],
            'delivery_location' => [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ],
            'fee_breakdown' => $breakdown,
        ]);
    }

    /**
     * List rental requests for the authenticated renter.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $query = $request->user()
            ->rentalRequests()
            ->with('equipment:id,name,category,image,price_per_sqm,coverage_rate,transportation_fee,location,status', 'equipment.owner:id,name,email')
            ->whereNull('archived_at')
            ->latest();

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Create a new rental request.
     * Renter inputs farm size (sqm) → system auto-calculates hours, days, costs.
     */
    public function store(StoreRentalRequestRequest $request): JsonResponse
    {
        $user = $request->user();

        $equipment = Equipment::findOrFail($request->input('equipment_id'));

        // Equipment must be available
        if (! $equipment->isAvailable()) {
            return response()->json([
                'message' => 'This equipment is not currently available for rental.',
            ], 422);
        }

        $farmSizeSqm = (float) $request->input('farm_size_sqm');

        // ── Use equipment's coverage rate (set by owner) ──
        // Owner sets their own coverage rate based on equipment capability
        $coverageRate = $equipment->coverage_rate; // sqm per hour
        
        $estimatedHours = ceil(($farmSizeSqm / $coverageRate) * 10) / 10; // round up to 1 decimal
        $estimatedHours = max($estimatedHours, 1); // minimum 1 hour
        $rentalDays = (int) ceil($estimatedHours / 8); // 8 working hours per day
        $rentalDays = max($rentalDays, 1); // minimum 1 day

        // ── Calculate location-based transportation fee ──
        // Uses equipment owner's transportation fee settings
        $deliveryLat = $request->input('latitude');
        $deliveryLng = $request->input('longitude');
        
        // Calculate distance
        $distance = \App\Services\TransportationFeeCalculator::calculateDistance(
            $equipment->latitude,
            $equipment->longitude,
            $deliveryLat,
            $deliveryLng
        );
        
        // Calculate fee using equipment owner's settings
        $freeDistanceKm = $equipment->free_distance_km ?? 5.00;
        $baseFee = $equipment->base_transportation_fee ?? 100.00;
        $perKmRate = $equipment->transportation_fee_per_km ?? 15.00;
        
        if ($distance <= $freeDistanceKm) {
            $deliveryFee = 0;
        } else {
            $billableDistance = $distance - $freeDistanceKm;
            $deliveryFee = $baseFee + ($billableDistance * $perKmRate);
        }
        
        $deliveryFee = round($deliveryFee, 2);

        // Get fee breakdown for response
        $feeBreakdown = [
            'distance_km' => round($distance, 2),
            'free_distance_km' => $freeDistanceKm,
            'billable_distance_km' => max(0, round($distance - $freeDistanceKm, 2)),
            'base_fee' => $baseFee,
            'per_km_rate' => $perKmRate,
            'total_delivery_fee' => $deliveryFee,
            'is_free' => $deliveryFee == 0,
        ];

        // ── Cost breakdown (based on price per sqm) ──
        $baseCost       = $equipment->price_per_sqm * $farmSizeSqm;
        $serviceCharge  = round($baseCost * 0.05, 2); // 5% service charge
        $totalCost      = $baseCost + $deliveryFee + $serviceCharge;

        // Auto-calculate end date from start date + rental days
        $startDate = \Carbon\Carbon::parse($request->input('start_date'));
        $endDate   = $startDate->copy()->addDays($rentalDays);

        // ── Build full delivery address from structured fields ──
        $sitioStreet = $request->input('sitio_street');
        $barangay = $request->input('barangay');
        $municipality = $request->input('municipality');
        $province = $request->input('province', 'Oriental Mindoro');
        
        $fullAddress = trim("{$sitioStreet}, Barangay {$barangay}, {$municipality}, {$province}");

        $rentalRequest = RentalRequest::create([
            'renter_id'        => $user->id,
            'equipment_id'     => $equipment->id,
            'contact_number'   => $request->input('contact_number'),
            'farm_size_sqm'    => $farmSizeSqm,
            'estimated_hours'  => $estimatedHours,
            'rental_days'      => $rentalDays,
            'start_date'       => $startDate,
            'end_date'         => $endDate,
            'delivery_address' => $fullAddress,
            'sitio_street'     => $sitioStreet,
            'barangay'         => $barangay,
            'municipality'     => $municipality,
            'province'         => $province,
            'latitude'         => $deliveryLat,
            'longitude'        => $deliveryLng,
            'base_cost'        => $baseCost,
            'delivery_fee'     => $deliveryFee,
            'service_charge'   => $serviceCharge,
            'total_cost'       => $totalCost,
            'status'           => 'forwarded',
            'payment_method'   => $request->input('payment_method'),
            'payment_proof'    => $request->hasFile('payment_proof')
                                    ? $request->file('payment_proof')->store('payment_proofs', 'public')
                                    : null,
        ]);

        // Make equipment unavailable when rental request is created
        $equipment->status = 'rented';
        $equipment->save();

        $rentalRequest->load('equipment:id,name,category,price_per_sqm,coverage_rate,location,latitude,longitude');

        return response()->json([
            'message'        => 'Rental request submitted and forwarded to the equipment owner.',
            'rental_request' => $rentalRequest,
            'cost_breakdown' => [
                'farm_size_sqm'    => $farmSizeSqm,
                'coverage_rate'    => $equipment->coverage_rate,
                'estimated_hours'  => $estimatedHours,
                'rental_days'      => $rentalDays,
                'price_per_sqm'    => $equipment->price_per_sqm,
                'base_cost'        => $baseCost,
                'delivery_fee'     => $deliveryFee,
                'service_charge'   => $serviceCharge,
                'total_cost'       => $totalCost,
                'transportation_details' => $feeBreakdown,
            ],
        ], 201);
    }

    /* ------------------------------------------------------------------ */
    /*  OWNER – view and manage incoming rental requests                   */
    /* ------------------------------------------------------------------ */

    /**
     * List rental requests for equipment owned by the authenticated owner.
     */
    public function ownerRequests(Request $request): JsonResponse
    {
        $equipmentIds = $request->user()->equipment()->pluck('id');

        $query = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,price_per_sqm,coverage_rate,transportation_fee,location',
            ])
            ->whereIn('equipment_id', $equipmentIds)
            ->whereNull('archived_at')
            ->latest();

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Owner approves a rental request.
     * - Sets equipment status to "rented".
     * - Sets rental status to "approved".
     */
    public function approve(Request $request, RentalRequest $rentalRequest): JsonResponse
    {
        // Ensure owned by this owner
        $equipment = $rentalRequest->equipment;
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($rentalRequest->status !== 'forwarded') {
            return response()->json(['message' => 'Only forwarded requests can be approved.'], 422);
        }

        // Execute atomically
        DB::transaction(function () use ($equipment, $rentalRequest) {
            // Equipment is already "rented" from when request was created
            // Just confirm the rental request status
            $rentalRequest->update(['status' => 'approved']);
        });

        return response()->json([
            'message'        => 'Rental request approved. Equipment remains unavailable until rental period.',
            'rental_request' => $rentalRequest->fresh()->load('renter:id,name,email', 'equipment:id,name,status'),
        ]);
    }

    /**
     * Owner rejects a rental request (equipment stays available).
     */
    public function reject(Request $request, RentalRequest $rentalRequest): JsonResponse
    {
        $equipment = $rentalRequest->equipment;
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($rentalRequest->status !== 'forwarded') {
            return response()->json(['message' => 'Only forwarded requests can be rejected.'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        // Execute atomically
        DB::transaction(function () use ($equipment, $rentalRequest, $validated) {
            // 1) Set equipment back to "available" when rejected
            $equipment->update(['status' => 'available']);

            // 2) Set rental request to "rejected"
            $rentalRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'] ?? 'Rejected by owner.',
            ]);
        });

        return response()->json([
            'message'        => 'Rental request rejected. Equipment is now available again.',
            'rental_request' => $rentalRequest->fresh(),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  ADMIN – view all rental requests                                   */
    /* ------------------------------------------------------------------ */

    /**
     * List all rental requests (admin overview).
     */
    public function index(Request $request): JsonResponse
    {
        $query = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,location,owner_id',
                'equipment.owner:id,name,email',
            ])
            ->whereNull('archived_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->boolean('all')) {
            return response()->json($query->latest()->get());
        }

        $requests = $query->latest()->paginate(15);

        return response()->json($requests);
    }
}
