# Distance-Based Transportation Fee System - Complete Implementation

## Overview
The system automatically calculates transportation fees based on the actual distance (in kilometers) between the equipment owner's location and the renter's delivery address using GPS coordinates and the Haversine formula.

## How It Works

### 1. Equipment Owner Sets Location
When adding equipment, the owner must provide:
- **Municipality** (dropdown)
- **Barangay** (dropdown)
- **Latitude** (required) - GPS coordinate
- **Longitude** (required) - GPS coordinate

Example:
```
Equipment Location: Palayan, Calapan
Coordinates: 13.4119, 121.1803
```

### 2. Renter Provides Delivery Address
When requesting rental, the renter provides:
- **Sitio/Street**
- **Barangay** (dropdown)
- **Municipality** (dropdown)
- **Latitude** (required) - GPS coordinate
- **Longitude** (required) - GPS coordinate

Example:
```
Delivery Address: Nabuslot, Calapan
Coordinates: 13.4500, 121.2000
```

### 3. Automatic Distance Calculation
The system uses the **Haversine formula** to calculate the actual distance in kilometers between the two GPS coordinates.

**Formula:**
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c  (where R = 6371 km, Earth's radius)
```

### 4. Fee Calculation
**Pricing Structure:**
- **0-5 km**: FREE (₱0)
- **Beyond 5 km**: ₱100 base fee + ₱15 per kilometer

**Examples:**
- 3 km distance → ₱0 (free delivery)
- 10 km distance → ₱100 + (5 km × ₱15) = ₱175
- 20 km distance → ₱100 + (15 km × ₱15) = ₱325

## Implementation Details

### Backend Components

#### 1. TransportationFeeCalculator Service
**File**: `capstone_backend/app/Services/TransportationFeeCalculator.php`

**Methods:**
```php
// Calculate fee only
TransportationFeeCalculator::calculate($lat1, $lon1, $lat2, $lon2)

// Get detailed breakdown
TransportationFeeCalculator::getBreakdown($lat1, $lon1, $lat2, $lon2)
```

**Breakdown Response:**
```json
{
  "distance_km": 10.5,
  "free_distance_km": 5,
  "billable_distance_km": 5.5,
  "base_fee": 100,
  "per_km_rate": 15,
  "distance_charge": 82.50,
  "total_fee": 182.50
}
```

#### 2. Equipment Validation
**File**: `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php`

**Required Fields:**
```php
'municipality' => ['required', 'string', 'max:255'],
'barangay' => ['required', 'string', 'max:255'],
'latitude' => ['required', 'numeric', 'between:-90,90'],
'longitude' => ['required', 'numeric', 'between:-180,180'],
```

#### 3. Rental Request Validation
**File**: `capstone_backend/app/Http/Requests/StoreRentalRequestRequest.php`

**Required Fields:**
```php
'sitio_street' => ['required', 'string', 'max:255'],
'barangay' => ['required', 'string', 'max:255'],
'municipality' => ['required', 'string', 'max:255'],
'latitude' => ['required', 'numeric', 'between:-90,90'],
'longitude' => ['required', 'numeric', 'between:-180,180'],
```

#### 4. Rental Request Controller
**File**: `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php`

**Fee Calculation in store() method:**
```php
$deliveryFee = \App\Services\TransportationFeeCalculator::calculate(
    $equipment->latitude,
    $equipment->longitude,
    $deliveryLat,
    $deliveryLng
);

$feeBreakdown = \App\Services\TransportationFeeCalculator::getBreakdown(
    $equipment->latitude,
    $equipment->longitude,
    $deliveryLat,
    $deliveryLng
);
```

### Frontend Components

#### Equipment Form
**File**: `frontend_capstone/src/pages/owner/MyEquipment.jsx`

**Coordinates Input:**
```jsx
<input 
  type="number" 
  step="0.0000001"
  required
  value={form.latitude}
  placeholder="e.g. 13.4119" 
/>
<input 
  type="number" 
  step="0.0000001"
  required
  value={form.longitude}
  placeholder="e.g. 121.1803" 
/>
```

#### Rental Request Form
**File**: `frontend_capstone/src/pages/renter/BrowseEquipment.jsx`

Similar coordinate inputs required for delivery address.

## API Endpoints

### Calculate Transportation Fee (Preview)
```
POST /api/renter/rental-requests/calculate-fee
```

**Request:**
```json
{
  "equipment_id": 1,
  "latitude": 13.4500,
  "longitude": 121.2000
}
```

**Response:**
```json
{
  "equipment_location": {
    "name": "Baruyan, Calapan",
    "municipality": "Calapan",
    "barangay": "Baruyan",
    "latitude": 13.4119,
    "longitude": 121.1803
  },
  "delivery_location": {
    "latitude": 13.4500,
    "longitude": 121.2000
  },
  "fee_breakdown": {
    "distance_km": 10.5,
    "free_distance_km": 5,
    "billable_distance_km": 5.5,
    "base_fee": 100,
    "per_km_rate": 15,
    "distance_charge": 82.50,
    "total_fee": 182.50
  }
}
```

### Create Rental Request
```
POST /api/renter/rental-requests
```

The transportation fee is automatically calculated and included in the response:

```json
{
  "message": "Rental request submitted...",
  "rental_request": { ... },
  "cost_breakdown": {
    "farm_size_sqm": 10000,
    "estimated_hours": 5,
    "rental_days": 1,
    "daily_rate": 1500,
    "base_cost": 1500,
    "delivery_fee": 182.50,
    "service_charge": 75,
    "total_cost": 1757.50,
    "transportation_details": {
      "distance_km": 10.5,
      "free_distance_km": 5,
      "billable_distance_km": 5.5,
      "base_fee": 100,
      "per_km_rate": 15,
      "distance_charge": 82.50,
      "total_fee": 182.50
    }
  }
}
```

## Database Schema

### Equipment Table
```sql
CREATE TABLE equipment (
  id BIGINT PRIMARY KEY,
  owner_id BIGINT,
  name VARCHAR(255),
  category ENUM(...),
  daily_rate DECIMAL(10,2),
  transportation_fee DECIMAL(10,2) DEFAULT 0, -- Legacy field, not used
  location VARCHAR(255), -- Auto-generated from municipality + barangay
  municipality VARCHAR(255),
  barangay VARCHAR(255),
  province VARCHAR(255) DEFAULT 'Oriental Mindoro',
  latitude DECIMAL(10,7), -- Required for distance calculation
  longitude DECIMAL(10,7), -- Required for distance calculation
  ...
);
```

### Rental Requests Table
```sql
CREATE TABLE rental_requests (
  id BIGINT PRIMARY KEY,
  renter_id BIGINT,
  equipment_id BIGINT,
  delivery_address VARCHAR(500), -- Auto-generated full address
  sitio_street VARCHAR(255),
  barangay VARCHAR(255),
  municipality VARCHAR(255),
  province VARCHAR(255),
  latitude DECIMAL(10,7), -- Required for distance calculation
  longitude DECIMAL(10,7), -- Required for distance calculation
  delivery_fee DECIMAL(10,2), -- Calculated transportation fee
  base_cost DECIMAL(10,2),
  service_charge DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  ...
);
```

## Getting GPS Coordinates

### Method 1: Google Maps
1. Open Google Maps
2. Right-click on the location
3. Click on the coordinates to copy them
4. Format: `13.4119, 121.1803`

### Method 2: GPS Device/Phone
1. Use GPS app on smartphone
2. Navigate to the location
3. Record the latitude and longitude

### Method 3: Online Tools
- https://www.latlong.net/
- https://www.gps-coordinates.net/

## Example Scenarios

### Scenario 1: Same Barangay (Short Distance)
```
Equipment: Palayan, Calapan (13.4119, 121.1803)
Delivery: Nearby farm in Palayan (13.4150, 121.1820)
Distance: ~0.5 km
Fee: ₱0 (FREE - within 5 km)
```

### Scenario 2: Different Barangay (Medium Distance)
```
Equipment: Palayan, Calapan (13.4119, 121.1803)
Delivery: Nabuslot, Calapan (13.4500, 121.2000)
Distance: ~10 km
Fee: ₱100 + (5 km × ₱15) = ₱175
```

### Scenario 3: Different Municipality (Long Distance)
```
Equipment: Baruyan, Calapan (13.4119, 121.1803)
Delivery: Poblacion, Bongabong (12.7167, 121.3833)
Distance: ~85 km
Fee: ₱100 + (80 km × ₱15) = ₱1,300
```

## Benefits

1. **Fair Pricing**: Renters pay based on actual distance, not arbitrary fees
2. **Transparency**: Clear breakdown of how the fee is calculated
3. **Automatic**: No manual calculation needed by owner or renter
4. **Accurate**: Uses GPS coordinates for precise distance measurement
5. **Flexible**: Easy to adjust pricing structure (base fee, per-km rate, free distance)

## Configuration

To change pricing, edit `TransportationFeeCalculator.php`:

```php
const FREE_DISTANCE_KM = 5;      // Free delivery within 5 km
const BASE_FEE = 100;            // Base fee for distances > 5 km
const PER_KM_RATE = 15;          // Rate per kilometer beyond free distance
```

## Testing

### Test Script
**File**: `capstone_backend/test_transportation_fee.php`

Run: `php test_transportation_fee.php`

Tests various distances and verifies fee calculations.

### Manual Testing
1. Create equipment with coordinates
2. Create rental request with different delivery coordinates
3. Verify transportation fee in response
4. Check fee breakdown details

## Troubleshooting

### Issue: "Equipment location coordinates are not available"
**Solution**: Ensure equipment has valid latitude and longitude values.

### Issue: Fee seems incorrect
**Solution**: 
1. Verify coordinates are correct (not swapped)
2. Check if coordinates are in decimal degrees format
3. Use online distance calculator to verify

### Issue: Coordinates not saving
**Solution**: Check validation rules and ensure values are within valid ranges:
- Latitude: -90 to 90
- Longitude: -180 to 180

## Related Files
- `capstone_backend/app/Services/TransportationFeeCalculator.php`
- `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php`
- `capstone_backend/app/Http/Controllers/Api/EquipmentController.php`
- `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php`
- `capstone_backend/app/Http/Requests/StoreRentalRequestRequest.php`
- `frontend_capstone/src/pages/owner/MyEquipment.jsx`
- `frontend_capstone/src/pages/renter/BrowseEquipment.jsx`
