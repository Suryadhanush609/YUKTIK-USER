import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Filter,
  Search,
  RefreshCw,
  Building2,
  Ambulance as AmbulanceIcon,
  ShieldAlert,
  Flame,
  Radio,
  Navigation
} from 'lucide-react';
import api from '../services/api';
import { getCurrentLocation } from '../services/location';
import ServiceCard from '../components/ServiceCard';
import MapView from '../components/MapView';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export default function NearbyHelp() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState({ lat: 17.3850, lng: 78.4867 }); // Default Hyderabad Center
  const [gpsDetected, setGpsDetected] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  // Manual coordinate input states
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState('17.3850');
  const [manualLng, setManualLng] = useState('78.4867');

  const detectLocation = () => {
    setLoading(true);
    getCurrentLocation()
      .then((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setManualLat(coords.lat.toFixed(4));
        setManualLng(coords.lng.toFixed(4));
        setGpsDetected(true);
        loadAllServices(coords.lat, coords.lng);
      })
      .catch((err) => {
        console.warn('Geolocation failed or denied, using center:', err);
        setGpsDetected(false);
        loadAllServices(userPos.lat, userPos.lng);
      });
  };

  const loadAllServices = async (lat, lon) => {
    setLoading(true);
    try {
      const [hospRes, ambRes, stnRes, resRes] = await Promise.all([
        api.get('/hospitals', { params: { lat, lon } }).catch(() => ({ data: [] })),
        api.get('/ambulances', { params: { lat, lon } }).catch(() => ({ data: [] })),
        api.get('/stations', { params: { lat, lon } }).catch(() => ({ data: [] })),
        api.get('/resources', { params: { lat, lon } }).catch(() => ({ data: [] })),
      ]);

      const formattedHospitals = (hospRes.data || []).map((h) => ({
        ...h,
        category: 'Hospital',
        distance_km: h.distance_km ?? haversine(lat, lon, h.latitude, h.longitude),
        is_simulated: false,
      }));

      const formattedAmbulances = (ambRes.data || []).map((a) => ({
        ...a,
        name: `EMRI 108 — ${a.unit_number}`,
        category: 'Ambulance',
        distance_km: a.distance_km ?? haversine(lat, lon, a.latitude, a.longitude),
        is_simulated: false,
      }));

      const formattedStations = (stnRes.data || []).map((stn) => {
        const isFire = stn.station_type === 'fire_station';
        return {
          id: `station-${stn.id}`,
          name: stn.station_name,
          category: isFire ? 'Fire' : 'Police',
          latitude: stn.latitude,
          longitude: stn.longitude,
          phone: stn.contact_phone || (isFire ? '101' : '100'),
          address: `${stn.address} (${stn.division || 'Hyderabad'})`,
          distance_km: stn.distance_km ?? haversine(lat, lon, stn.latitude, stn.longitude),
          is_simulated: false,
        };
      });

      const formattedResources = (resRes.data || [])
        .filter((r) => r.resource_type !== 'ambulance') // avoid duplicating ambulances
        .map((r) => {
          let cat = 'Police';
          if (r.resource_type === 'fire_engine') cat = 'Fire';
          else if (r.resource_type === 'rescue_unit') cat = 'Rescue';

          return {
            id: `res-${r.id}`,
            name: `${r.unit_code} (${r.operational_capability || r.department})`,
            category: cat,
            latitude: r.latitude,
            longitude: r.longitude,
            phone: r.contact_number || '112',
            address: `Base: ${r.home_station_name || 'Hyderabad Command'}`,
            driver_name: r.driver_pilot_name,
            distance_km: haversine(lat, lon, r.latitude, r.longitude),
            is_simulated: true, // Tag moving demo vehicles clearly
          };
        });

      setServices([
        ...formattedHospitals,
        ...formattedAmbulances,
        ...formattedStations,
        ...formattedResources,
      ]);
    } catch (e) {
      console.error('Failed to load services:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const handleApplyManualLocation = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setUserPos({ lat, lng });
      loadAllServices(lat, lng);
      setShowManual(false);
    }
  };

  // Filter & Search
  let displayed = services.filter((s) => {
    if (filter !== 'all' && s.category.toLowerCase() !== filter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchAddr = (s.address || '').toLowerCase().includes(q);
      const matchCat = (s.category || '').toLowerCase().includes(q);
      return matchName || matchAddr || matchCat;
    }
    return true;
  });

  // Sort
  if (sortBy === 'distance') {
    displayed.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
  } else if (sortBy === 'name') {
    displayed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Location Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Hyderabad Emergency Grid</h1>
            <p className="text-sm text-gray-400 mt-1">
              Verified apex hospitals, EMRI 108 ambulances, GHMC fire tenders, and police commissionerate units.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={detectLocation}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 flex items-center gap-2 text-sm transition"
            >
              <Navigation className="w-4 h-4 text-purple-400" />
              {gpsDetected ? 'GPS Active' : 'Detect GPS'}
            </button>
            <button
              onClick={() => setShowManual(!showManual)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 text-sm transition"
            >
              Manual Location
            </button>
          </div>
        </div>

        {/* Manual Location Form toggle */}
        {showManual && (
          <form onSubmit={handleApplyManualLocation} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-300 font-medium">Set Custom Coordinates:</span>
            <input
              type="number"
              step="0.0001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Lat"
              className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white w-28"
            />
            <input
              type="number"
              step="0.0001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="Lng"
              className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white w-28"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-red-600 text-white font-medium px-4 py-1.5 rounded-lg transition"
            >
              Apply
            </button>
          </form>
        )}

        {/* Search, Filter, & Sort Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals, units, address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">All Infrastructure ({services.length})</option>
              <option value="hospital">Hospitals</option>
              <option value="ambulance">Ambulances</option>
              <option value="fire">Fire Stations & Tenders</option>
              <option value="police">Police Stations & Patrols</option>
              <option value="rescue">SDRF Disaster Rescue</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="distance">Nearest Distance First</option>
              <option value="name">Alphabetical by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <MapView userPos={userPos} services={displayed} />

      {/* Services Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
          <p className="text-base font-medium">Scanning Hyderabad emergency infrastructure...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800">
          <p className="text-gray-400">No emergency services found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((service, idx) => (
            <ServiceCard key={service.id || idx} service={service} userPos={userPos} />
          ))}
        </div>
      )}
    </div>
  );
}
