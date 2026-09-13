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
  
  // State for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          View Fullscreen
        </button>
      </div>
      
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

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-900">
            <h3 className="text-white text-lg font-semibold">Select Location on Map</h3>
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-white hover:text-gray-300 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1">
            <MapContainer
              center={position || defaultCenter}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
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
            <div className="p-4 bg-gray-900 text-white text-center">
              <span className="font-medium">Selected:</span> {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
