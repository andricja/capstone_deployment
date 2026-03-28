# Pricing Model Change: COMPLETE ✅

## Summary
Successfully changed the equipment pricing model from "Daily Rate" to "Price Per Square Meter" with owner-defined coverage rates.

## What Changed

### Old Model (Daily Rate)
- Owner sets: Daily Rate (₱/day)
- System uses: Fixed coverage rates by category
- Cost calculation: Daily Rate × Rental Days

### New Model (Price Per Square Meter)
- Owner sets: Price per sqm (₱/sqm) + Coverage Rate (sqm/hr)
- System uses: Owner's coverage rate (not fixed)
- Cost calculation: Price per sqm × Farm Size (sqm)

## Implementation Status

### ✅ Backend (Complete)

#### 1. Database Migration
**File:** `capstone_backend/database/migrations/2026_03_26_231200_change_equipment_pricing_to_per_sqm.php`
- Renamed `daily_rate` → `price_per_sqm`
- Added `coverage_rate` column (default: 1500 sqm/hr)
- Migration file exists and ready to run

#### 2. Equipment Model
**File:** `capstone_backend/app/Models/Equipment.php`
```php
protected $fillable = [
    'price_per_sqm',  // New
    'coverage_rate',  // New
    // ... other fields
];

protected function casts(): array {
    return [
        'price_per_sqm' => 'decimal:2',
        'coverage_rate' => 'decimal:2',
        // ... other casts
    ];
}
```

#### 3. Validation Rules
**Files:**
- `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php`
- `capstone_backend/app/Http/Requests/UpdateEquipmentRequest.php`

```php
'price_per_sqm' => ['required', 'numeric', 'min:0'],
'coverage_rate' => ['required', 'numeric', 'min:100'],
```

#### 4. Rental Request Controller
**File:** `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php`
- Removed fixed `COVERAGE_RATES` array
- Now uses `$equipment->coverage_rate` (owner-defined)
- Cost calculation: `$baseCost = $equipment->price_per_sqm * $farmSizeSqm`
- API responses include `price_per_sqm` and `coverage_rate`

### ✅ Frontend (Complete)

#### 1. Owner Equipment Page
**File:** `frontend_capstone/src/pages/owner/MyEquipment.jsx`

**Form Fields:**
```jsx
// Price per sqm input
<input 
  type="number" 
  min="0" 
  step="0.01" 
  value={form.price_per_sqm}
  placeholder="e.g. 0.50"
/>

// Coverage rate input
<input 
  type="number" 
  min="100" 
  step="1" 
  value={form.coverage_rate}
  placeholder="e.g. 1500"
/>
```

**Equipment Display:**
```jsx
<p className="text-sm font-medium text-green-700">
  ₱{parseFloat(eq.price_per_sqm || 0).toLocaleString()}/sqm • 
  {parseFloat(eq.coverage_rate || 0).toLocaleString()} sqm/hr
</p>
```

#### 2. Renter Browse Equipment Page
**File:** `frontend_capstone/src/pages/renter/BrowseEquipment.jsx`

**Changes:**
- Removed fixed `COVERAGE_RATES` constant
- Uses equipment's own `price_per_sqm` and `coverage_rate`
- Updated cost calculation to use `price_per_sqm × farm_size_sqm`
- Updated all display text from "Daily Rate" to "Price/sqm"

**Card View:**
```jsx
<p className="text-lg font-bold text-green-700">
  ₱{parseFloat(eq.price_per_sqm || 0).toLocaleString()}
  <span className="text-xs font-normal text-gray-500">/sqm</span>
</p>
<p className="text-xs text-gray-500">
  {parseFloat(eq.coverage_rate || 0).toLocaleString()} sqm/hr coverage
</p>
```

**Table View:**
```jsx
<th>Price/sqm</th>
<td>
  <p className="font-bold text-green-700">
    ₱{parseFloat(eq.price_per_sqm || 0).toLocaleString()}/sqm
  </p>
  <p className="text-xs text-gray-400">
    {parseFloat(eq.coverage_rate || 0).toLocaleString()} sqm/hr
  </p>
</td>
```

**Rental Modal:**
```jsx
// Header shows price per sqm and coverage rate
{selected.name} — ₱{parseFloat(selected.price_per_sqm || 0).toLocaleString()}/sqm • 
{parseFloat(selected.coverage_rate || 0).toLocaleString()} sqm/hr

// Cost breakdown uses new calculation
Base Cost (₱{fmt(costBreakdown.pricePerSqm)}/sqm × {costBreakdown.farmSize.toLocaleString()} sqm)
```

## New Pricing Calculation

### Owner Sets:
1. **Price per sqm** (₱) - e.g., ₱0.50 per square meter
2. **Coverage Rate** (sqm/hr) - e.g., 1,500 sqm/hr

### System Calculates:
```javascript
// 1. Estimated Hours
estimatedHours = farmSize (sqm) ÷ coverageRate (sqm/hr)

// 2. Rental Days (for scheduling)
rentalDays = Math.ceil(estimatedHours ÷ 8)

// 3. Base Cost (NEW FORMULA)
baseCost = pricePerSqm × farmSize

// 4. Service Charge
serviceCharge = baseCost × 5%

// 5. Total Cost
totalCost = baseCost + deliveryFee + serviceCharge
```

## Example Calculation

### Equipment Details:
- Price per sqm: ₱0.50
- Coverage Rate: 1,500 sqm/hr

### Rental Request:
- Farm Size: 10,000 sqm

### Calculation:
```
Estimated Hours = 10,000 ÷ 1,500 = 6.7 hours
Rental Days = Math.ceil(6.7 ÷ 8) = 1 day

Base Cost = ₱0.50 × 10,000 = ₱5,000
Service Charge = ₱5,000 × 5% = ₱250
Delivery Fee = (calculated based on distance)
Total Cost = ₱5,000 + ₱250 + Delivery Fee
```

## Benefits

### 1. Flexible Pricing
✅ Owners set competitive prices per sqm
✅ Reflects actual work done (area covered)
✅ Fair for both small and large farms

### 2. Accurate Coverage Rates
✅ Each equipment has its own coverage rate
✅ Not fixed by category
✅ Reflects actual equipment capability

### 3. Transparent Calculations
✅ Renters see price per sqm
✅ Clear how cost is calculated
✅ Easy to compare equipment prices

### 4. Minimum Farm Size
✅ 100 sqm minimum ensures viable rentals
✅ Prevents very small, unprofitable rentals

## Files Modified

### Backend (6 files)
1. `capstone_backend/database/migrations/2026_03_26_231200_change_equipment_pricing_to_per_sqm.php` - NEW
2. `capstone_backend/app/Models/Equipment.php` - Updated fillable and casts
3. `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php` - Updated validation
4. `capstone_backend/app/Http/Requests/UpdateEquipmentRequest.php` - Updated validation
5. `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php` - Updated calculation
6. `capstone_backend/app/Http/Controllers/Api/EquipmentController.php` - Updated validation

### Frontend (2 files)
1. `frontend_capstone/src/pages/owner/MyEquipment.jsx` - Complete rewrite
2. `frontend_capstone/src/pages/renter/BrowseEquipment.jsx` - Updated pricing display and calculation

## Testing Checklist

### Backend
- [x] Migration file created
- [x] Equipment model updated
- [x] Validation rules updated
- [x] Rental request controller updated
- [x] Equipment controller updated
- [x] No diagnostic errors

### Frontend
- [x] MyEquipment.jsx form updated with new fields
- [x] Equipment display cards show price/sqm and coverage rate
- [x] BrowseEquipment.jsx updated to use equipment's own rates
- [x] Rental request modal shows new pricing
- [x] Cost calculation uses new formula
- [x] No diagnostic errors

## Next Steps

### 1. Run Migration
```bash
cd capstone_backend
php artisan migrate
```

### 2. Test Equipment Creation
- Go to Owner → My Equipment
- Click "Add Equipment"
- Fill in:
  - Equipment Name: "Test Harvester"
  - Category: harvester
  - Price per sqm: 0.50
  - Coverage Rate: 1500
  - Location details
  - Coordinates
- Submit for review

### 3. Test Rental Request
- Go to Renter → Browse Equipment
- Find an equipment
- Click "Request Rental"
- Enter farm size: 10000 sqm
- Verify cost calculation shows:
  - Base Cost = ₱0.50 × 10,000 = ₱5,000
  - Service Charge = ₱250
  - Total with delivery fee

### 4. Verify Database
```sql
-- Check equipment table structure
DESCRIBE equipment;

-- Should show:
-- price_per_sqm DECIMAL(10,2)
-- coverage_rate DECIMAL(10,2)

-- Check existing equipment
SELECT id, name, price_per_sqm, coverage_rate FROM equipment;
```

## API Response Changes

### Equipment List/Show Response
```json
{
  "id": 1,
  "name": "John's Harvester",
  "category": "harvester",
  "price_per_sqm": "0.50",
  "coverage_rate": "1500.00",
  "location": "Brgy. Palayan, Calapan",
  "latitude": "13.4119",
  "longitude": "121.1803",
  "status": "available"
}
```

### Rental Request Response
```json
{
  "rental_request": {
    "id": 1,
    "farm_size_sqm": 10000,
    "estimated_hours": 6.7,
    "rental_days": 1
  },
  "cost_breakdown": {
    "price_per_sqm": "0.50",
    "coverage_rate": "1500.00",
    "farm_size_sqm": 10000,
    "base_cost": "5000.00",
    "delivery_fee": "250.00",
    "service_charge": "250.00",
    "total_cost": "5500.00"
  }
}
```

## Status: ✅ COMPLETE

All backend and frontend changes have been implemented successfully. The pricing model has been changed from "Daily Rate" to "Price Per Square Meter" with owner-defined coverage rates.

**Ready for testing!**
