<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RoutingService
{
    /**
     * Get driving route between two coordinates using OSRM.
     * Returns route path and distance in kilometers.
     * Falls back to straight-line distance if routing fails.
     */
    public static function getRoute(float $startLat, float $startLng, float $endLat, float $endLng): array
    {
        try {
            // OSRM API endpoint - free and open source
            $url = "https://router.project-osrm.org/route/v1/driving/{$startLng},{$startLat};{$endLng},{$endLat}";
            
            $response = Http::timeout(10)->get($url, [
                'overview' => 'full',
                'geometries' => 'geojson',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['code']) && $data['code'] === 'Ok' && isset($data['routes'][0])) {
                    $route = $data['routes'][0];
                    $coordinates = $route['geometry']['coordinates'];
                    $distanceMeters = $route['distance'];
                    $distanceKm = $distanceMeters / 1000;
                    
                    // Convert [lng, lat] to [lat, lng] for frontend
                    $path = array_map(function($coord) {
                        return [$coord[1], $coord[0]]; // [lat, lng]
                    }, $coordinates);
                    
                    return [
                        'success' => true,
                        'path' => $path,
                        'distance' => round($distanceKm, 2),
                        'type' => 'road',
                    ];
                }
            }
            
            // If API fails, fall back to straight-line distance
            Log::warning('OSRM routing failed, using straight-line distance', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Routing service error: ' . $e->getMessage());
        }
        
        // Fallback: Calculate straight-line distance
        $distance = TransportationFeeCalculator::calculateDistance($startLat, $startLng, $endLat, $endLng);
        
        return [
            'success' => false,
            'path' => [[$startLat, $startLng], [$endLat, $endLng]],
            'distance' => round($distance, 2),
            'type' => 'straight',
        ];
    }
}
