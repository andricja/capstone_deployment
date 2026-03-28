<?php

require __DIR__ . '/vendor/autoload.php';

use App\Data\OrientalMindoroCoordinates;

$coordinates = OrientalMindoroCoordinates::getBarangayCoordinates('Pinamalayan', 'Maningcol');

echo "Coordinates for Maningcol, Pinamalayan:\n";
echo json_encode($coordinates, JSON_PRETTY_PRINT);
echo "\n";
