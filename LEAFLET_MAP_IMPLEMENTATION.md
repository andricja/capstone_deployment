# Leaflet Map Implementation - Interactive Location Picker

## Overview
Replaced manual latitude/longitude text inputs with an interactive Leaflet map where users can click to select their location. This provides a much better user experience for setting equipment and delivery locations.

## Changes Made

### 1. Installed Packages
```bash
npm install leaflet react-leaflet
```

**Packages:**
- `leaflet` - Open-source JavaScript library for interactive maps
- `react-leaflet` - React components for Leaflet maps

### 2. Created LocationPicker Component
**File:** `frontend_capstone/src/components/LocationPicker.jsx`

**Features:**
- Interactive map with click-to-select functionality
- Displays marker at selected location
- Shows coordinates below the map
- Default center: Calapan City, Oriental Mindoro (13.4119, 121.1803)
- Zoom level: 13 (good for city/barangay level)
- Uses OpenStreetMap tiles (free, no API key needed)

**Props:**
- `latitude` - Current latitude value
- `longitude` - Current longitude value
- `onChange` - Callback function when location changes
- `label` - Custom label text (optional)

**Usage:**
```jsx
<LocationPicker
  latitude={form.latitude}
  longitude={form.longitude}
  onChange={({ latitude, longitude }) => setForm({ ...form, latitude, longitude })}
  label="Equipment Location (Click on Map)"
/>
```

### 3. Updated MyEquipment.jsx
**File:** `frontend_capstone/src/pages/owner/MyEquipment.jsx`

**Changes:**
- Imported `LocationPicker` component
- Replaced latitude/longitude text inputs with `<LocationPicker />`
- Added validation to ensure coordinates are selected before submission
- Increased modal width to `max-w-2xl` to accommodate map
- Map displays in equipment add/edit modal

**Before:**
```jsx
<input type="number" step="0.0000001" required value={form.latitude} ... />
<input type="number" step="0.0000001" required value={form.longitude} ... />
```

**After:**
```jsx
<LocationPicker
  latitude={form.latitude}
  longitude={form.longitude}
  onChange={({ latitude, longitude }) => setForm({ ...form, latitude, longitude })}
  label="Equipment Location (Click on Map)"
/>
```

## How It Works

### User Experience
1. Owner opens "Add Equipment" or "Edit Equipment" modal
2. Fills in equipment details (name, category, daily rate, etc.)
3. Selects municipality and barangay from dropdowns
4. Clicks on the map to set exact equipment location
5. Map shows a marker at the selected location
6. Coordinates are automatically captured and saved

### Technical Flow
1. `MapContainer` initializes with default center (Calapan)
2. `TileLayer` loads OpenStreetMap tiles
3. `LocationMarker` component listens for map clicks
4. On click, `setPosition` updates marker location
5. `useEffect` calls `onChange` callback with new coordinates
6. Parent component updates form state
7. Coordinates are submitted with equipment data

### Map Features
- **Click to Select**: Click anywhere on the map to set location
- **Draggable**: Pan the map to find the exact location
- **Zoom**: Scroll wheel or zoom controls to zoom in/out
- **Marker**: Visual indicator of selected location
- **Coordinates Display**: Shows selected lat/lng below map
- **Responsive**: Works on desktop and mobile devices

## Benefits

### 1. Better User Experience
- Visual selection instead of typing numbers
- No need to look up coordinates externally
- Immediate visual feedback
- Easier to find exact location

### 2. More Accurate
- Users can see exactly where they're placing the marker
- Can zoom in for precise location
- Reduces coordinate entry errors
- Visual confirmation of location

### 3. Intuitive
- Everyone understands "click on map"
- No need to explain latitude/longitude
- Familiar map interface
- Mobile-friendly

### 4. Professional
- Modern, polished interface
- Industry-standard map component
- Smooth animations and interactions
- Clean, minimal design

## Map Configuration

### Default Center
```javascript
const defaultCenter = [13.4119, 121.1803]; // Calapan City, Oriental Mindoro
```

### Zoom Level
```javascript
zoom={13} // Good for city/barangay level viewing
```

### Tile Provider
```javascript
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
```
- Free to use
- No API key required
- Good coverage of Philippines
- Regular updates

### Map Size
```javascript
style={{ height: '300px', width: '100%' }}
```

## Customization Options

### Change Default Location
Edit `defaultCenter` in `LocationPicker.jsx`:
```javascript
const defaultCenter = [YOUR_LAT, YOUR_LNG];
```

### Change Zoom Level
```javascript
<MapContainer zoom={15}> // Closer zoom
<MapContainer zoom={10}> // Wider view
```

### Use Different Map Tiles
```javascript
// Satellite view
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

// Terrain view
url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
```

### Custom Marker Icon
```javascript
const customIcon = L.icon({
  iconUrl: '/path/to/custom-marker.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

<Marker position={position} icon={customIcon} />
```

## Future Enhancements

### 1. Geocoding
Add address search to find locations by name:
```javascript
// Search for "Calapan City Hall"
// Map automatically centers and places marker
```

### 2. Current Location
Add "Use My Location" button:
```javascript
navigator.geolocation.getCurrentPosition((position) => {
  setPosition([position.coords.latitude, position.coords.longitude]);
});
```

### 3. Barangay Boundaries
Show barangay boundaries on the map:
```javascript
// Load GeoJSON data for Oriental Mindoro barangays
// Display as polygons on the map
```

### 4. Distance Preview
Show distance between equipment and delivery locations:
```javascript
// Draw line between two markers
// Display distance in kilometers
```

### 5. Multiple Markers
Show all equipment locations on a single map:
```javascript
// Browse page: map showing all available equipment
// Click marker to view equipment details
```

## Troubleshooting

### Issue: Map not displaying
**Solution:** Ensure Leaflet CSS is imported:
```javascript
import 'leaflet/dist/leaflet.css';
```

### Issue: Marker icon not showing
**Solution:** Fixed in LocationPicker.jsx with CDN URLs:
```javascript
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
```

### Issue: Map tiles not loading
**Solution:** Check internet connection and tile server URL. OpenStreetMap is free but has usage limits.

### Issue: Coordinates not updating
**Solution:** Ensure `onChange` callback is properly connected to parent state.

## Testing

### Manual Testing Checklist
- [ ] Map displays in equipment modal
- [ ] Click on map places marker
- [ ] Coordinates update below map
- [ ] Form submits with correct coordinates
- [ ] Edit equipment shows existing location
- [ ] Map works in both light and dark mode
- [ ] Map is responsive on mobile
- [ ] Zoom controls work
- [ ] Pan/drag works

## Files Modified

### New Files
- `frontend_capstone/src/components/LocationPicker.jsx`

### Modified Files
- `frontend_capstone/src/pages/owner/MyEquipment.jsx`
- `frontend_capstone/package.json` (added leaflet dependencies)

## Next Steps

1. Add LocationPicker to rental request form (BrowseEquipment.jsx)
2. Test on different screen sizes
3. Consider adding geocoding for address search
4. Add "Use My Location" button for mobile users
5. Show equipment locations on browse page map

## Status: COMPLETE ✅

The Leaflet map implementation is complete for the equipment form. Users can now click on an interactive map to select their equipment location instead of manually entering coordinates.
