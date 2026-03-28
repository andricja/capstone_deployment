# Equipment Location with Structured Address - Implementation Complete

## Overview
Equipment location now uses a structured address system with dropdowns for Municipality, Barangay, and Province (Oriental Mindoro). The transportation fee is automatically calculated based on the distance between equipment location and delivery location.

## Changes Made

### 1. Database Migration
**File**: `capstone_backend/database/migrations/2026_03_26_095040_add_structured_address_to_equipment_table.php`

Added three new fields to the `equipment` table:
- `municipality` (string, nullable)
- `barangay` (string, nullable)
- `province` (string, default: 'Oriental Mindoro')

The `location` field is kept for backward compatibility and is auto-generated from `barangay` and `municipality`.

### 2. Model Updates
**File**: `capstone_backend/app/Models/Equipment.php`

Added new fields to `$fillable`:
```php
'municipality',
'barangay',
'province',
```

### 3. Validation Updates

#### StoreEquipmentRequest
**File**: `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php`

- `location`: Changed from `required` to `nullable` (auto-generated)
- `municipality`: Added as `required`
- `barangay`: Added as `required`
- `province`: Added as `nullable` (defaults to 'Oriental Mindoro')

#### UpdateEquipmentRequest
**File**: `capstone_backend/app/Http/Requests/UpdateEquipmentRequest.php`

- `location`: Changed to `nullable`
- `municipality`: Added as `sometimes`
- `barangay`: Added as `sometimes`
- `province`: Added as `nullable`

### 4. Controller Updates
**File**: `capstone_backend/app/Http/Controllers/Api/EquipmentController.php`

#### store() method
- Auto-generates `location` field from `municipality` and `barangay`
- Sets default `province` to 'Oriental Mindoro' if not provided
- Keeps `transportation_fee` field but defaults to 0 (will be calculated dynamically)

#### update() method
- Auto-generates `location` field when both `municipality` and `barangay` are provided
- Handles province default value

#### adminStore() method
- Updated validation to require `municipality` and `barangay`
- Auto-generates `location` field
- Sets default province

### 5. Frontend Updates
**File**: `frontend_capstone/src/pages/owner/MyEquipment.jsx`

#### Form State
```javascript
{
  municipality: '', 
  barangay: '', 
  province: 'Oriental Mindoro',
  latitude: '', 
  longitude: ''
}
```

#### Address Dropdowns
- Municipality dropdown (required) - loads from `/api/addresses/municipalities`
- Barangay dropdown (required) - loads from `/api/addresses/municipalities/{municipality}/barangays`
- Province field (fixed to 'Oriental Mindoro')
- Latitude/Longitude fields (optional) - for accurate transportation fee calculation

#### Display
Equipment cards now show:
```javascript
{eq.barangay ? `Brgy. ${eq.barangay}, ${eq.municipality}` : eq.location || eq.municipality}
```

## How It Works

### Equipment Creation Flow
1. Owner selects municipality from dropdown
2. Barangay dropdown populates based on selected municipality
3. Province is fixed to 'Oriental Mindoro'
4. Owner can optionally enter coordinates for precise location
5. On submit, backend auto-generates `location` field: `"{barangay}, {municipality}"`

### Transportation Fee Calculation
When a renter creates a rental request:
1. System uses equipment's `latitude` and `longitude` (if provided)
2. Calculates distance to delivery location using Haversine formula
3. Applies pricing: Free within 5 km, then ₱100 base + ₱15/km beyond 5 km
4. Fee is calculated dynamically, not stored in equipment

### Backward Compatibility
- Existing equipment with only `location` field will still work
- Display logic checks for `barangay` first, falls back to `location`
- `location` field is auto-generated for new/updated equipment

## API Endpoints Used

### Address Data
- `GET /api/addresses/municipalities` - List all municipalities
- `GET /api/addresses/municipalities/{municipality}/barangays` - List barangays for a municipality

### Equipment Management
- `POST /api/owner/equipment` - Create equipment (requires municipality, barangay)
- `PUT /api/owner/equipment/{id}` - Update equipment
- `GET /api/owner/equipment` - List owner's equipment

### Transportation Fee
- `POST /api/renter/rental-requests/calculate-fee` - Preview transportation fee
  - Requires: `equipment_id`, `latitude`, `longitude`
  - Returns: Distance, fee breakdown, equipment location

## Testing

### Test Script
**File**: `capstone_backend/test_equipment_location.php`

Run: `php test_equipment_location.php`

Tests:
- ✓ Equipment creation with structured address
- ✓ Auto-generation of location field
- ✓ Coordinate storage
- ✓ All fields saved correctly

### Manual Testing Checklist
- [ ] Create new equipment with municipality and barangay
- [ ] Verify location field is auto-generated
- [ ] Edit equipment and change location
- [ ] Verify equipment displays correctly in browse page
- [ ] Create rental request and verify transportation fee calculation
- [ ] Test with and without coordinates

## Data Structure

### Equipment Table Columns
```
id, owner_id, name, category, description, daily_rate, 
transportation_fee, location, municipality, barangay, province,
latitude, longitude, image, status, archived_at, approval_fee, 
approved_at, created_at, updated_at
```

### Example Equipment Record
```json
{
  "id": 27,
  "name": "Test Tractor",
  "location": "Baruyan, Calapan",
  "municipality": "Calapan",
  "barangay": "Baruyan",
  "province": "Oriental Mindoro",
  "latitude": 13.4119,
  "longitude": 121.1803,
  "status": "available"
}
```

## Migration Status
✓ Migration run successfully: `2026_03_26_095040_add_structured_address_to_equipment_table`

## Notes

### Coordinates
- Coordinates are optional but recommended for accurate transportation fee calculation
- If not provided, system can use barangay center coordinates (future enhancement)
- Format: Latitude (-90 to 90), Longitude (-180 to 180)

### Transportation Fee
- No longer manually entered by equipment owner
- Calculated dynamically based on distance
- Stored in rental_request, not in equipment table
- Equipment's `transportation_fee` field kept for backward compatibility but defaults to 0

### Province Field
- Fixed to 'Oriental Mindoro' for this system
- Can be extended to support multiple provinces in the future

## Future Enhancements
1. Create barangay coordinates database for auto-filling equipment coordinates
2. Add map picker for visual coordinate selection
3. Support multiple provinces
4. Add distance validation (e.g., max delivery distance)
5. Add delivery zone pricing tiers

## Related Documentation
- `ADDRESS_SYSTEM_IMPLEMENTATION.md` - Rental request address system
- `LOCATION_BASED_TRANSPORTATION_FEE.md` - Transportation fee calculation
- `TRANSPORTATION_FEE_QUICK_GUIDE.md` - Quick reference guide
