import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React/Vite environments
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom ISS Icon
const issIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -20],
});

/**
 * Helper component to smoothly pan the map to the new ISS position
 */
const MapAutoPan = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.panTo(center, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const ISSMap = ({ currentPosition, trajectory }) => {
  // trajectory should be an array of at least the last 15 positions
  // each position: { latitude, longitude }
  const polylinePositions = trajectory.map(pos => [pos.latitude, pos.longitude]);
  
  const currentCoords = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude] 
    : [0, 0];

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-500">
      <MapContainer 
        center={currentCoords} 
        zoom={3} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Path Trajectory */}
        {polylinePositions.length > 1 && (
          <Polyline 
            positions={polylinePositions} 
            color="#3b82f6" 
            weight={4} 
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        {/* Current ISS Marker */}
        {currentPosition && (
          <Marker position={currentCoords} icon={issIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-600">ISS Live Location</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Lat: {currentPosition.latitude.toFixed(4)}<br />
                  Lon: {currentPosition.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Auto-pan logic */}
        <MapAutoPan center={currentCoords} />
      </MapContainer>
    </div>
  );
};

export default ISSMap;
