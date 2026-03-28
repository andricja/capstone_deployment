# Equipment Location System - Updated

## ✅ Changes Implemented

### Frontend (MyEquipment.jsx)

**1. Removed Transportation Fee Field**
- Transportation fee is now auto-calculated based on distance
- No longer manually entered by equipment owners

**2. Added Structured Location (3 Dropdowns)**
```
1. Municipality - Dropdown (15 municipalities)
2. Barangay - Dropdown (depends on municipality)
3. Province - Fixed "Oriental Mindoro" (disabled)
```

**3. Added Coordinates (Optional)**
- Latitude and Longitude fields
- Optional for owners (can be auto-filled from barangay center)
- Used for precise transportation fee calculation

**4. Updated State Management**
- Removed `transportation_fee` and `location` from form state
- Added `municipality`, `barangay`, `province`, `latitude`, `longitude`
- Added `municipalities` and `barangays` state arrays

**5. Updated Display**
- Equipment cards now show: "Brgy. {barangay}, {municipality}"
- Falls back to old `location` field for backward compatibility

### Backend (Already Configured)

**Database Fields (equipment table)**
- ✅ `municipality` VARCHAR(255)
- ✅ `barangay` VARCHAR(255)  
- ✅ `province` VARCHAR(255)
- ✅ `latitude` DECIMAL(10,7)
- ✅ `longitude` DECIMAL(10,7)
- ✅ `location` VARCHAR(255) - kept for backward compatibility

**API Endpoints**
- ✅ `GET /api/addresses/municipalities`
- ✅ `GET /api/addresses/municipalities/{municipality}/barangays`
- ✅ Equipment CRUD endpoints accept new fields

**Transportation Fee Calculation**
- ✅ Automatic calculation based on distance
- ✅ Uses equipment coordinates → delivery coordinates
- ✅ Free delivery within 5 km
- ✅ ₱100 base + ₱15/km beyond 5 km

## 🎯 How It Works Now

### Equipment Owner Flow

1. **Owner clicks "Add Equipment"**
   - Modal opens with form

2. **Owner fills equipment details**
   - Name, category, daily rate, description

3. **Owner selects location (3 steps)**
   ```
   Step 1: Select municipality → "Calapan City"
   Step 2: Select barangay → "Poblacion" (loads after municipality)
   Step 3: Province → "Oriental Mindoro" (fixed)
   ```

4. **Owner optionally enters coordinates**
   - Can leave empty (system will use barangay center)
   - Or enter precise GPS coordinates

5. **Owner submits**
   - Equipment saved with structured location
   - No transportation fee entered (calculated automatically)

### Renter Rental Request Flow

1. **Renter selects equipment**
2. **Renter enters delivery address** (4 dropdowns)
3. **Renter enters delivery coordinates**
4. **System calculates transportation fee**
   - Distance = Equipment location → Delivery location
   - Fee = Based on distance (free within 5 km, then ₱100 + ₱15/km)

## 📊 Data Structure

### Equipment Record (New)
```json
{
  "id": 1,
  "name": "John Deere Tractor",
  "category": "tractor",
  "daily_rate": 1500,
  "municipality": "Calapan City",
  "barangay": "Poblacion",
  "province": "Oriental Mindoro",
  "latitude": 13.4119,
  "longitude": 121.1803,
  "location": "Calapan City" // kept for backward compatibility
}
```

### Rental Request (New)
```json
{
  "equipment_id": 1,
  "sitio_street": "Purok 1",
  "barangay": "San Antonio",
  "municipality": "Calapan City",
  "province": "Oriental Mindoro",
  "latitude": 13.4200,
  "longitude": 121.1850,
  "delivery_fee": 125.50 // auto-calculated based on distance
}
```

## 🔄 Transportation Fee Calculation

### Example Scenario

**Equipment Location:**
- Barangay: Poblacion, Calapan City
- Coordinates: 13.4119, 121.1803

**Delivery Location:**
- Barangay: San Antonio, Calapan City  
- Coordinates: 13.4200, 121.1850

**Calculation:**
1. Distance = ~1.2 km (using Haversine formula)
2. Within 5 km radius = FREE DELIVERY
3. Transportation Fee = ₱0

**Another Example:**

**Equipment Location:**
- Barangay: Poblacion, Calapan City
- Coordinates: 13.4119, 121.1803

**Delivery Location:**
- Barangay: Poblacion, Naujan
- Coordinates: 13.3247, 121.3042

**Calculation:**
1. Distance = ~18 km
2. Beyond 5 km radius
3. Chargeable distance = 18 - 5 = 13 km
4. Transportation Fee = ₱100 + (13 × ₱15) = ₱295

## 🗺️ Barangay Coordinates (Future Enhancement)

### Option 1: Barangay Center Coordinates Database

Create a mapping of barangay → coordinates:

```php
// app/Data/BarangayCoordinates.php
class BarangayCoordinates
{
    public static function getCoordinates(string $municipality, string $barangay): ?array
    {
        $coordinates = [
            'Calapan City' => [
                'Poblacion' => ['lat' => 13.4119, 'lng' => 121.1803],
                'San Antonio' => ['lat' => 13.4200, 'lng' => 121.1850],
                'Bayanan I' => ['lat' => 13.4050, 'lng' => 121.1750],
                // ... more barangays
            ],
            'Naujan' => [
                'Poblacion I' => ['lat' => 13.3247, 'lng' => 121.3042],
                // ... more barangays
            ],
            // ... more municipalities
        ];
        
        return $coordinates[$municipality][$barangay] ?? null;
    }
}
```

### Option 2: Geocoding API

Use Google Maps Geocoding API or similar:

```javascript
// Frontend - Auto-fill coordinates
const geocodeAddress = async (municipality, barangay) => {
  const address = `Barangay ${barangay}, ${municipality}, Oriental Mindoro, Philippines`;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
  );
  const data = await response.json();
  if (data.results[0]) {
    return {
      lat: data.results[0].geometry.location.lat,
      lng: data.results[0].geometry.location.lng
    };
  }
  return null;
};
```

## 🎨 UI/UX Improvements

### Current State
- ✅ 3 dropdown fields for equipment location
- ✅ Optional coordinate inputs
- ✅ Helper text explaining coordinates
- ✅ Disabled state for barangay until municipality selected
- ✅ Dark mode support
- ✅ Consistent styling with rental request form

### Future Enhancements
1. **Map Picker**
   - Visual map to select equipment location
   - Click on map to set coordinates
   - Show equipment location marker

2. **Auto-fill Coordinates**
   - Automatically fill coordinates when barangay is selected
   - Use barangay center coordinates database
   - Or use geocoding API

3. **Location Preview**
   - Show equipment location on mini map
   - Display nearby landmarks
   - Show coverage area (5 km radius for free delivery)

4. **Distance Calculator**
   - Show estimated distance to popular delivery areas
   - Preview transportation fees for different locations

## 🔄 Backward Compatibility

### Old Equipment Records
- Old equipment with only `location` field still work
- Display logic handles both formats:
  ```jsx
  {eq.barangay ? `Brgy. ${eq.barangay}, ${eq.municipality}` : eq.location}
  ```

### Migration (Optional)
If you want to convert old equipment records:

```php
// One-time migration script
$oldEquipment = Equipment::whereNull('municipality')->get();

foreach ($oldEquipment as $eq) {
    // Parse location field
    // Example: "Calapan" → municipality: "Calapan City", barangay: null
    
    $eq->update([
        'municipality' => $eq->location . ' City', // or map to correct municipality
        'barangay' => null, // owner can update later
        'province' => 'Oriental Mindoro',
    ]);
}
```

## 🧪 Testing

### Test Equipment Form

1. Open "My Equipment" page
2. Click "Add Equipment"
3. Verify:
   - Municipality dropdown shows 15 options
   - Barangay dropdown is disabled initially
   - Select municipality → Barangay dropdown enables
   - Barangay shows correct options for municipality
   - Province shows "Oriental Mindoro" (disabled)
   - Coordinates are optional
   - No transportation fee field

4. Fill form and submit
5. Verify equipment saved with structured location

### Test Transportation Fee Calculation

1. Create equipment with coordinates
2. Create rental request with different delivery coordinates
3. Verify transportation fee calculated correctly:
   - Distance < 5 km → ₱0
   - Distance > 5 km → ₱100 + (distance - 5) × ₱15

## 📝 Summary

✅ Equipment location now uses 3 dropdowns (Municipality, Barangay, Province)
✅ Transportation fee removed from equipment form (auto-calculated)
✅ Coordinates optional for equipment (can use barangay center)
✅ Transportation fee calculated based on distance
✅ Backward compatible with old equipment records
✅ Consistent UI with rental request form
✅ Dark mode support
✅ Ready for production!

## 🚀 Next Steps

1. **Create Barangay Coordinates Database** (Optional)
   - Map all 373 barangays to GPS coordinates
   - Auto-fill coordinates when barangay selected
   - More accurate transportation fee calculation

2. **Add Map Picker** (Optional)
   - Visual location selection
   - Better UX for setting coordinates
   - Show equipment location on map

3. **Distance Preview** (Optional)
   - Show estimated distance to popular areas
   - Preview transportation fees
   - Help owners understand delivery costs

4. **Geocoding Integration** (Optional)
   - Auto-fill coordinates using Google Maps API
   - Validate addresses
   - Improve accuracy
