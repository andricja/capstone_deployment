# HOW TO FIX MyEquipment.jsx

## Problem
The file `frontend_capstone/src/pages/owner/MyEquipment.jsx` has a syntax error on line 73-74.

## The Error
Line 73 has: `setEditing(eq);`
Line 74 has: `name: eq.name, category: eq.category, description: eq.description || '',`

This is WRONG because it's missing the function declaration and the `setForm({` call.

## How to Fix in VS Code

1. Open `frontend_capstone/src/pages/owner/MyEquipment.jsx` in VS Code
2. Go to line 73 (you can press Ctrl+G and type 73)
3. You'll see this BROKEN code:
```javascript
    setEditing(eq);
      name: eq.name, category: eq.category, description: eq.description || '',
      price_per_sqm: eq.price_per_sqm || '',
```

4. Replace those lines with this CORRECT code:
```javascript
  const openEdit = (eq) => {
    setEditing(eq);
    setForm({
      name: eq.name, 
      category: eq.category, 
      description: eq.description || '',
      price_per_sqm: eq.price_per_sqm || '',
      coverage_rate: eq.coverage_rate || '',
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

5. Save the file (Ctrl+S)
6. Refresh your browser (Ctrl+Shift+R)

## What This Does
This adds the missing `openEdit` function that allows you to edit equipment. Once fixed, the barangay auto-marker feature will work:
- Select Municipality → Marker appears at municipality center
- Select Barangay → Marker moves to barangay location (for Calapan and Naujan)
- Click map → Fine-tune exact location

## Backend is Already Complete
The backend already has:
- ✅ Barangay coordinates for 110 barangays (Calapan: 48, Naujan: 62)
- ✅ API endpoint: `/api/addresses/municipalities/{municipality}/barangays/{barangay}/coordinates`
- ✅ Auto-marker logic in the frontend code

Just fix this one syntax error and everything will work!
