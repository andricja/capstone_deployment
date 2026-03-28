<?php

namespace App\Http\Controllers\Api;

use App\Data\OrientalMindoroAddresses;
use App\Data\OrientalMindoroCoordinates;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * Get all municipalities in Oriental Mindoro.
     */
    public function getMunicipalities(): JsonResponse
    {
        return response()->json([
            'municipalities' => OrientalMindoroAddresses::getMunicipalityNames(),
        ]);
    }

    /**
     * Get barangays for a specific municipality.
     */
    public function getBarangays(Request $request, string $municipality): JsonResponse
    {
        if (! OrientalMindoroAddresses::isValidMunicipality($municipality)) {
            return response()->json([
                'message' => 'Invalid municipality.',
            ], 404);
        }

        return response()->json([
            'municipality' => $municipality,
            'barangays' => OrientalMindoroAddresses::getBarangays($municipality),
        ]);
    }

    /**
     * Get complete address data (all municipalities with barangays).
     */
    public function getCompleteAddressData(): JsonResponse
    {
        return response()->json([
            'province' => 'Oriental Mindoro',
            'municipalities' => OrientalMindoroAddresses::getMunicipalities(),
        ]);
    }

    /**
     * Get coordinates for a municipality
     */
    public function getCoordinates(string $municipality): JsonResponse
    {
        $coordinates = OrientalMindoroCoordinates::getMunicipalityCoordinates($municipality);
        
        if (!$coordinates) {
            return response()->json([
                'message' => 'Municipality not found',
            ], 404);
        }

        return response()->json($coordinates);
    }

    /**
     * Get coordinates for a specific barangay
     */
    public function getBarangayCoordinates(string $municipality, string $barangay): JsonResponse
    {
        $coordinates = OrientalMindoroCoordinates::getBarangayCoordinates($municipality, $barangay);
        
        if (!$coordinates) {
            return response()->json([
                'message' => 'Coordinates not found',
            ], 404);
        }

        return response()->json($coordinates);
    }

    /**
     * Get all municipality coordinates
     */
    public function getAllCoordinates(): JsonResponse
    {
        return response()->json([
            'coordinates' => OrientalMindoroCoordinates::getAllCoordinates(),
        ]);
    }

    /**
     * Get driving route between two coordinates.
     * Uses OSRM routing service with fallback to straight-line distance.
     */
    public function getRoute(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_lat' => ['required', 'numeric', 'between:-90,90'],
            'start_lng' => ['required', 'numeric', 'between:-180,180'],
            'end_lat' => ['required', 'numeric', 'between:-90,90'],
            'end_lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $route = \App\Services\RoutingService::getRoute(
            $validated['start_lat'],
            $validated['start_lng'],
            $validated['end_lat'],
            $validated['end_lng']
        );

        return response()->json($route);
    }
}
