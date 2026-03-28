# Transportation Fee Fields - Manual Fix Required

## Issue
The MyEquipment.jsx file has become corrupted during edits. The transportation fee fields need to be manually added.

## What Needs to Be Added

### Location in File
Add the following section in `frontend_capstone/src/pages/owner/MyEquipment.jsx` in the equipment form modal, right after the "Coverage Rate" field and before the "Description" field.

### Code to Add

```jsx
{/* Transportation Fee Settings */}
<div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
    🚚 Transportation Fee Settings
  </p>
  <div className="grid grid-cols-3 gap-3">
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Free Distance (km)
      </label>
      <input 
        type="number" 
        min="0" 
        step="0.1" 
        required 
        value={form.free_distance_km || '5'}
        onChange={(e) => setForm({ ...form, free_distance_km: e.target.value })}
        placeholder="e.g. 5"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Base Fee (₱)
      </label>
      <input 
        type="number" 
        min="0" 
        step="1" 
        required 
        value={form.base_transportation_fee || '100'}
        onChange={(e) => setForm({ ...form, base_transportation_fee: e.target.value })}
        placeholder="e.g. 100"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Per KM Rate (₱)
      </label>
      <input 
        type="number" 
        min="0" 
        step="0.1" 
        required 
        value={form.transportation_fee_per_km || '15'}
        onChange={(e) => setForm({ ...form, transportation_fee_per_km: e.target.value })}
        placeholder="e.g. 15"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
      />
    </div>
  </div>
  <p className="text-xs text-gray-500 dark:text-gray-400">
    Example: Free within {form.free_distance_km || 5} km, then ₱{form.base_transportation_fee || 100} + ₱{form.transportation_fee_per_km || 15}/km beyond that
  </p>
</div>
```

### Form State Updates

1. **Initial form state** - Update the `useState` initialization:
```jsx
const [form, setForm] = useState({
  name: '', category: 'tractor', description: '', 
  price_per_sqm: '', coverage_rate: '',
  transportation_fee_per_km: '15', 
  free_distance_km: '5', 
  base_transportation_fee: '100',
  municipality: '', barangay: '', province: 'Oriental Mindoro',
  latitude: '', longitude: '', image: null,
});
```

2. **openAdd function** - Update to include transportation fee fields:
```jsx
const openAdd = () => {
  setEditing(null);
  setForm({ 
    name: '', category: 'tractor', description: '', 
    price_per_sqm: '', coverage_rate: '',
    transportation_fee_per_km: '15', 
    free_distance_km: '5', 
    base_transportation_fee: '100',
    municipality: '', barangay: '', province: 'Oriental Mindoro',
    latitude: '', longitude: '', image: null 
  });
  setBarangays([]);
  setShowModal(true);
};
```

3. **openEdit function** - Update to include transportation fee fields:
```jsx
const openEdit = (eq) => {
  setEditing(eq);
  setForm({
    name: eq.name, 
    category: eq.category, 
    description: eq.description || '',
    price_per_sqm: eq.price_per_sqm || '',
    coverage_rate: eq.coverage_rate || '',
    transportation_fee_per_km: eq.transportation_fee_per_km || '15',
    free_distance_km: eq.free_distance_km || '5',
    base_transportation_fee: eq.base_transportation_fee || '100',
    municipality: eq.municipality || '', 
    barangay: eq.barangay || '',
    province: eq.province || 'Oriental Mindoro',
    latitude: eq.latitude || '',
    longitude: eq.longitude || '',
    image: null,
  });
  setShowModal(true);
};
```

## Visual Result

After adding these fields, the Add Equipment form will show:

```
Equipment Name: [input]
Category: [dropdown]

Price per sqm (₱): [input]  |  Coverage Rate (sqm/hr): [input]
Coverage rate: How many square meters your equipment can cover per hour

─────────────────────────────────────────────────────────
🚚 Transportation Fee Settings

Free Distance (km): [5]  |  Base Fee (₱): [100]  |  Per KM Rate (₱): [15]
Example: Free within 5 km, then ₱100 + ₱15/km beyond that
─────────────────────────────────────────────────────────

Description: [textarea]
...
```

## Backend Already Complete

The backend is already set up to handle these fields:
- ✅ Database migration created
- ✅ Model updated
- ✅ Validation rules added
- ✅ Controller logic updated
- ✅ Fee calculation uses owner's settings

## To Test

1. Add the code above to MyEquipment.jsx
2. Run the migration: `php artisan migrate`
3. Go to Owner Dashboard → My Equipment
4. Click "Add Equipment"
5. You should see the three transportation fee fields
6. Fill in the form and submit
7. The equipment will be saved with your custom transportation fee settings

## Default Values

- Free Distance: 5 km
- Base Fee: ₱100
- Per KM Rate: ₱15/km

These defaults match the previous system-wide settings, so existing behavior is preserved while giving owners the flexibility to customize.
