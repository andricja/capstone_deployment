<?php

namespace App\Data;

class OrientalMindoroCoordinates
{
    /**
     * Get approximate coordinates for a municipality in Oriental Mindoro
     * These are central coordinates for each municipality
     */
    public static function getMunicipalityCoordinates(string $municipality): ?array
    {
        $coordinates = [
            'Baco' => ['latitude' => 13.3667, 'longitude' => 121.1000],
            'Bansud' => ['latitude' => 12.8333, 'longitude' => 121.4167],
            'Bongabong' => ['latitude' => 12.7167, 'longitude' => 121.3833],
            'Bulalacao' => ['latitude' => 12.3333, 'longitude' => 121.3500],
            'Calapan' => ['latitude' => 13.4119, 'longitude' => 121.1803],
            'Gloria' => ['latitude' => 12.9833, 'longitude' => 121.4667],
            'Mansalay' => ['latitude' => 12.5167, 'longitude' => 121.4500],
            'Naujan' => ['latitude' => 13.3167, 'longitude' => 121.3000],
            'Pinamalayan' => ['latitude' => 13.0333, 'longitude' => 121.4833],
            'Pola' => ['latitude' => 13.1500, 'longitude' => 121.4333],
            'Puerto Galera' => ['latitude' => 13.5000, 'longitude' => 120.9500],
            'Roxas' => ['latitude' => 12.6167, 'longitude' => 121.5167],
            'San Teodoro' => ['latitude' => 13.4500, 'longitude' => 121.0167],
            'Socorro' => ['latitude' => 13.0667, 'longitude' => 121.4167],
            'Victoria' => ['latitude' => 13.1833, 'longitude' => 121.3333],
        ];

        return $coordinates[$municipality] ?? null;
    }

    /**
     * Get barangay coordinates for a specific municipality and barangay
     * Returns municipality center if barangay coordinates not found
     */
    public static function getBarangayCoordinates(string $municipality, string $barangay): ?array
    {
        $barangayCoordinates = [
            // Add accurate coordinates here as you collect them
            // Format: 'Municipality' => ['Barangay' => ['latitude' => X.XXXX, 'longitude' => Y.YYYY]]
        ];

        // Check if we have coordinates for this specific barangay
        if (isset($barangayCoordinates[$municipality][$barangay])) {
            return $barangayCoordinates[$municipality][$barangay];
        }

        // Fall back to municipality center if barangay not found
        return self::getMunicipalityCoordinates($municipality);
    }

    /**
     * Get all municipality coordinates
     */
    public static function getAllCoordinates(): array
    {
        return [
            'Baco' => ['latitude' => 13.3667, 'longitude' => 121.1000],
            'Bansud' => ['latitude' => 12.8333, 'longitude' => 121.4167],
            'Bongabong' => ['latitude' => 12.7167, 'longitude' => 121.3833],
            'Bulalacao' => ['latitude' => 12.3333, 'longitude' => 121.3500],
            'Calapan' => ['latitude' => 13.4119, 'longitude' => 121.1803],
            'Gloria' => ['latitude' => 12.9833, 'longitude' => 121.4667],
            'Mansalay' => ['latitude' => 12.5167, 'longitude' => 121.4500],
            'Naujan' => ['latitude' => 13.3167, 'longitude' => 121.3000],
            'Pinamalayan' => ['latitude' => 13.0333, 'longitude' => 121.4833],
            'Pola' => ['latitude' => 13.1500, 'longitude' => 121.4333],
            'Puerto Galera' => ['latitude' => 13.5000, 'longitude' => 120.9500],
            'Roxas' => ['latitude' => 12.6167, 'longitude' => 121.5167],
            'San Teodoro' => ['latitude' => 13.4500, 'longitude' => 121.0167],
            'Socorro' => ['latitude' => 13.0667, 'longitude' => 121.4167],
            'Victoria' => ['latitude' => 13.1833, 'longitude' => 121.3333],
        ];
    }
}
