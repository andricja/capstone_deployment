import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when position changes
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);
  return null;
}

// Component to handle map clicks and display marker
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LocationPicker({ latitude, longitude, onChange, label = "Select Location on Map" }) {
  // Default center: Oriental Mindoro (Calapan City)
  const defaultCenter = [13.4119, 121.1803];
  
  // Track if position was set by user click or by props
  const userClickedRef = useRef(false);
  
  // Initialize position from props
  const getInitialPosition = () => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    return null;
  };

  const [position, setPosition] = useState(getInitialPosition);

  // Update position when latitude/longitude props change
  useEffect(() => {
    console.log('LocationPicker received coordinates:', latitude, longitude);
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('Setting position to:', [lat, lng]);
        userClickedRef.current = false; // Mark as prop update, not user click
        setPosition([lat, lng]);
      }
    } else if (latitude === '' && longitude === '') {
      // Clear position if coordinates are cleared
      setPosition(null);
    }
  }, [latitude, longitude]);

  // Custom setPosition that marks user clicks
  const handlePositionChange = (newPosition) => {
    userClickedRef.current = true; // Mark as user click
    setPosition(newPosition);
  };

  // Notify parent ONLY when position changes from user click
  useEffect(() => {
    if (position && userClickedRef.current && onChange) {
      const [lat, lng] = position;
      const newLat = lat.toFixed(7);
      const newLng = lng.toFixed(7);
      
      // Only call onChange if coordinates actually changed
      if (newLat !== latitude || newLng !== longitude) {
        onChange({
          latitude: newLat,
          longitude: newLng,
        });
      }
    }
  }, [position]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} <span className="text-red-500">*</span>
      </label>
      
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <MapContainer
          center={position || defaultCenter}
          zoom={13}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap position={position} />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      {position && (
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium">Selected Location:</span> {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}
      
      <p className="text-xs text-blue-600 dark:text-blue-400">
        📍 Click anywhere on the map to set your location. This will be used for transportation fee calculation.
      </p>
    </div>
  );
}
