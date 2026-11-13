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

    const initialLat = userPos?.lat || 12.9716;
    const initialLng = userPos?.lng || 77.5946;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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
        icon: createColorPin('#ef4444', 'YOU'),
      }).bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #ef4444;">Your Detected Location</strong><br/>
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
        color = '#ef4444'; // red
        label = 'F';
      } else if (cat === 'police') {
        color = '#6366f1'; // indigo
        label = 'P';
      }

      const isSimulated = s.is_simulated || s.category === 'Fire' || s.category === 'Police';

      const popupHtml = `
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 140px;">
          <strong style="font-size: 13px; color: #1e293b;">${s.name || s.unit_number || 'Service'}</strong><br/>
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: 600; font-size: 10px; margin: 3px 0;">
            ${s.category}
          </span>
          ${isSimulated ? '<br/><span style="color: #9333ea; font-size: 10px; font-weight: bold;">[Simulated Unit]</span>' : '<br/><span style="color: #059669; font-size: 10px; font-weight: bold;">[Live Resource]</span>'}
          ${s.address ? `<br/>${s.address}` : ''}
          ${s.total_beds ? `<br/>Available Beds: <strong>${s.available_beds}/${s.total_beds}</strong>` : ''}
          ${s.driver_name ? `<br/>Driver: ${s.driver_name}` : ''}
          ${s.distance_km ? `<br/>Distance: <strong>${s.distance_km} km</strong>` : ''}
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

    return () => {
      // Keep map alive or clean up on unmount
    };
  }, [userPos, services]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-gray-300 gap-2">
        <span className="font-semibold text-white">Live Tactical Map</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> You
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Hospital
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Ambulance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Simulated
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-96 w-full z-0" />
    </div>
  );
}

