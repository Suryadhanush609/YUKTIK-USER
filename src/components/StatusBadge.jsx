import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Truck, Check, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  switch (norm) {
    case 'active':
    case 'allocating resources':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Active / Allocating
        </span>
      );
    case 'assigned':
    case 'dispatched':
    case 'ambulance assigned':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Truck className="w-3.5 h-3.5" />
          Dispatched
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Resolved
        </span>
      );
    case 'submitted':
    case 'under review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Clock className="w-3.5 h-3.5" />
          Under Review
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
          <HelpCircle className="w-3.5 h-3.5" />
          {status || 'Unknown'}
        </span>
      );
  }
}

