'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const currentIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <circle cx="20" cy="20" r="12" fill="#FF6B4A" stroke="#ffffff" stroke-width="4"/>
        <circle cx="20" cy="20" r="5" fill="#ffffff"/>
      </svg>
    `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <circle cx="20" cy="20" r="12" fill="#7FE0BE" stroke="#081313" stroke-width="3"/>
      </svg>
    `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapCenter({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, {
        duration: 1.2,
      });
    }
  }, [location, map]);

  return null;
}

export default function PostRouteMap({
  currentLocation,
  destination,
  onMapClick,
}) {
  const defaultCenter = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [20.5937, 78.9629];

  return (
    <div
      style={{
        height: 360,
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid var(--line)',
        marginTop: 16,
        position: 'relative',
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={currentLocation ? 14 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        onClick={(e) => {
          if (onMapClick) {
            onMapClick({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
            });
          }
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentLocation && (
          <>
            <MapCenter location={currentLocation} />

            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentIcon}
            >
              <Popup>
                <strong>📍 Your location</strong>
                <br />
                Current pickup point
              </Popup>
            </Marker>
          </>
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          >
            <Popup>
              <strong>🏁 Destination</strong>
            </Popup>
          </Marker>
        )}

        {currentLocation && destination && (
          <Polyline
            positions={[
              [currentLocation.lat, currentLocation.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{
              color: '#FF6B4A',
              weight: 4,
              dashArray: '8 8',
            }}
          />
        )}
      </MapContainer>

      {!currentLocation && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 500,
          }}
        >
          <div
            style={{
              background: 'rgba(8, 19, 19, 0.9)',
              padding: '12px 18px',
              borderRadius: 12,
              fontSize: 13,
            }}
          >
            📍 Use your current location to start
          </div>
        </div>
      )}
    </div>
  );
}