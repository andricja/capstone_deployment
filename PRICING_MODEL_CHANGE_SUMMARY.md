# Pricing Model Change: Daily Rate → Price Per Square Meter

## Overview
Changed the equipment pricing model from "daily rate" to "price per square meter" with owner-defined coverage rates.

## Changes Made

### 1. Database Migration ✅
**File:** `capstone_backend/database/migrations/2026_03_26_231200_change_equipment_pricing_to_per_sqm.php`

**Changes:**
- Renamed `daily_rate` column to `price_per_sqm`
- Added `coverage_rate` column (sqm per hour)
- Default coverage_rate: 1500 sqm/hr

**Status:** Migration ran successfully

### 2. Equipment Model ✅
**File:** `capstone_backend/app/Models/Equipment.php`

**Changes:**
- Updated `$fillable` array: `daily_rate` → `price_per_sqm`, added `coverage_rate`
- Updated `casts()`: Added `price_per_sqm` and `coverage_rate` as decimal:2

### 3. Validation Rules ✅
**Files:**
- `capstone_backend/app/Http/Requests/StoreEquipmentRequest.php`
- `capstone_backend/app/Http/Requests/UpdateEquipmentRequest.php`

**Changes:**
- `price_per_sqm`: required, numeric, min:0
- `coverage_rate`: required, numeric, min:100
- Removed `daily_rate` validation

### 4. Rental Request Validation ✅
**File:** `capstone_backend/app/Http/Requests/StoreRentalRequestRequest.php`

**Changes:**
- `farm_size_sqm`: Already set to min:100 (minimum 100 sqm)

### 5. Rental Request Controller ✅
**File:** `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php`

**Changes:**
- Removed fixed coverage rates array
- Now uses `$equipment->coverage_rate` (owner-defined)
- Cost calculation: `$baseCost = $equipment->price_per_sqm * $farmSizeSqm`
- Updated response to include `price_per_sqm` and `coverage_rate`
- Updated `myRequests()` and `ownerRequests()` to load new fields

### 6. Equipment Controller ✅
**File:** `capstone_backend/app/Http/Controllers/Api/EquipmentController.php`

**Changes:**
- Updated `adminStore()` validation to use `price_per_sqm` and `coverage_rate`

### 7. Frontend (Needs Fix) ⚠️
**File:** `frontend_capstone/src/pages/owner/MyEquipment.jsx`

**Changes Needed:**
- Update form state to use `price_per_sqm` and `coverage_rate`
- Replace "Daily Rate" input with "Price per sqm"
- Add "Coverage Rate" input field
- Update equipment display cards

## New Pricing Model

### Owner Sets:
1. **Price per sqm** (₱) - How much they charge per square meter
2. **Coverage Rate** (sqm/hr) - How many square meters their equipment can cover per hour

### System Calculates:
1. **Estimated Hours** = Farm Size (sqm) ÷ Coverage Rate (sqm/hr)
2. **Rental Days** = Estimated Hours ÷ 8 (working hours per day)
3. **Base Cost** = Price per sqm × Farm Size (sqm)
4. **Service Charge** = Base Cost × 5%
5. **Total Cost** = Base Cost + Delivery Fee + Service Charge

## Example Calculation

### Equipment Details:
- Price per sqm: ₱0.50
- Coverage Rate: 1,500 sqm/hr

### Rental Request:
- Farm Size: 10,000 sqm

### Calculation:
```
Estimated Hours = 10,000 ÷ 1,500 = 6.7 hours
Rental Days = 6.7 ÷ 8 = 1 day (rounded up)

Base Cost = ₱0.50 × 10,000 = ₱5,000
Service Charge = ₱5,000 × 5% = ₱250
Delivery Fee = (calculated based on distance)
Total Cost = ₱5,000 + ₱250 + Delivery Fee
```

## Benefits

### 1. More Flexible Pricing
- ✅ Owners can set competitive prices per sqm
- ✅ Reflects actual work done (area covered)
- ✅ Fair for both small and large farms

### 2. Accurate Coverage Rates
- ✅ Each equipment has its own coverage rate
- ✅ Not fixed by category
- ✅ Reflects actual equipment capability

### 3. Transparent Calculations
- ✅ Renters see price per sqm
- ✅ Clear how cost is calculated
- ✅ Easy to compare equipment prices

### 4. Minimum Farm Size
- ✅ 100 sqm minimum ensures viable rentals
- ✅ Prevents very small, unprofitable rentals

## Migration Status

```
✅ 2026_03_26_231200_change_equipment_pricing_to_per_sqm ............ [6] Ran
```

## Database Schema

### Equipment Table (Updated)
```sql
price_per_sqm DECIMAL(10,2) NOT NULL  -- Was: daily_rate
coverage_rate DECIMAL(10,2) NOT NULL DEFAULT 1500  -- New field
```

## API Response Changes

### Before:
```json
{
  "equipment": {
    "daily_rate": 1500,
    ...
  },
  "cost_breakdown": {
    "daily_rate": 1500,
    "rental_days": 1,
    "base_cost": 1500
  }
}
```

### After:
```json
{
  "equipment": {
    "price_per_sqm": 0.50,
    "coverage_rate": 1500,
    ...
  },
  "cost_breakdown": {
    "price_per_sqm": 0.50,
    "coverage_rate": 1500,
    "farm_size_sqm": 10000,
    "estimated_hours": 6.7,
    "rental_days": 1,
    "base_cost": 5000
  }
}
```

## Frontend Updates Needed

### MyEquipment.jsx
```jsx
// Form state
const [form, setForm] = useState({
  name: '', 
  category: 'tractor', 
  description: '', 
  price_per_sqm: '',      // New
  coverage_rate: '',      // New
  municipality: '', 
  barangay: '', 
  ...
});

// Form fields
<label>Price per sqm (₱)</label>
<input 
  type="number" 
  min="0" 
  step="0.01" 
  value={form.price_per_sqm}
  onChange={(e) => setForm({ ...form, price_per_sqm: e.target.value })}
  placeholder="e.g. 0.50"
/>

<label>Coverage Rate (sqm/hr)</label>
<input 
  type="number" 
  min="100" 
  step="1" 
  value={form.coverage_rate}
  onChange={(e) => setForm({ ...form, coverage_rate: e.target.value })}
  placeholder="e.g. 1500"
/>
<p className="text-xs text-gray-500">
  How many square meters your equipment can cover per hour
</p>

// Display card
<p className="text-sm font-medium text-green-700">
  ₱{parseFloat(eq.price_per_sqm).toLocaleString()}/sqm • 
  {eq.coverage_rate} sqm/hr
</p>
```

### BrowseEquipment.jsx
```jsx
// Update to show price_per_sqm and coverage_rate
<p>₱{equipment.price_per_sqm}/sqm</p>
<p>{equipment.coverage_rate} sqm/hr coverage</p>
```

## Testing Checklist

### Backend
- [x] Migration ran successfully
- [x] Equipment model updated
- [x] Validation rules updated
- [x] Rental request controller updated
- [x] Equipment controller updated
- [x] No diagnostic errors

### Frontend
- [ ] MyEquipment.jsx form updated
- [ ] Equipment display cards updated
- [ ] BrowseEquipment.jsx updated
- [ ] Rental request form updated
- [ ] Cost calculation display updated

## Next Steps

1. Fix MyEquipment.jsx syntax errors
2. Update BrowseEquipment.jsx to show new fields
3. Test equipment creation with new pricing
4. Test rental request with new calculation
5. Update any other components that display equipment pricing

## Status

**Backend:** ✅ Complete
**Frontend:** ⚠️ In Progress (syntax errors need fixing)
**Migration:** ✅ Ran successfully
**Testing:** ⏳ Pending frontend fixes

The pricing model has been successfully changed on the backend. Frontend updates are needed to complete the implementation.
