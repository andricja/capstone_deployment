# Owner Transportation Fee Settings - IMPLEMENTATION COMPLETE ✅

## Overview
Implemented a system where equipment owners can set their own transportation fee rates per kilometer, giving them full control over delivery pricing.

## Database Changes

### Migration Created
File: `2026_03_27_073851_add_transportation_fee_per_km_to_equipment_table.php`

**New Fields Added to `equipment` table:**
1. `transportation_fee_per_km` (decimal 8,2) - Rate per kilometer (default: ₱15.00)
2. `free_distance_km` (decimal 8,2) - Distance within which delivery is free (default: 5.00 km)
3. `base_transportation_fee` (decimal 8,2) - Flat fee beyond free distance (default: ₱100.00)

**To Run Migration:**
```bash
php artisan migrate
```

## Backend Implementation

### 1. Equipment Model Updated
- Added new fields to `$fillable` array
- Added new fields to `casts()` method with decimal:2 precision

### 2. Validation Rules Updated
**StoreEquipmentRequest.php:**
- `transportation_fee_per_km`: required, numeric, min:0, max:1000
- `free_distance_km`: required, numeric, min:0, max:100
- `base_transportation_fee`: required, numeric, min:0, max:10000

**UpdateEquipmentRequest.php:**
- Same rules with 'sometimes' instead of 'required'

### 3. RentalRequestController Updated
Changed transportation fee calculation to use equipment owner's settings:

```php
// Get owner's settings from equipment
$freeDistanceKm = $equipment->free_distance_km ?? 5.00;
$baseFee = $equipment->base_transportation_fee ?? 100.00;
$perKmRate = $equipment->transportation_fee_per_km ?? 15.00;

// Calculate fee
if ($distance <= $freeDistanceKm) {
    $deliveryFee = 0;
} else {
    $billableDistance = $distance - $freeDistanceKm;
    $deliveryFee = $baseFee + ($billableDistance * $perKmRate);
}
```

## Frontend Implementation

### 1. MyEquipment.jsx (Owner Interface)
Added transportation fee settings section in the equipment form:

**Three Input Fields:**
1. **Free Distance (km)** - Distance within which delivery is free
2. **Base Fee (₱)** - Flat fee charged beyond free distance
3. **Per KM Rate (₱)** - Additional charge per kilometer beyond free distance

**Features:**
- Default values: 5 km free, ₱100 base, ₱15/km
- Real-time example calculation shown below inputs
- Validation: min 0, appropriate max values
- Saved with equipment data

**Example Display:**
```
Example: Free within 5 km, then ₱100 + ₱15/km beyond that
```

### 2. DualLocationPicker.jsx (Renter Interface)
Updated to use equipment owner's transportation fee settings:

**Props Added:**
- `freeDistanceKm` (default: 5)
- `baseFee` (default: 100)
- `perKmRate` (default: 15)

**calculateFee Function Updated:**
```javascript
function calculateFee(distance, freeDistanceKm = 5, baseFee = 100, perKmRate = 15) {
  if (distance <= freeDistanceKm) {
    return 0;
  }
  
  const billableDistance = distance - freeDistanceKm;
  return baseFee + (billableDistance * perKmRate);
}
```

### 3. BrowseEquipment.jsx (Renter Interface)
Updated to pass equipment's transportation fee settings to DualLocationPicker:

```javascript
<DualLocationPicker
  equipmentLatitude={selected?.latitude}
  equipmentLongitude={selected?.longitude}
  equipmentName={selected?.name}
  deliveryLatitude={rentalForm.latitude}
  deliveryLongitude={rentalForm.longitude}
  freeDistanceKm={parseFloat(selected?.free_distance_km) || 5}
  baseFee={parseFloat(selected?.base_transportation_fee) || 100}
  perKmRate={parseFloat(selected?.transportation_fee_per_km) || 15}
  onChange={({ latitude, longitude }) => setRentalForm({ ...rentalForm, latitude, longitude })}
/>
```

## How It Works

### Owner Workflow:
1. Owner adds/edits equipment
2. Sets transportation fee settings:
   - Free distance: e.g., 5 km
   - Base fee: e.g., ₱100
   - Per km rate: e.g., ₱15/km
3. Settings are saved with equipment

### Renter Workflow:
1. Renter selects equipment to rent
2. Clicks on map to set delivery location
3. System calculates distance
4. Transportation fee calculated using owner's settings:
   - If distance ≤ free distance: ₱0
   - If distance > free distance: base fee + (extra distance × per km rate)
5. Fee displayed in real-time

## Examples

### Example 1: Within Free Distance
- Owner settings: 5 km free, ₱100 base, ₱15/km
- Distance: 3.5 km
- **Fee: ₱0 (FREE)**

### Example 2: Beyond Free Distance
- Owner settings: 5 km free, ₱100 base, ₱15/km
- Distance: 12 km
- Billable distance: 12 - 5 = 7 km
- **Fee: ₱100 + (7 × ₱15) = ₱205**

### Example 3: Custom Owner Rates
- Owner settings: 10 km free, ₱50 base, ₱20/km
- Distance: 15 km
- Billable distance: 15 - 10 = 5 km
- **Fee: ₱50 + (5 × ₱20) = ₱150**

## Benefits

### For Owners:
- ✅ Full control over transportation pricing
- ✅ Can offer competitive rates
- ✅ Can adjust based on equipment type/size
- ✅ Can set larger free distance to attract renters
- ✅ Flexibility to cover actual transportation costs

### For Renters:
- ✅ Transparent pricing
- ✅ See exact fee before booking
- ✅ Can compare rates between owners
- ✅ Know if delivery is free
- ✅ Real-time fee calculation

### For System:
- ✅ Flexible pricing model
- ✅ Owner-driven economics
- ✅ Competitive marketplace
- ✅ Fair and transparent

## Files Modified

### Backend:
1. `capstone_backend/database/migrations/2026_03_27_073851_add_transportation_fee_per_km_to_equipment_table.php` (NEW)
2. `capstone_backend/app/Models/Equipment.php`
3. `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php`
4. `capstone_backend/app/Http/Requests/UpdateEquipmentRequest.php`
5. `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php`

### Frontend:
1. `frontend_capstone/src/pages/owner/MyEquipment.jsx`
2. `frontend_capstone/src/components/DualLocationPicker.jsx`
3. `frontend_capstone/src/pages/renter/BrowseEquipment.jsx`

## Next Steps

1. **Run Migration:**
   ```bash
   cd capstone_backend
   php artisan migrate
   ```

2. **Test the Feature:**
   - Add new equipment with custom transportation fees
   - Edit existing equipment to set fees
   - Rent equipment and verify fee calculation
   - Test with different distances

3. **Optional Enhancements:**
   - Add preset templates (e.g., "Standard", "Premium", "Budget")
   - Show owner's transportation fee settings on equipment card
   - Add analytics for owners to see average delivery distances
   - Allow owners to set different rates for different distance ranges

## Status: ✅ IMPLEMENTATION COMPLETE

The system now allows equipment owners to set their own transportation fee rates. Renters see the exact fee based on the owner's settings and the delivery distance.

**IMPORTANT:** Run the migration to add the new database fields before testing!
