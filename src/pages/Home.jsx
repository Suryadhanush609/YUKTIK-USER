import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  MapPin,
  Ambulance,
  Hospital,
  Shield,
  PhoneCall,
  Clock,
  ArrowRight,
  Radio,
  CheckCircle2,
  Activity,
  Flame,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import emergencyWS from '../services/websocket';
import EmergencyButton from '../components/EmergencyButton';
import { getCurrentLocation } from '../services/location';
import { getUserIncidentIds } from '../utils/session';
import StatusBadge from '../components/StatusBadge';

export default function Home() {
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting...');
  const [activeIncident, setActiveIncident] = useState(null);
  const [counts, setCounts] = useState({ hospitals: 0, ambulances: 0, beds: 0 });
  const [loading, setLoading] = useState(true);

  const fetchActiveIncident = async () => {
    try {
      const userIncidentIds = getUserIncidentIds();
      if (userIncidentIds.length === 0) {
        setActiveIncident(null);
        return;
      }

      const res = await api.get('/incidents');
      const all = res.data || [];
      // Find the user's latest active incident
      const userActive = all.find(
        (i) => userIncidentIds.includes(i.id) && i.status !== 'resolved'
      );
      setActiveIncident(userActive || null);
    } catch (err) {
      console.warn('Could not check user active incident:', err);
    }
  };

  const fetchServiceOverview = async () => {
    try {
      const [hospRes, ambRes] = await Promise.all([
        api.get('/hospitals').catch(() => ({ data: [] })),
        api.get('/ambulances').catch(() => ({ data: [] })),
      ]);

      const hosps = hospRes.data || [];
      const ambs = ambRes.data || [];
      const totalBeds = hosps.reduce((acc, h) => acc + (h.available_beds || 0), 0);

      setCounts({
        hospitals: hosps.length,
        ambulances: ambs.filter((a) => a.status === 'available').length,
        beds: totalBeds,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Geolocation
    getCurrentLocation()
      .then((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('GPS Active');
      })
      .catch(() => {
        setLocationStatus('Default Area (Bangalore)');
        setLocation({ lat: 12.9716, lng: 77.5946 });
      });

    // 2. Fetch data
    fetchActiveIncident();
    fetchServiceOverview();

    // 3. Subscribe to real-time updates
    const unsub = emergencyWS.subscribe((data) => {
      if (
        data.type === 'incident_updated' ||
        data.type === 'new_incident' ||
        data.type === 'ambulance_status_changed'
      ) {
        fetchActiveIncident();
        fetchServiceOverview();
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome & Location Status Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/30 text-xs font-semibold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              YUKTIK 2026 Citizen Emergency Network
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Rapid Emergency Portal
            </h1>
            <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
              Instantly broadcast emergency reports with voice or text. Real-time AI triage dispatches the nearest ambulance and reserves critical hospital beds.
            </p>
          </div>

          {/* Location Chip */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg min-w-[240px]">
            <div className="p-3 bg-purple-900/40 border border-purple-500/30 text-purple-400 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Your Coordinates
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting GPS...'}
              </span>
              <span className="text-xs text-emerald-400 block mt-0.5">
                ● {locationStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Emergency Action Bar */}
      <div className="bg-gradient-to-b from-red-950/40 to-slate-900/90 border border-red-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Facing a Crisis? Immediate Help is 1-Click Away.
        </h2>
        <p className="text-sm text-gray-300 max-w-lg mx-auto">
          Push the red button to speak or type what happened. Responders will be routed to your coordinates immediately.
        </p>
        <div className="max-w-md mx-auto pt-2">
          <EmergencyButton />
        </div>
      </div>

      {/* User's Active Incident Card (if any active) */}
      {activeIncident && (
        <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-red-300 font-bold block">
                  Your Active Emergency Dispatch
                </span>
                <h3 className="text-lg font-bold text-white font-mono">
                  Incident #{activeIncident.id} ({activeIncident.incident_type})
                </h3>
              </div>
            </div>
            <StatusBadge status={activeIncident.status} />
          </div>

          <p className="text-sm text-gray-200">
            {activeIncident.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-gray-400 block">Assigned Ambulance</span>
              <span className="font-semibold text-white text-sm">
                {activeIncident.assigned_ambulance_id ? `Ambulance #${activeIncident.assigned_ambulance_id}` : 'Dispatching unit...'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Assigned Hospital</span>
              <span className="font-semibold text-white text-sm">
                {activeIncident.assigned_hospital_id ? `Hospital #${activeIncident.assigned_hospital_id}` : 'Queueing ER...'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">AI Severity / Priority</span>
              <span className="font-semibold text-rose-400 text-sm uppercase">
                {activeIncident.priority} ({activeIncident.severity}/5)
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/my')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <span>View Full Dispatch Details in My Emergencies</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Nearby Services Quick Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Live Emergency Grid Status
          </h2>
          <button
            onClick={() => navigate('/nearby')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            Browse Nearby Help <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/nearby')}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition shadow"
          >
            <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 w-fit mb-3 border border-emerald-800/40">
              <Hospital className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-white block">{counts.hospitals}</span>
            <span className="text-xs text-gray-400">Operational Hospitals</span>
          </div>

          <div
            onClick={() => navigate('/nearby')}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition shadow"
          >
            <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 w-fit mb-3 border border-amber-800/40">
              <Ambulance className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-white block">{counts.ambulances}</span>
            <span className="text-xs text-gray-400">Available Ambulances</span>
          </div>

          <div
            onClick={() => navigate('/nearby')}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition shadow"
          >
            <div className="p-2.5 rounded-xl bg-purple-950/60 text-purple-400 w-fit mb-3 border border-purple-800/40">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-white block">{counts.beds}</span>
            <span className="text-xs text-gray-400">Open Hospital Beds</span>
          </div>

          <div
            onClick={() => navigate('/nearby')}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition shadow"
          >
            <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 w-fit mb-3 border border-rose-800/40">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-white block">4</span>
            <span className="text-xs text-gray-400">Fire & Police Stations</span>
          </div>
        </div>
      </div>

      {/* Emergency Contacts Hotlines */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-primary" />
          National & Regional Emergency Helplines
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="tel:112"
            className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-center transition block"
          >
            <span className="text-xs text-gray-400 block">National Unified</span>
            <span className="text-lg font-bold text-white">112</span>
          </a>
          <a
            href="tel:108"
            className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-center transition block"
          >
            <span className="text-xs text-gray-400 block">Ambulance Hotline</span>
            <span className="text-lg font-bold text-emerald-400">108</span>
          </a>
          <a
            href="tel:101"
            className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-center transition block"
          >
            <span className="text-xs text-gray-400 block">Fire & Rescue</span>
            <span className="text-lg font-bold text-rose-400">101</span>
          </a>
          <a
            href="tel:100"
            className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-center transition block"
          >
            <span className="text-xs text-gray-400 block">Police Command</span>
            <span className="text-lg font-bold text-indigo-400">100</span>
          </a>
        </div>
      </div>
    </div>
  );
}
