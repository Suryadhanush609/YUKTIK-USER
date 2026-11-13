import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icon URLs in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG pin generator
function createColorPin(color, label) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">
          <div style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: bold;">
            ${label || ''}
          </div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function MapView({ userPos, services = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default to Hyderabad Central coordinates
    const initialLat = userPos?.lat || 17.3850;
    const initialLng = userPos?.lng || 78.4867;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | YUKTIK 2026',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const bounds = [];

    // 1. Plot User Marker
    if (userPos && userPos.lat && userPos.lng) {
      const userMarker = L.marker([userPos.lat, userPos.lng], {
        icon: createColorPin('#dc2626', 'YOU'),
      }).bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #dc2626;">Your Location</strong><br/>
          Lat: ${userPos.lat.toFixed(4)}<br/>
          Lon: ${userPos.lng.toFixed(4)}
        </div>
      `);
      markersLayer.addLayer(userMarker);
      bounds.push([userPos.lat, userPos.lng]);
    }

    // 2. Plot Emergency Services
    services.forEach((s) => {
      if (!s.latitude || !s.longitude) return;

      const cat = (s.category || '').toLowerCase();
      let color = '#3b82f6'; // blue default
      let label = 'S';

      if (cat === 'hospital') {
        color = '#10b981'; // emerald
        label = 'H';
      } else if (cat === 'ambulance') {
        color = '#f59e0b'; // amber
        label = 'A';
      } else if (cat === 'fire') {
        color = '#ea580c'; // orange
        label = 'F';
      } else if (cat === 'police') {
        color = '#4f46e5'; // indigo
        label = 'P';
      } else if (cat === 'rescue') {
        color = '#9333ea'; // purple
        label = 'R';
      }

      const isSimulated = s.is_simulated || String(s.id).startsWith('sim-') || String(s.id).startsWith('res-');

      const popupHtml = `
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 150px;">
          <strong style="font-size: 13px; color: #0f172a;">${s.name || s.unit_number || 'Service'}</strong><br/>
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: 600; font-size: 10px; margin: 3px 0;">
            ${s.category}
          </span>
          ${isSimulated
            ? '<br/><span style="color: #9333ea; font-size: 10px; font-weight: bold; background: #f3e8ff; padding: 1px 4px; border-radius: 3px;">[SIMULATED FLEET]</span>'
            : '<br/><span style="color: #059669; font-size: 10px; font-weight: bold; background: #d1fae5; padding: 1px 4px; border-radius: 3px;">[VERIFIED HYDERABAD]</span>'
          }
          ${s.address ? `<br/><span style="color: #475569;">${s.address}</span>` : ''}
          ${s.total_beds ? `<br/>Available Beds: <strong>${s.available_beds}/${s.total_beds}</strong> (ICU: <strong>${s.icu_available || 0}</strong>)` : ''}
          ${s.phone ? `<br/>Contact: <strong>${s.phone}</strong>` : ''}
          ${s.driver_name ? `<br/>Pilot: ${s.driver_name}` : ''}
          ${s.distance_km != null ? `<br/>Distance: <strong>${s.distance_km} km</strong>` : ''}
        </div>
      `;

      const marker = L.marker([s.latitude, s.longitude], {
        icon: createColorPin(color, label),
      }).bindPopup(popupHtml);

      markersLayer.addLayer(marker);
      bounds.push([s.latitude, s.longitude]);
    });

    // Auto-fit bounds if markers exist
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {};
  }, [userPos, services]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-gray-300 gap-2">
        <span className="font-semibold text-white">Hyderabad Emergency Tactical Map</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Citizen
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Hospital
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Ambulance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span> Fire
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Police
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> SDRF Rescue
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-96 w-full z-0" />
    </div>
  );
}
