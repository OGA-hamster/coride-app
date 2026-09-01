'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const startIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="%237FE0BE" stroke="%230D1B1B" stroke-width="2"/></svg>'.replace(/%/g, '%25')),
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const endIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="%23FF6B4A" stroke="%230D1B1B" stroke-width="2"/></svg>'.replace(/%/g, '%25')),
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const geocodeCache = {};

async function geocode(placeName) {
  if (geocodeCache[placeName]) return geocodeCache[placeName];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[placeName] = coords;
      return coords;
    }
  } catch (e) {
    console.error('Geocoding failed', e);
  }
  return null;
}

export default function RouteMap({ routes, profilesById, onConnect }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPoints() {
      const results = [];
      for (const r of routes) {
        const start = await geocode(r.start_point);
        const end = await geocode(r.end_point);
        if (start && end) {
          results.push({ route: r, start, end });
        }
        await new Promise(res => setTimeout(res, 300));
      }
      setPoints(results);
      setLoading(false);
    }
    loadPoints();
  }, [routes]);

  if (loading) {
    return <p className="empty-state">Placing routes on the map…</p>;
  }

  if (points.length === 0) {
    return <p className="empty-state">Couldn't locate any of these routes on the map.</p>;
  }

  const center = [points[0].start.lat, points[0].start.lng];

  return (
    <div style={{ height: '60vh', minHeight: 380, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ route, start, end }) => {
          const p = profilesById[route.user_id];
          return (
            <div key={route.id}>
              <Marker position={[start.lat, start.lng]} icon={startIcon}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <b>{p?.full_name || 'Rider'}</b>
                    <div style={{ fontSize: 12, margin: '4px 0' }}>
                      {route.start_point} → {route.end_point}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Pickup · {route.pickup_time}</div>
                    <button
                      onClick={() => onConnect(route)}
                      style={{
                        background: '#FF6B4A',
                        color: '#081313',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Message to connect
                    </button>
                  </div>
                </Popup>
              </Marker>
              <Marker position={[end.lat, end.lng]} icon={endIcon} />
              <Polyline positions={[[start.lat, start.lng], [end.lat, end.lng]]} pathOptions={{ color: '#FF6B4A', weight: 2, dashArray: '6 6' }} />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}