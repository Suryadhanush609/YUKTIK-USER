import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Radio } from 'lucide-react';

export default function EmergencyButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/report')}
      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 p-0.5 shadow-2xl shadow-red-600/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-8 py-5 transition-colors group-hover:bg-red-500">
        <div className="relative flex items-center justify-center">
          <span className="absolute h-8 w-8 animate-ping rounded-full bg-white opacity-40"></span>
          <AlertCircle className="relative h-7 w-7 text-white" />
        </div>
        <div className="text-left">
          <span className="block text-xl font-extrabold tracking-wider text-white">
            REPORT EMERGENCY
          </span>
          <span className="block text-xs font-medium text-red-100">
            Voice & text AI dispatch • Instant ambulance allocation
          </span>
        </div>
      </div>
    </button>
  );
}
