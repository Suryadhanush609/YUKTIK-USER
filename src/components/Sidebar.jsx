import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  MapPin,
  AlertOctagon,
  Clock,
  Shield,
  Phone,
  Radio
} from 'lucide-react';

const navItems = [
  { to: '/home', label: 'Home Dashboard', icon: <Home className="w-5 h-5" /> },
  { to: '/nearby', label: 'Nearby Help', icon: <MapPin className="w-5 h-5" /> },
  { to: '/report', label: 'Report Emergency', icon: <AlertOctagon className="w-5 h-5 text-red-400" /> },
  { to: '/my', label: 'My Emergencies', icon: <Clock className="w-5 h-5" /> },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-wide">YUKTIK</span>
                <span className="text-[10px] block font-mono text-purple-400 leading-none">CITIZEN PORTAL</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-600/20 text-white border border-purple-500/40 shadow-sm'
                      : 'text-gray-400 hover:bg-slate-900 hover:text-gray-200'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Emergency Helpline Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <Phone className="w-4 h-4" />
              <span>Direct Emergency Helpline</span>
            </div>
            <a
              href="tel:112"
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow transition"
            >
              Call 112 Unified
            </a>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 font-mono">
            <span>YUKTIK 2026 v1.0</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Grid
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
