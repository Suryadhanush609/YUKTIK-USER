import React, { useState } from 'react';
import {
  Phone,
  Hospital,
  Ambulance,
  MapPin,
  ShieldCheck,
  Flame,
  Info,
  ExternalLink,
  ChevronRight,
  Bed,
  CheckCircle2,
  XCircle
} from 'lucide-react';

function getCategoryConfig(category) {
  switch ((category || '').toLowerCase()) {
    case 'hospital':
      return {
        icon: <Hospital className="w-5 h-5 text-emerald-400" />,
        badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
      };
    case 'ambulance':
      return {
        icon: <Ambulance className="w-5 h-5 text-amber-400" />,
        badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
      };
    case 'fire':
      return {
        icon: <Flame className="w-5 h-5 text-rose-400" />,
        badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
      };
    case 'police':
      return {
        icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
        badgeBg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
      };
    default:
      return {
        icon: <MapPin className="w-5 h-5 text-purple-400" />,
        badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
      };
  }
}

export default function ServiceCard({ service, userPos }) {
  const [showModal, setShowModal] = useState(false);
  const cfg = getCategoryConfig(service.category);
  const dist = service.distance_km != null ? `${service.distance_km} km` : '—';

  const directionsUrl = userPos
    ? `https://www.google.com/maps/dir/?api=1&origin=${userPos.lat},${userPos.lng}&destination=${service.latitude},${service.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`;

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-xl space-y-4">
        <div className="space-y-3">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                {cfg.icon}
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                  {service.name || service.unit_number || 'Emergency Service'}
                </h3>
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cfg.badgeBg}`}>
                  {service.category}
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/50 px-2 py-1 rounded-lg border border-purple-800/40 whitespace-nowrap">
              {dist}
            </span>
          </div>

          {/* Details / Availability */}
          <div className="text-xs space-y-1.5 text-gray-300">
            {service.address && (
              <p className="flex items-start gap-1.5 line-clamp-2 text-gray-400">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 mt-0.5" />
                <span>{service.address}</span>
              </p>
            )}

            {/* Hospital Beds Info */}
            {service.total_beds != null && (
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Bed className="w-3.5 h-3.5 text-emerald-400" />
                  Available Beds:
                </span>
                <span className="font-bold text-emerald-400">
                  {service.available_beds} / {service.total_beds}
                </span>
              </div>
            )}

            {/* Ambulance status */}
            {service.status && service.category === 'Ambulance' && (
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold capitalize ${service.status === 'available' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {service.status}
                </span>
              </div>
            )}

            {service.is_simulated && (
              <p className="text-[11px] text-purple-400 font-medium">
                [Simulated Facility for Hackathon Demo]
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
          {service.phone ? (
            <a
              href={`tel:${service.phone}`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition border border-slate-700"
            >
              <Info className="w-3.5 h-3.5 text-purple-400" />
              Info
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition border border-slate-700"
          >
            Details
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition border border-purple-700/50"
          >
            Route
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {cfg.icon}
                <h3 className="text-lg font-bold text-white">{service.name || service.unit_number}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <span className="text-gray-500 block text-xs">Category</span>
                <span className="font-semibold text-white">{service.category}</span>
              </div>
              {service.address && (
                <div>
                  <span className="text-gray-500 block text-xs">Address</span>
                  <span>{service.address}</span>
                </div>
              )}
              {service.phone && (
                <div>
                  <span className="text-gray-500 block text-xs">Verified Emergency Contact</span>
                  <a href={`tel:${service.phone}`} className="text-emerald-400 font-bold hover:underline">
                    {service.phone}
                  </a>
                </div>
              )}
              {service.total_beds != null && (
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-gray-500 block text-xs">General Beds</span>
                    <span className="font-bold text-emerald-400">{service.available_beds} / {service.total_beds}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">ICU Capacity</span>
                    <span className="font-bold text-purple-400">{service.icu_available ?? '—'} / {service.icu_total ?? '—'}</span>
                  </div>
                </div>
              )}
              {service.driver_name && (
                <div>
                  <span className="text-gray-500 block text-xs">Assigned Driver</span>
                  <span className="font-semibold text-white">{service.driver_name}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>Lat: {service.latitude}</div>
                <div>Lon: {service.longitude}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
