# Structured Address System for Oriental Mindoro

## Overview

The delivery address system now uses 4 dropdown fields instead of a single text input:
1. **Sitio/Street** - Free text input for specific location
2. **Barangay** - Dropdown (depends on municipality)
3. **Municipality** - Dropdown (15 municipalities)
4. **Province** - Fixed as "Oriental Mindoro"

## Database Changes

### New Fields in `rental_requests` Table

```sql
sitio_street VARCHAR(255)    -- Street name or sitio
barangay VARCHAR(255)         -- Barangay name
municipality VARCHAR(255)     -- Municipality name
province VARCHAR(255)         -- Default: "Oriental Mindoro"
delivery_address VARCHAR(500) -- Auto-generated full address
```

**Migration**: `2026_03_26_012029_add_structured_address_to_rental_requests_table.php`

## API Endpoints

### 1. Get All Municipalities

**Endpoint**: `GET /api/addresses/municipalities`

**Response**:
```json
{
  "municipalities": [
    "Baco",
    "Bansud",
    "Bongabong",
    "Bulalacao",
    "Calapan City",
    "Gloria",
    "Mansalay",
    "Naujan",
    "Pinamalayan",
    "Pola",
    "Puerto Galera",
    "Roxas",
    "San Teodoro",
    "Socorro",
    "Victoria"
  ]
}
```

### 2. Get Barangays for Municipality

**Endpoint**: `GET /api/addresses/municipalities/{municipality}/barangays`

**Example**: `GET /api/addresses/municipalities/Calapan City/barangays`

**Response**:
```json
{
  "municipality": "Calapan City",
  "barangays": [
    "Balingayan",
    "Balite",
    "Baruyan",
    "Batino",
    "Bayanan I",
    "Bayanan II",
    ...
  ]
}
```

### 3. Get Complete Address Data

**Endpoint**: `GET /api/addresses/complete`

**Response**:
```json
{
  "province": "Oriental Mindoro",
  "municipalities": {
    "Baco": ["Alag", "Bangkatan", "Baras", ...],
    "Bansud": ["Alcadesma", "Bato", "Conrazon", ...],
    "Calapan City": ["Balingayan", "Balite", ...],
    ...
  }
}
```

## Frontend Implementation

### Step 1: Fetch Address Data on Component Mount

```javascript
import { useState, useEffect } from 'react';
import api from '../lib/api';

function RentalRequestForm() {
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  
  // Load municipalities on mount
  useEffect(() => {
    api.get('/addresses/municipalities')
      .then(res => setMunicipalities(res.data.municipalities))
      .catch(err => console.error(err));
  }, []);
  
  // Load barangays when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      api.get(`/addresses/municipalities/${selectedMunicipality}/barangays`)
        .then(res => setBarangays(res.data.barangays))
        .catch(err => console.error(err));
    } else {
      setBarangays([]);
    }
  }, [selectedMunicipality]);
  
  return (
    // Form JSX below
  );
}
```

### Step 2: Create Form with 4 Dropdowns

```jsx
<form onSubmit={handleSubmit}>
  {/* 1. Sitio/Street (Free Text) */}
  <div>
    <label>Sitio/Street/House Number</label>
    <input
      type="text"
      name="sitio_street"
      placeholder="e.g., Purok 1, Sitio Maligaya"
      required
    />
  </div>

  {/* 2. Municipality (Dropdown) */}
  <div>
    <label>Municipality</label>
    <select
      name="municipality"
      value={selectedMunicipality}
      onChange={(e) => {
        setSelectedMunicipality(e.target.value);
        setFormData({...formData, municipality: e.target.value, barangay: ''});
      }}
      required
    >
      <option value="">Select Municipality</option>
      {municipalities.map(mun => (
        <option key={mun} value={mun}>{mun}</option>
      ))}
    </select>
  </div>

  {/* 3. Barangay (Dropdown - depends on municipality) */}
  <div>
    <label>Barangay</label>
    <select
      name="barangay"
      disabled={!selectedMunicipality}
      required
    >
      <option value="">Select Barangay</option>
      {barangays.map(brgy => (
        <option key={brgy} value={brgy}>{brgy}</option>
      ))}
    </select>
  </div>

  {/* 4. Province (Fixed/Display Only) */}
  <div>
    <label>Province</label>
    <input
      type="text"
      value="Oriental Mindoro"
      disabled
      className="bg-gray-100"
    />
  </div>

  {/* Other fields... */}
  <button type="submit">Submit Rental Request</button>
</form>
```

### Step 3: Submit with Structured Address

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('equipment_id', equipmentId);
  formData.append('farm_size_sqm', farmSize);
  formData.append('start_date', startDate);
  formData.append('contact_number', contactNumber);
  
  // Structured address fields
  formData.append('sitio_street', sitioStreet);
  formData.append('barangay', barangay);
  formData.append('municipality', municipality);
  formData.append('province', 'Oriental Mindoro');
  
  // Coordinates (from map picker)
  formData.append('latitude', latitude);
  formData.append('longitude', longitude);
  
  formData.append('payment_method', paymentMethod);
  if (paymentProof) {
    formData.append('payment_proof', paymentProof);
  }
  
  try {
    const response = await api.post('/renter/rental-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('Success:', response.data);
    // Full address is auto-generated: "Purok 1, Barangay Poblacion, Calapan City, Oriental Mindoro"
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

## Backend Processing

### Auto-Generated Full Address

The backend automatically combines the structured fields into a full address:

```php
$fullAddress = "{$sitioStreet}, Barangay {$barangay}, {$municipality}, {$province}";
// Example: "Purok 1, Barangay Poblacion, Calapan City, Oriental Mindoro"
```

This is stored in the `delivery_address` field for display purposes.

## Validation

### Request Validation Rules

```php
'sitio_street'  => ['required', 'string', 'max:255'],
'barangay'      => ['required', 'string', 'max:255'],
'municipality'  => ['required', 'string', 'max:255'],
'province'      => ['nullable', 'string', 'max:255'],
'latitude'      => ['required', 'numeric', 'between:-90,90'],
'longitude'     => ['required', 'numeric', 'between:-180,180'],
```

### Custom Validation (Optional)

You can add custom validation to ensure valid municipality/barangay combinations:

```php
use App\Data\OrientalMindoroAddresses;

$request->validate([
    'municipality' => [
        'required',
        function ($attribute, $value, $fail) {
            if (!OrientalMindoroAddresses::isValidMunicipality($value)) {
                $fail('Invalid municipality selected.');
            }
        },
    ],
    'barangay' => [
        'required',
        function ($attribute, $value, $fail) use ($request) {
            $municipality = $request->input('municipality');
            if (!OrientalMindoroAddresses::isValidBarangay($municipality, $value)) {
                $fail('Invalid barangay for the selected municipality.');
            }
        },
    ],
]);
```

## Data Source

All municipality and barangay data is stored in:
`app/Data/OrientalMindoroAddresses.php`

### Municipalities Included (15 total):
1. Baco (27 barangays)
2. Bansud (12 barangays)
3. Bongabong (27 barangays)
4. Bulalacao (14 barangays)
5. Calapan City (62 barangays)
6. Gloria (25 barangays)
7. Mansalay (14 barangays)
8. Naujan (57 barangays)
9. Pinamalayan (30 barangays)
10. Pola (23 barangays)
11. Puerto Galera (13 barangays)
12. Roxas (18 barangays)
13. San Teodoro (8 barangays)
14. Socorro (18 barangays)
15. Victoria (25 barangays)

**Total**: 373 barangays

## Display in UI

### Rental Request Card/Table

```jsx
<div className="address-display">
  <p className="font-semibold">Delivery Address:</p>
  <p>{rental.delivery_address}</p>
  
  {/* Or show structured */}
  <div className="text-sm text-gray-600">
    <p>Sitio/Street: {rental.sitio_street}</p>
    <p>Barangay: {rental.barangay}</p>
    <p>Municipality: {rental.municipality}</p>
    <p>Province: {rental.province}</p>
  </div>
</div>
```

### Compact Display

```jsx
<p className="text-sm">
  📍 {rental.sitio_street}, Brgy. {rental.barangay}, {rental.municipality}
</p>
```

## Benefits

1. **Standardized Data**: Consistent address format across all rentals
2. **Easy Filtering**: Filter rentals by municipality or barangay
3. **Better UX**: Dropdowns prevent typos and invalid addresses
4. **Analytics**: Track popular delivery locations
5. **Validation**: Ensure valid municipality/barangay combinations
6. **Searchable**: Easy to search by specific location components

## Migration from Old System

### Backward Compatibility

- Old rental requests with only `delivery_address` will still work
- New fields are nullable in database
- Frontend should handle both old and new format

### Data Migration (Optional)

If you want to parse old addresses into structured format:

```php
// Run once to migrate old data
$oldRentals = RentalRequest::whereNull('municipality')->get();

foreach ($oldRentals as $rental) {
    // Parse delivery_address and extract components
    // This is manual work based on your address format
    // Example: "Purok 1, Barangay Poblacion, Calapan City, Oriental Mindoro"
    
    $parts = explode(',', $rental->delivery_address);
    if (count($parts) >= 4) {
        $rental->update([
            'sitio_street' => trim($parts[0]),
            'barangay' => str_replace('Barangay ', '', trim($parts[1])),
            'municipality' => trim($parts[2]),
            'province' => trim($parts[3]),
        ]);
    }
}
```

## Testing

### Test Address API

```bash
# Get municipalities
curl http://localhost:8000/api/addresses/municipalities

# Get barangays for Calapan City
curl http://localhost:8000/api/addresses/municipalities/Calapan%20City/barangays

# Get complete data
curl http://localhost:8000/api/addresses/complete
```

### Test Rental Request

```bash
curl -X POST http://localhost:8000/api/renter/rental-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "equipment_id=1" \
  -F "farm_size_sqm=5000" \
  -F "start_date=2026-04-01" \
  -F "contact_number=09123456789" \
  -F "sitio_street=Purok 1" \
  -F "barangay=Poblacion" \
  -F "municipality=Calapan City" \
  -F "province=Oriental Mindoro" \
  -F "latitude=13.4119" \
  -F "longitude=121.1803" \
  -F "payment_method=gcash"
```

## Future Enhancements

1. **Geocoding**: Auto-fill coordinates based on selected address
2. **Address Autocomplete**: Type-ahead search for barangays
3. **Popular Locations**: Show frequently used addresses
4. **Address Book**: Save delivery addresses for reuse
5. **Map Integration**: Show selected location on map
6. **Distance Calculator**: Show distance from equipment location

## Summary

✅ 4-field structured address system implemented
✅ 15 municipalities with 373 barangays
✅ API endpoints for address data
✅ Auto-generated full address
✅ Validation rules updated
✅ Backward compatible with old system
✅ Ready for frontend integration
