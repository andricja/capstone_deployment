# Transportation Fee - Quick Reference

## ✅ What's Implemented

1. ✅ Location-based transportation fee calculation
2. ✅ Distance calculation using Haversine formula
3. ✅ Free delivery within 5 km radius
4. ✅ Database migration for equipment coordinates
5. ✅ API endpoint for fee preview
6. ✅ Enhanced rental request with automatic fee calculation
7. ✅ Detailed fee breakdown in responses
8. ✅ Tested and working

## 💰 Pricing Structure

```
Distance ≤ 5 km:     FREE DELIVERY (₱0)
Distance > 5 km:     ₱100 + (distance - 5) × ₱15/km
```

### Examples from Test Results

| Distance | Calculation | Fee |
|----------|-------------|-----|
| 2.47 km | Free delivery | ₱0 |
| 7.76 km | ₱100 + (2.76 × ₱15) | ₱141.40 |
| 31.02 km | ₱100 + (26.02 × ₱15) | ₱490.30 |

## 🔧 Configuration

Edit `app/Services/TransportationFeeCalculator.php`:

```php
private const BASE_FEE = 100.00;              // Change base fee
private const COST_PER_KM = 15.00;            // Change per-km rate
private const FREE_DELIVERY_RADIUS = 5.0;     // Change free radius
```

## 📍 Equipment Setup (Owners)

When adding/editing equipment, include coordinates:

```json
{
  "name": "Tractor",
  "location": "Calapan City",
  "latitude": 13.4119,
  "longitude": 121.1803,
  ...
}
```

**Frontend**: Add map picker or coordinate input fields

## 🚚 Rental Request (Renters)

### Step 1: Preview Fee (Optional)

```javascript
POST /api/renter/rental-requests/calculate-fee

{
  "equipment_id": 1,
  "latitude": 13.4500,
  "longitude": 121.1500
}

Response:
{
  "fee_breakdown": {
    "distance_km": 7.76,
    "total_fee": 141.40,
    "free_delivery": false,
    "note": "Base fee + ₱41.4 for 2.76 km"
  }
}
```

### Step 2: Submit Rental Request

```javascript
POST /api/renter/rental-requests

{
  "equipment_id": 1,
  "farm_size_sqm": 5000,
  "start_date": "2026-04-01",
  "delivery_address": "Barangay San Antonio",
  "latitude": 13.4500,
  "longitude": 121.1500,
  ...
}

Response includes:
{
  "cost_breakdown": {
    "delivery_fee": 141.40,
    "transportation_details": {
      "distance_km": 7.76,
      "base_fee": 100,
      "distance_fee": 41.40,
      "total_fee": 141.40
    }
  }
}
```

## 🧪 Testing

```bash
# Run test script
cd capstone_backend
php test_transportation_fee.php
```

## 📊 Frontend Display

```jsx
// Show fee breakdown to users
{transportation_details.free_delivery ? (
  <div className="text-green-600">
    ✓ Free Delivery ({transportation_details.distance_km} km)
  </div>
) : (
  <div>
    <p>Distance: {transportation_details.distance_km} km</p>
    <p>Base Fee: ₱{transportation_details.base_fee}</p>
    <p>Distance Fee: ₱{transportation_details.distance_fee}</p>
    <p className="font-bold">
      Total: ₱{transportation_details.total_fee}
    </p>
  </div>
)}
```

## 🗺️ Getting Coordinates

### Option 1: Geolocation API (Browser)
```javascript
navigator.geolocation.getCurrentPosition((position) => {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
});
```

### Option 2: Map Picker
- Use Google Maps, Leaflet, or Mapbox
- Let users click on map to select location
- Extract coordinates from click event

### Option 3: Address Geocoding
- Use geocoding API (Google, Nominatim)
- Convert address to coordinates
- Store coordinates with rental request

## 🔄 Backward Compatibility

- Old equipment without coordinates: Uses base fee (₱100)
- Old rental requests: Keep their stored delivery_fee
- No data migration needed
- System gracefully handles missing coordinates

## 📝 Database Changes

```sql
-- Equipment table now has:
ALTER TABLE equipment ADD COLUMN latitude DECIMAL(10,7) NULL;
ALTER TABLE equipment ADD COLUMN longitude DECIMAL(10,7) NULL;
```

Already migrated: ✅

## 🎯 Key Benefits

1. **Fair Pricing**: Pay for actual distance
2. **Free Local Delivery**: Within 5 km
3. **Transparent**: Clear breakdown shown
4. **Automatic**: No manual calculation
5. **Accurate**: GPS-based distance

## 🚨 Important Notes

- Renters MUST provide delivery coordinates
- Owners SHOULD provide equipment coordinates
- Missing coordinates = fallback to ₱100 base fee
- Coordinates validated: lat (-90 to 90), lng (-180 to 180)

## 📞 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/renter/rental-requests/calculate-fee` | POST | Preview fee |
| `/api/renter/rental-requests` | POST | Create request (auto-calculates fee) |
| `/api/owner/equipment` | POST | Add equipment (include coords) |
| `/api/owner/equipment/{id}` | PUT | Update equipment (include coords) |

## ✨ Next Steps

1. Add map picker to equipment form (owner)
2. Add map picker to rental request form (renter)
3. Display fee breakdown in UI
4. Show distance on equipment cards
5. Add "nearby equipment" filter (sort by distance)

## 🆘 Troubleshooting

**Fee always ₱100?**
- Check if equipment has coordinates
- Check if delivery has coordinates
- Verify coordinates are valid numbers

**Distance seems wrong?**
- Verify lat/lng not swapped
- Check coordinates are in correct format
- Test with known locations

**Want to change pricing?**
- Edit `TransportationFeeCalculator.php`
- Update constants at top of class
- No database changes needed
