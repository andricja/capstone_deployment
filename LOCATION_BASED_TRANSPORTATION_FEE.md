# Location-Based Transportation Fee System

## Overview

The transportation fee is now automatically calculated based on the distance between the equipment location and the delivery address using GPS coordinates (latitude/longitude).

## How It Works

### Fee Calculation Formula

```
Distance = Haversine formula (equipment coords → delivery coords)

If distance ≤ 5 km:
    Fee = ₱0 (FREE DELIVERY)

If distance > 5 km:
    Fee = ₱100 (base fee) + (distance - 5 km) × ₱15/km
```

### Example Calculations

**Example 1: Short Distance (3 km)**
- Distance: 3 km
- Fee: ₱0 (Free delivery within 5 km radius)

**Example 2: Medium Distance (10 km)**
- Distance: 10 km
- Chargeable distance: 10 - 5 = 5 km
- Fee: ₱100 + (5 × ₱15) = ₱175

**Example 3: Long Distance (25 km)**
- Distance: 25 km
- Chargeable distance: 25 - 5 = 20 km
- Fee: ₱100 + (20 × ₱15) = ₱400

## Configuration

### Adjustable Parameters

Edit `app/Services/TransportationFeeCalculator.php`:

```php
// Base fee (minimum charge for delivery)
private const BASE_FEE = 100.00;

// Cost per kilometer beyond free radius
private const COST_PER_KM = 15.00;

// Free delivery radius in kilometers
private const FREE_DELIVERY_RADIUS = 5.0;
```

## Database Changes

### Equipment Table
Added coordinates to equipment:
- `latitude` (decimal 10,7) - Equipment location latitude
- `longitude` (decimal 10,7) - Equipment location longitude

### Migration
```bash
php artisan migrate
```

Already applied: `2026_03_26_010923_add_coordinates_to_equipment_table.php`

## API Endpoints

### 1. Calculate Transportation Fee (Preview)

**Endpoint**: `POST /api/renter/rental-requests/calculate-fee`

**Purpose**: Preview transportation fee before submitting rental request

**Request**:
```json
{
  "equipment_id": 1,
  "latitude": 13.4123,
  "longitude": 121.1234
}
```

**Response**:
```json
{
  "equipment_location": {
    "name": "Calapan City",
    "latitude": 13.4000,
    "longitude": 121.1000
  },
  "delivery_location": {
    "latitude": 13.4123,
    "longitude": 121.1234
  },
  "fee_breakdown": {
    "distance_km": 2.45,
    "base_fee": 0,
    "distance_fee": 0,
    "total_fee": 0,
    "free_delivery": true,
    "note": "Free delivery within 2.45 km radius."
  }
}
```

### 2. Create Rental Request

**Endpoint**: `POST /api/renter/rental-requests`

**Changes**: 
- Transportation fee now calculated automatically based on coordinates
- Response includes detailed fee breakdown

**Request** (same as before):
```json
{
  "equipment_id": 1,
  "farm_size_sqm": 5000,
  "start_date": "2026-04-01",
  "contact_number": "09123456789",
  "delivery_address": "Barangay San Antonio, Calapan City",
  "latitude": 13.4123,
  "longitude": 121.1234,
  "payment_method": "gcash"
}
```

**Response** (enhanced):
```json
{
  "message": "Rental request submitted...",
  "rental_request": { ... },
  "cost_breakdown": {
    "farm_size_sqm": 5000,
    "estimated_hours": 2.5,
    "rental_days": 1,
    "daily_rate": 1500,
    "base_cost": 1500,
    "delivery_fee": 175,
    "service_charge": 75,
    "total_cost": 1750,
    "transportation_details": {
      "distance_km": 10,
      "free_radius_km": 5,
      "chargeable_distance_km": 5,
      "base_fee": 100,
      "cost_per_km": 15,
      "distance_fee": 75,
      "total_fee": 175,
      "free_delivery": false,
      "note": "Base fee + ₱75 for 5 km"
    }
  }
}
```

## Equipment Management

### Adding/Updating Equipment

Owners should now provide coordinates when adding equipment:

**Request**:
```json
{
  "name": "John Deere Tractor",
  "category": "tractor",
  "description": "Heavy-duty tractor",
  "daily_rate": 1500,
  "location": "Calapan City",
  "latitude": 13.4000,
  "longitude": 121.1000,
  "image": "(file upload)"
}
```

**Note**: If coordinates are not provided:
- System falls back to base fee (₱100)
- Owners should be encouraged to add coordinates for accurate pricing

## Frontend Integration

### 1. Equipment Form (Owner)

Add coordinate input fields:

```jsx
<input 
  type="number" 
  step="0.0000001"
  name="latitude" 
  placeholder="Latitude (e.g., 13.4000)"
  min="-90"
  max="90"
/>

<input 
  type="number" 
  step="0.0000001"
  name="longitude" 
  placeholder="Longitude (e.g., 121.1000)"
  min="-180"
  max="180"
/>
```

**Better UX**: Use a map picker (Google Maps, Leaflet, etc.) to let owners click their location.

### 2. Rental Request Form (Renter)

**Step 1**: Get delivery coordinates (map picker or geolocation)

**Step 2**: Preview transportation fee
```javascript
const previewFee = async (equipmentId, lat, lng) => {
  const response = await api.post('/renter/rental-requests/calculate-fee', {
    equipment_id: equipmentId,
    latitude: lat,
    longitude: lng
  });
  
  const { fee_breakdown } = response.data;
  
  // Display to user:
  // Distance: 10 km
  // Delivery Fee: ₱175
  // (Free delivery within 5 km)
};
```

**Step 3**: Submit rental request with coordinates

### 3. Display Fee Breakdown

Show detailed breakdown to renters:

```jsx
<div className="fee-breakdown">
  <h3>Transportation Fee Breakdown</h3>
  
  {freeDelivery ? (
    <p className="text-green-600">
      ✓ Free Delivery ({distance} km within free radius)
    </p>
  ) : (
    <>
      <p>Distance: {distance} km</p>
      <p>Base Fee: ₱{baseFee}</p>
      <p>Distance Fee: ₱{distanceFee} ({chargeableDistance} km × ₱{costPerKm}/km)</p>
      <p className="font-bold">Total: ₱{totalFee}</p>
    </>
  )}
</div>
```

## Fallback Behavior

### When Coordinates Are Missing

**Equipment without coordinates**:
- Falls back to base fee (₱100)
- Warning shown to owner to add coordinates

**Delivery without coordinates**:
- Falls back to base fee (₱100)
- Renter should be required to provide coordinates

### Backward Compatibility

- Old equipment without coordinates: Uses base fee
- Old rental requests: Already have fixed delivery_fee stored
- No data migration needed

## Testing

### Test the Calculator

```bash
php artisan tinker
```

```php
use App\Services\TransportationFeeCalculator;

// Test free delivery (3 km)
$fee = TransportationFeeCalculator::calculate(
    13.4000, 121.1000,  // Equipment location
    13.4200, 121.1100   // Delivery location
);
echo "Fee: ₱{$fee}\n";

// Test with breakdown
$breakdown = TransportationFeeCalculator::getBreakdown(
    13.4000, 121.1000,
    13.4500, 121.1500
);
print_r($breakdown);
```

### Test the API

```bash
# Calculate fee
curl -X POST http://localhost:8000/api/renter/rental-requests/calculate-fee \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_id": 1,
    "latitude": 13.4123,
    "longitude": 121.1234
  }'
```

## Benefits

1. **Fair Pricing**: Renters pay based on actual distance
2. **Transparency**: Clear breakdown of transportation costs
3. **Free Local Delivery**: Encourages nearby rentals (within 5 km)
4. **Automatic Calculation**: No manual fee setting needed
5. **Accurate**: Uses Haversine formula for precise distance

## Municipalities in Oriental Mindoro

For reference, here are approximate coordinates:

| Municipality | Latitude | Longitude |
|-------------|----------|-----------|
| Calapan City | 13.4119 | 121.1803 |
| Naujan | 13.3247 | 121.3042 |
| Victoria | 13.1667 | 121.3000 |
| Socorro | 12.8667 | 121.4167 |
| Pinamalayan | 13.0333 | 121.4833 |
| Bansud | 12.8333 | 121.4167 |
| Gloria | 12.9833 | 121.4667 |
| Bongabong | 12.7167 | 121.3667 |
| Roxas | 12.5833 | 121.5167 |
| Mansalay | 12.5167 | 121.4500 |
| Bulalacao | 12.3333 | 121.3500 |
| San Teodoro | 13.4500 | 121.0167 |
| Baco | 13.3500 | 121.1000 |
| Puerto Galera | 13.5000 | 120.9500 |
| Pola | 13.1500 | 121.4333 |

## Future Enhancements

1. **Route-based calculation**: Use actual road distance (Google Maps API)
2. **Traffic consideration**: Adjust fees based on road conditions
3. **Bulk discount**: Reduced rate for multiple equipment
4. **Peak pricing**: Higher rates during busy seasons
5. **Owner override**: Allow owners to set custom fees
6. **Delivery zones**: Predefined zones with fixed rates

## Troubleshooting

**Issue**: Fee always shows ₱100
- **Cause**: Equipment or delivery coordinates missing
- **Fix**: Ensure both equipment and delivery have valid coordinates

**Issue**: Distance seems incorrect
- **Cause**: Coordinates might be swapped (lat/lng)
- **Fix**: Verify latitude is between -90 and 90, longitude between -180 and 180

**Issue**: Fee too high/low
- **Cause**: Configuration values need adjustment
- **Fix**: Edit `TransportationFeeCalculator.php` constants

## Summary

✅ Transportation fee now based on actual distance
✅ Free delivery within 5 km radius
✅ ₱100 base fee + ₱15/km beyond free radius
✅ API endpoint for fee preview
✅ Detailed breakdown in responses
✅ Backward compatible with existing data
✅ Easy to configure and adjust
