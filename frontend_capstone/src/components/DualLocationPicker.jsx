import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for equipment location (green)
const equipmentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for delivery location (red)
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks and fit bounds
function MapController({ equipmentPosition, deliveryPosition, setDeliveryPosition }) {
  const map = useMap();

  // Handle map clicks to set delivery location
  useEffect(() => {
    const handleClick = (e) => {
      setDeliveryPosition([e.latlng.lat, e.latlng.lng]);
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, setDeliveryPosition]);

  // Fit bounds to show both markers
  useEffect(() => {
    if (equipmentPosition && deliveryPosition) {
      const bounds = L.latLngBounds([equipmentPosition, deliveryPosition]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (equipmentPosition) {
      map.setView(equipmentPosition, 13);
    }
  }, [map, equipmentPosition, deliveryPosition]);

  return null;
}

// Fetch route from backend API
async function fetchRoute(start, end) {
  try {
    const response = await fetch('/api/routing/get-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        start_lat: start[0],
        start_lng: start[1],
        end_lat: end[0],
        end_lng: end[1],
      }),
    });
    
    if (!response.ok) {
      throw new Error('Routing service unavailable');
    }
    
    const data = await response.json();
    
    if (data.success && data.path && data.path.length > 0) {
      return {
        route: data.path,
        distance: data.distance,
        type: data.type,
      };
    }
    
    // Fallback data from backend
    return {
      route: data.path || null,
      distance: data.distance,
      type: 'straight',
    };
  } catch (error) {
    console.error('Route fetch error:', error);
    return null;
  }
}

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate transportation fee using equipment owner's settings
function calculateFee(distance, freeDistanceKm = 5, baseFee = 100, perKmRate = 15) {
  if (distance <= freeDistanceKm) {
    return 0;
  }
  
  const billableDistance = distance - freeDistanceKm;
  return baseFee + (billableDistance * perKmRate);
}

export default function DualLocationPicker({ 
  equipmentLatitude, 
  equipmentLongitude,
  equipmentName,
  deliveryLatitude, 
  deliveryLongitude,
  freeDistanceKm = 5,
  baseFee = 100,
  perKmRate = 15,
  onChange,
  onFeeCalculated // New callback to pass fee back to parent
}) {
  const equipmentPosition = equipmentLatitude && equipmentLongitude 
    ? [parseFloat(equipmentLatitude), parseFloat(equipmentLongitude)]
    : null;

  const [deliveryPosition, setDeliveryPosition] = useState(
    deliveryLatitude && deliveryLongitude 
      ? [parseFloat(deliveryLatitude), parseFloat(deliveryLongitude)]
      : null
  );

  const [routePath, setRoutePath] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeType, setRouteType] = useState('straight');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Calculate distance and fee
  // ALWAYS use straight-line distance (Haversine) to match backend calculation
  // OSRM route is only for visual display, not for fee calculation
  const distance = (equipmentPosition && deliveryPosition
    ? calculateDistance(
        equipmentPosition[0], equipmentPosition[1],
        deliveryPosition[0], deliveryPosition[1]
      )
    : null);

  const fee = distance ? calculateFee(distance, freeDistanceKm, baseFee, perKmRate) : null;

  // Notify parent component when fee changes
  useEffect(() => {
    if (onFeeCalculated && fee !== null) {
      onFeeCalculated(fee);
    }
  }, [fee, onFeeCalculated]);

  useEffect(() => {
    if (deliveryLatitude && deliveryLongitude) {
      setDeliveryPosition([parseFloat(deliveryLatitude), parseFloat(deliveryLongitude)]);
    }
  }, [deliveryLatitude, deliveryLongitude]);

  useEffect(() => {
    if (deliveryPosition && Array.isArray(deliveryPosition)) {
      const lat = deliveryPosition[0].toFixed(7);
      const lng = deliveryPosition[1].toFixed(7);
      
      // Only call onChange if values actually changed
      if (lat !== deliveryLatitude || lng !== deliveryLongitude) {
        onChange({
          latitude: lat,
          longitude: lng,
        });
      }
    }
  }, [deliveryPosition, deliveryLatitude, deliveryLongitude]); // Don't include onChange

  // Fetch route when both positions are set (with debouncing)
  useEffect(() => {
    if (!equipmentPosition || !deliveryPosition) {
      setRoutePath(null);
      setRouteDistance(null);
      setRouteType('straight');
      return;
    }

    // Debounce route fetching to avoid too many API calls
    const timeoutId = setTimeout(() => {
      setIsLoadingRoute(true);
      fetchRoute(equipmentPosition, deliveryPosition)
        .then(result => {
          if (result && result.route) {
            setRoutePath(result.route);
            setRouteDistance(result.distance);
            setRouteType(result.type || 'straight');
          } else {
            // Fallback to straight line
            setRoutePath(null);
            setRouteDistance(null);
            setRouteType('straight');
          }
        })
        .catch(error => {
          console.error('Error fetching route:', error);
          setRoutePath(null);
          setRouteDistance(null);
          setRouteType('straight');
        })
        .finally(() => {
          setIsLoadingRoute(false);
        });
    }, 800); // Wait 800ms before fetching route

    return () => clearTimeout(timeoutId);
  }, [equipmentPosition, deliveryPosition]);

  if (!equipmentPosition) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ Equipment location not available. Please contact the equipment owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Delivery Location (Click on Map) <span className="text-red-500">*</span>
      </label>
      
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <MapContainer
          center={equipmentPosition}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Equipment Location Marker (Fixed - Green) */}
          <Marker position={equipmentPosition} icon={equipmentIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-green-700">📍 Equipment Location</strong>
                <p className="mt-1">{equipmentName || 'Equipment'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {equipmentPosition[0].toFixed(6)}, {equipmentPosition[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Delivery Location Marker (Movable - Red) */}
          {deliveryPosition && (
            <Marker position={deliveryPosition} icon={deliveryIcon}>
              <Popup>
                <div className="text-sm">
                  <strong className="text-red-700">📍 Delivery Location</strong>
                  <p className="text-xs text-gray-600 mt-1">
                    {deliveryPosition[0].toFixed(6)}, {deliveryPosition[1].toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Red line connecting both locations - follows roads when available */}
          {deliveryPosition && (
            <Polyline
              positions={routePath && routePath.length > 2 ? routePath : [equipmentPosition, deliveryPosition]}
              color="#ef4444"
              weight={3}
              opacity={0.8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          <MapController
            equipmentPosition={equipmentPosition}
            deliveryPosition={deliveryPosition}
            setDeliveryPosition={setDeliveryPosition}
          />
        </MapContainer>
      </div>

      {/* Distance and Fee Information */}
      {deliveryPosition && distance !== null && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Equipment Location
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Delivery Location
            </span>
          </div>
          <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Distance (straight-line):
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {distance.toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Transportation Fee:</span>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                ₱{fee.toFixed(2)}
                {fee === 0 && <span className="text-xs ml-1">(FREE)</span>}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Fee calculated using straight-line distance
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-blue-600 dark:text-blue-400">
        🗺️ <strong>Green marker</strong> = Equipment location (fixed) • <strong>Red marker</strong> = Your delivery location (click map to set)
      </p>
      
      {!deliveryPosition && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Please click on the map to set your delivery location
        </p>
      )}
    </div>
  );
}
