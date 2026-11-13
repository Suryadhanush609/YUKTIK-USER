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

// Real backend provides hospitals and ambulances.
// We complement with clearly labeled simulated fire/police stations per guidelines.
const SIMULATED_SERVICES = [
  {
    id: 'sim-fire-1',
    name: 'Indiranagar Fire & Rescue HQ',
    category: 'Fire',
    latitude: 12.9784,
    longitude: 77.6408,
    phone: '101',
    address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bangalore',
    is_simulated: true,
  },
  {
    id: 'sim-fire-2',
    name: 'Koramangala Fire Station',
    category: 'Fire',
    latitude: 12.9352,
    longitude: 77.6245,
    phone: '101',
    address: '80 Feet Rd, 4th Block, Koramangala, Bangalore',
    is_simulated: true,
  },
  {
    id: 'sim-police-1',
    name: 'Cubbon Park Central Police Command',
    category: 'Police',
    latitude: 12.9767,
    longitude: 77.5913,
    phone: '112',
    address: 'Kasturba Rd, Sampangi Rama Nagara, Bangalore',
    is_simulated: true,
  },
  {
    id: 'sim-police-2',
    name: 'Ashok Nagar Police Station',
    category: 'Police',
    latitude: 12.9698,
    longitude: 77.6050,
    phone: '112',
    address: 'Commissariat Rd, Ashok Nagar, Bangalore',
    is_simulated: true,
  },
];

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
  const [userPos, setUserPos] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore Center
  const [gpsDetected, setGpsDetected] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  // Manual coordinate input states
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState('12.9716');
  const [manualLng, setManualLng] = useState('77.5946');

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
      const [hospRes, ambRes] = await Promise.all([
        api.get('/hospitals', { params: { lat, lon } }).catch(() => ({ data: [] })),
        api.get('/ambulances', { params: { lat, lon } }).catch(() => ({ data: [] })),
      ]);

      const formattedHospitals = (hospRes.data || []).map((h) => ({
        ...h,
        category: 'Hospital',
        distance_km: h.distance_km ?? haversine(lat, lon, h.latitude, h.longitude),
        is_simulated: false,
      }));

      const formattedAmbulances = (ambRes.data || []).map((a) => ({
        ...a,
        name: `${a.unit_number} (${a.status})`,
        category: 'Ambulance',
        distance_km: a.distance_km ?? haversine(lat, lon, a.latitude, a.longitude),
        is_simulated: false,
      }));

      const formattedSim = SIMULATED_SERVICES.map((s) => ({
        ...s,
        distance_km: haversine(lat, lon, s.latitude, s.longitude),
      }));

      setServices([...formattedHospitals, ...formattedAmbulances, ...formattedSim]);
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
            <h1 className="text-2xl font-bold text-white">Nearby Emergency Services</h1>
            <p className="text-sm text-gray-400 mt-1">
              Live hospital bed capacities, deployed ambulances, and emergency responder stations.
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
            <span className="text-gray-300 font-medium">Set Custom Location:</span>
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
              <option value="all">All Categories ({services.length})</option>
              <option value="hospital">Hospitals</option>
              <option value="ambulance">Ambulances</option>
              <option value="fire">Fire Stations</option>
              <option value="police">Police Stations</option>
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
          <p className="text-base font-medium">Scanning area for emergency infrastructure...</p>
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
