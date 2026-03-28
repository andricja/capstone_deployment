<?php

namespace App\Services;

class TransportationFeeCalculator
{
    /**
     * Base fee for transportation (minimum charge)
     */
    private const BASE_FEE = 100.00;

    /**
     * Cost per kilometer
     */
    private const COST_PER_KM = 15.00;

    /**
     * Free delivery radius in kilometers
     */
    private const FREE_DELIVERY_RADIUS = 5.0;

    /**
     * Calculate transportation fee based on distance between two coordinates.
     *
     * @param float $fromLat Equipment latitude
     * @param float $fromLng Equipment longitude
     * @param float $toLat Delivery latitude
     * @param float $toLng Delivery longitude
     * @return float Transportation fee in PHP
     */
    public static function calculate(
        ?float $fromLat,
        ?float $fromLng,
        ?float $toLat,
        ?float $toLng
    ): float {
        // If coordinates are missing, return base fee
        if (! $fromLat || ! $fromLng || ! $toLat || ! $toLng) {
            return self::BASE_FEE;
        }

        // Calculate distance in kilometers
        $distance = self::calculateDistance($fromLat, $fromLng, $toLat, $toLng);

        // Free delivery within radius
        if ($distance <= self::FREE_DELIVERY_RADIUS) {
            return 0.00;
        }

        // Calculate fee: base fee + (distance - free radius) * cost per km
        $chargeableDistance = $distance - self::FREE_DELIVERY_RADIUS;
        $fee = self::BASE_FEE + ($chargeableDistance * self::COST_PER_KM);

        return round($fee, 2);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     *
     * @param float $lat1 Latitude of point 1
     * @param float $lng1 Longitude of point 1
     * @param float $lat2 Latitude of point 2
     * @param float $lng2 Longitude of point 2
     * @return float Distance in kilometers
     */
    public static function calculateDistance(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2
    ): float {
        // Earth's radius in kilometers
        $earthRadius = 6371;

        // Convert degrees to radians
        $lat1Rad = deg2rad($lat1);
        $lng1Rad = deg2rad($lng1);
        $lat2Rad = deg2rad($lat2);
        $lng2Rad = deg2rad($lng2);

        // Haversine formula
        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLng = $lng2Rad - $lng1Rad;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLng / 2) * sin($deltaLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        $distance = $earthRadius * $c;

        return round($distance, 2);
    }

    /**
     * Get fee breakdown for display purposes.
     *
     * @param float $fromLat Equipment latitude
     * @param float $fromLng Equipment longitude
     * @param float $toLat Delivery latitude
     * @param float $toLng Delivery longitude
     * @return array Fee breakdown details
     */
    public static function getBreakdown(
        ?float $fromLat,
        ?float $fromLng,
        ?float $toLat,
        ?float $toLng
    ): array {
        if (! $fromLat || ! $fromLng || ! $toLat || ! $toLng) {
            return [
                'distance_km' => 0,
                'base_fee' => self::BASE_FEE,
                'distance_fee' => 0,
                'total_fee' => self::BASE_FEE,
                'free_delivery' => false,
                'note' => 'Coordinates not available. Base fee applied.',
            ];
        }

        $distance = self::calculateDistance($fromLat, $fromLng, $toLat, $toLng);

        if ($distance <= self::FREE_DELIVERY_RADIUS) {
            return [
                'distance_km' => $distance,
                'base_fee' => 0,
                'distance_fee' => 0,
                'total_fee' => 0,
                'free_delivery' => true,
                'note' => "Free delivery within {$distance} km radius.",
            ];
        }

        $chargeableDistance = $distance - self::FREE_DELIVERY_RADIUS;
        $distanceFee = $chargeableDistance * self::COST_PER_KM;
        $totalFee = self::BASE_FEE + $distanceFee;

        return [
            'distance_km' => $distance,
            'free_radius_km' => self::FREE_DELIVERY_RADIUS,
            'chargeable_distance_km' => round($chargeableDistance, 2),
            'base_fee' => self::BASE_FEE,
            'cost_per_km' => self::COST_PER_KM,
            'distance_fee' => round($distanceFee, 2),
            'total_fee' => round($totalFee, 2),
            'free_delivery' => false,
            'note' => "Base fee + ₱{$distanceFee} for {$chargeableDistance} km",
        ];
    }
}
