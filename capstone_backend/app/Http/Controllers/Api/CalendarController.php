<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * Get calendar events for admin (all rentals)
     */
    public function adminEvents(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'equipment_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
        ]);

        $query = RentalRequest::with(['renter:id,name,email', 'equipment:id,name,owner_id', 'equipment.owner:id,name'])
            ->whereNull('archived_at');

        // Filter by date range
        if ($request->filled('start')) {
            $query->where('end_date', '>=', $request->start);
        }
        if ($request->filled('end')) {
            $query->where('start_date', '<=', $request->end);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by equipment
        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->equipment_id);
        }

        // Filter by owner
        if ($request->filled('owner_id')) {
            $query->whereHas('equipment', fn ($q) => $q->where('owner_id', $request->owner_id));
        }

        $rentals = $query->get();

        $events = $rentals->map(function ($rental) {
            return $this->formatEvent($rental);
        });

        return response()->json($events);
    }

    /**
     * Get calendar events for owner (their equipment only)
     */
    public function ownerEvents(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'equipment_id' => ['nullable', 'integer'],
        ]);

        $userId = $request->user()->id;

        $query = RentalRequest::with(['renter:id,name,email', 'equipment:id,name'])
            ->whereNull('archived_at')
            ->whereHas('equipment', fn ($q) => $q->where('owner_id', $userId));

        // Filter by date range
        if ($request->filled('start')) {
            $query->where('end_date', '>=', $request->start);
        }
        if ($request->filled('end')) {
            $query->where('start_date', '<=', $request->end);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by specific equipment
        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->equipment_id);
        }

        $rentals = $query->get();

        $events = $rentals->map(function ($rental) {
            return $this->formatEvent($rental);
        });

        return response()->json($events);
    }

    /**
     * Get calendar events for renter (their own rentals)
     */
    public function renterEvents(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
        ]);

        $userId = $request->user()->id;

        $query = RentalRequest::with(['equipment:id,name', 'equipment.owner:id,name'])
            ->whereNull('archived_at')
            ->where('renter_id', $userId);

        // Filter by date range
        if ($request->filled('start')) {
            $query->where('end_date', '>=', $request->start);
        }
        if ($request->filled('end')) {
            $query->where('start_date', '<=', $request->end);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $rentals = $query->get();

        $events = $rentals->map(function ($rental) {
            return $this->formatEvent($rental);
        });

        return response()->json($events);
    }

    /**
     * Format rental as calendar event
     */
    private function formatEvent(RentalRequest $rental): array
    {
        // Determine visual status (active vs approved)
        $displayStatus = $this->determineDisplayStatus($rental);
        $statusColor = $this->getStatusColor($displayStatus);

        return [
            'id' => $rental->id,
            'title' => $rental->equipment->name . ($rental->renter ? ' - ' . $rental->renter->name : ''),
            'start' => $rental->start_date->format('Y-m-d'),
            'end' => $rental->end_date->addDay()->format('Y-m-d'), // Add 1 day for full-day events
            'status' => $rental->status,
            'display_status' => $displayStatus,
            'payment_status' => $rental->payment_status,
            'backgroundColor' => $statusColor,
            'borderColor' => $statusColor,
            'rental' => [
                'id' => $rental->id,
                'equipment_name' => $rental->equipment->name,
                'renter_name' => $rental->renter->name ?? 'Unknown',
                'renter_email' => $rental->renter->email ?? null,
                'owner_name' => $rental->equipment->owner->name ?? null,
                'start_date' => $rental->start_date->format('Y-m-d'),
                'end_date' => $rental->end_date->format('Y-m-d'),
                'rental_days' => $rental->rental_days,
                'farm_size_sqm' => $rental->farm_size_sqm,
                'total_cost' => $rental->total_cost,
                'status' => $rental->status,
                'payment_status' => $rental->payment_status,
                'payment_method' => $rental->payment_method,
                'delivery_address' => $rental->delivery_address,
                'municipality' => $rental->municipality,
                'barangay' => $rental->barangay,
            ],
        ];
    }

    /**
     * Determine the display status (active vs approved)
     */
    private function determineDisplayStatus(RentalRequest $rental): string
    {
        $now = now();
        $start = $rental->start_date;
        $end = $rental->end_date;

        // If approved, check if it's currently active or completed
        if ($rental->status === 'approved') {
            if ($now->between($start, $end)) {
                return 'active'; // Currently ongoing
            } elseif ($now->greaterThan($end)) {
                return 'completed'; // Past rental
            }
            return 'approved'; // Future booking
        }

        // Return actual status for pending, rejected, cancelled
        return $rental->status;
    }

    /**
     * Get color based on status
     */
    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'pending' => '#F59E0B',     // Yellow/Orange
            'approved' => '#3B82F6',    // Blue
            'active' => '#10B981',      // Green
            'completed' => '#6B7280',   // Gray
            'rejected' => '#EF4444',    // Red
            'cancelled' => '#9CA3AF',   // Light Gray
            default => '#6B7280',       // Default Gray
        };
    }
}

