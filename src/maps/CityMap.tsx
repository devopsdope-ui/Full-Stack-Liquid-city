/**
 * CityMap — Leaflet/OpenStreetMap (free, no API key required)
 *
 * Replaces the previous Google Maps implementation.
 * Uses react-leaflet with OpenStreetMap tiles.
 */
import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  status?: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'available' | 'occupied';
  type?: 'event' | 'restaurant' | 'hotel' | 'transport' | 'crowd' | 'user' | 'gate' | 'exit';
  detail?: Record<string, string | number>;
}

export interface CityMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarkerData[];
  onMarkerClick?: (marker: MapMarkerData) => void;
  className?: string;
  showTraffic?: boolean;
}

// ─── Colour mapping ───────────────────────────────────────────────────────────

function markerColor(status?: string, type?: string): string {
  if (type === 'user') return '#000000';
  if (type === 'event') return '#6366F1';
  if (type === 'gate') return '#0EA5E9';
  if (type === 'exit') return '#F97316';
  switch (status) {
    case 'NORMAL':
    case 'available':  return '#22C55E';
    case 'MODERATE':   return '#F59E0B';
    case 'HIGH':
    case 'CRITICAL':
    case 'occupied':   return '#EF4444';
    default:           return '#6B7280';
  }
}

function markerLabel(type?: string): string {
  const labels: Record<string, string> = {
    event: '🎪', restaurant: '🍽️', hotel: '🏨',
    transport: '🚌', crowd: '👥', user: '📍',
    gate: '🚪', exit: '🚨',
  };
  return labels[type || ''] || '📍';
}

function makeIcon(status?: string, type?: string): L.DivIcon {
  const color = markerColor(status, type);
  const emoji = markerLabel(type);
  const size = type === 'user' ? 36 : 32;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${color};
        border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.45}px;
      ">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

// ─── Helper: recenter map when center prop changes ────────────────────────────

function Recenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center.lat, center.lng, map]);
  return null;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function statusBadge(status?: string): string {
  const map: Record<string, string> = {
    NORMAL: '🟢 NORMAL', MODERATE: '🟡 MODERATE',
    HIGH: '🟠 HIGH', CRITICAL: '🔴 CRITICAL',
    available: '🟢 AVAILABLE', occupied: '🔴 OCCUPIED',
  };
  return map[status || ''] || (status || '');
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CityMap({
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 14,
  markers = [],
  onMarkerClick,
  className = 'w-full h-full',
}: CityMapProps) {
  return (
    <div className={className} style={{ minHeight: 300 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
        zoomControl
        scrollWheelZoom
      >
        <Recenter center={center} />

        <LayersControl position="topright">
          {/* Base tile: OpenStreetMap — completely free */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* Alternative: CartoDB light — clean, fast, free */}
          <LayersControl.BaseLayer name="CartoDB Light">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={makeIcon(m.status, m.type)}
            eventHandlers={{
              click: () => onMarkerClick?.(m),
            }}
          >
            <Popup>
              <div style={{ minWidth: 160, fontFamily: 'system-ui' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.title}</div>
                {m.subtitle && (
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>{m.subtitle}</div>
                )}
                {m.status && (
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    {statusBadge(m.status)}
                  </div>
                )}
                {m.detail &&
                  Object.entries(m.detail).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{k}:</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Geolocation helper ───────────────────────────────────────────────────────

export function getUserLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout: 10000 }
    );
  });
}

// Re-export for backward compat
export async function loadGoogleMaps() {
  return null; // no-op — using Leaflet now
}
