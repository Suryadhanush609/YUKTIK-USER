import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  MapPin,
  Ambulance,
  Building2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Radio
} from 'lucide-react';
import api from '../services/api';
import emergencyWS from '../services/websocket';
import { getUserIncidentIds, getReporterId } from '../utils/session';
import StatusBadge from '../components/StatusBadge';

export default function MyEmergencies() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ambulancesMap, setAmbulancesMap] = useState({});
  const [hospitalsMap, setHospitalsMap] = useState({});
  const [wsConnected, setWsConnected] = useState(false);

  const reporterId = getReporterId();

  const fetchUserIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch user submitted IDs from local session
      const userIncidentIds = getUserIncidentIds();

      // 2. Query backend for incidents
      const [incRes, ambRes, hospRes] = await Promise.all([
        api.get('/incidents'),
        api.get('/ambulances'),
        api.get('/hospitals'),
      ]);

      // Create lookup dicts
      const ambMap = {};
      (ambRes.data || []).forEach((a) => {
        ambMap[a.id] = a;
      });
      setAmbulancesMap(ambMap);

      const hospMap = {};
      (hospRes.data || []).forEach((h) => {
        hospMap[h.id] = h;
      });
      setHospitalsMap(hospMap);

      // Filter only user's incidents
      const allIncidents = incRes.data || [];
      const userOnly = allIncidents.filter((inc) => userIncidentIds.includes(inc.id));
      setIncidents(userOnly);
    } catch (err) {
      console.error('Failed to load user emergencies:', err);
      setError('Unable to reach emergency database. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserIncidents();

    // Subscribe to live WebSocket updates
    const unsubscribe = emergencyWS.subscribe((data) => {
      if (data.type === 'connection_status') {
        setWsConnected(data.connected);
      } else if (
        data.type === 'incident_updated' ||
        data.type === 'new_incident' ||
        data.type === 'ambulance_status_changed'
      ) {
        // Refetch to reflect real-time allocation and status changes
        fetchUserIncidents();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">My Reported Emergencies</h1>
            <span className="flex items-center gap-1.5 text-xs bg-slate-800 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30">
              <Radio className={`w-3 h-3 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
              {wsConnected ? 'Live Grid Active' : 'Connecting to Grid'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Tracking active emergency dispatch, assigned ambulance units, and receiving hospitals in real time.
          </p>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            Reporter Session: <span className="text-gray-400">{reporterId}</span> (isolated to your device)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUserIncidents}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 transition border border-slate-700 flex items-center gap-2 text-sm"
            title="Refresh Incidents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/report')}
            className="py-2.5 px-4 rounded-xl bg-primary hover:bg-red-600 text-white font-semibold transition flex items-center gap-2 text-sm shadow-md shadow-red-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            Report New
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Incident List */}
      {loading && incidents.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
          <p className="text-base font-medium">Connecting to emergency database...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-gray-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Emergencies Reported</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            You currently have no active or historical emergency dispatches logged from this session.
          </p>
          <button
            onClick={() => navigate('/report')}
            className="bg-primary hover:bg-red-600 text-white font-semibold py-2.5 px-6 rounded-xl transition"
          >
            Report an Emergency Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => {
            const amb = incident.assigned_ambulance_id ? ambulancesMap[incident.assigned_ambulance_id] : null;
            const hosp = incident.assigned_hospital_id ? hospitalsMap[incident.assigned_hospital_id] : null;

            return (
              <div
                key={incident.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition space-y-4 shadow-lg"
              >
                {/* Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white font-mono">
                      Incident #{incident.id}
                    </span>
                    <span className="text-xs uppercase px-2 py-0.5 rounded font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                      {incident.incident_type}
                    </span>
                    <span className={`text-xs uppercase px-2 py-0.5 rounded font-bold ${
                      incident.priority === 'critical'
                        ? 'bg-red-950/70 text-red-400 border border-red-800/50'
                        : 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                    }`}>
                      {incident.priority} (Sev {incident.severity}/5)
                    </span>
                  </div>

                  <StatusBadge status={incident.status} />
                </div>

                {/* Description */}
                <p className="text-gray-200 text-sm leading-relaxed">
                  {incident.description}
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Location Coordinates</span>
                      <span className="font-mono text-gray-200">
                        {incident.latitude != null ? incident.latitude.toFixed(4) : '—'}, {incident.longitude != null ? incident.longitude.toFixed(4) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Ambulance className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Assigned Ambulance</span>
                      <span className="font-semibold text-white">
                        {amb ? `${amb.unit_number} (${amb.status})` : 'Dispatching unit...'}
                      </span>
                      {amb && amb.driver_name && (
                        <span className="text-gray-400 block text-[11px]">Driver: {amb.driver_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Assigned Hospital</span>
                      <span className="font-semibold text-white">
                        {hosp ? hosp.name : 'Selecting nearest ER...'}
                      </span>
                      {hosp && (
                        <span className="text-gray-400 block text-[11px] truncate">
                          {hosp.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer / Time */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported: {incident.created_at ? new Date(incident.created_at).toLocaleString() : 'Just now'}</span>
                  </div>
                  <div>
                    {incident.image_path && (
                      <a
                        href={incident.image_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:underline flex items-center gap-1"
                      >
                        View Attached Photo <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

