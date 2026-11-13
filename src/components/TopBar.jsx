import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  MapPin,
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';
import emergencyWS from '../services/websocket';
import { getCurrentLocation } from '../services/location';

export default function TopBar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [wsConnected, setWsConnected] = useState(false);
  const [locText, setLocText] = useState('Bangalore Grid');
  const [alerts, setAlerts] = useState([]);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  useEffect(() => {
    getCurrentLocation()
      .then((pos) => {
        setLocText(`${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`);
      })
      .catch(() => {
        setLocText('Bangalore, KA');
      });

    const unsub = emergencyWS.subscribe((data) => {
      if (data.type === 'connection_status') {
        setWsConnected(data.connected);
      } else if (data.type === 'new_incident') {
        setAlerts((prev) => [
          {
            id: Date.now(),
            text: `New ${data.priority?.toUpperCase()} Incident #${data.incident_id} reported.`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ]);
      } else if (data.type === 'incident_updated') {
        setAlerts((prev) => [
          {
            id: Date.now(),
            text: `Incident #${data.incident_id} status updated: ${data.new_status}`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    });

    return () => unsub();
  }, []);

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span>Location: <strong className="text-gray-200">{locText}</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* WebSocket Status Indicator */}
        <div
          title={wsConnected ? 'Connected to live emergency server' : 'Reconnecting to live server...'}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
            wsConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></span>
          <span className="hidden md:inline">{wsConnected ? 'Network Synchronized' : 'Syncing Grid...'}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="p-2.5 text-gray-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 relative transition"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Live System Broadcasts</span>
                <span className="text-[11px] text-gray-500">{alerts.length} notifications</span>
              </div>

              {alerts.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No alerts broadcasted yet.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                  {alerts.map((a) => (
                    <div key={a.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-gray-200">{a.text}</p>
                      <span className="text-[10px] text-gray-500 block">{a.time}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setShowAlertMenu(false);
                  navigate('/my');
                }}
                className="w-full text-center text-xs text-purple-400 hover:underline pt-1 block"
              >
                Go to My Emergencies
              </button>
            </div>
          )}
        </div>

        {/* Emergency Quick Trigger */}
        <button
          onClick={() => navigate('/report')}
          className="bg-primary hover:bg-red-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>SOS Report</span>
        </button>
      </div>
    </header>
  );
}
