import React from 'react';
import { MapPin, Map as MapIcon, Clock, Activity, CloudRain, Wind, Eye } from 'lucide-react';

export default function UnitTrackingPanel({ incident }) {
  if (!incident) return null;
  
  return (
    <div className="w-[380px] bg-[#0A0E17] border-l border-[#1E2638] flex flex-col h-full font-sans text-white">
      {/* Header */}
      <div className="p-4 border-b border-[#1E2638] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MapIcon size={16} className="text-blue-500" />
          <h3 className="font-bold text-sm tracking-wide">Unit Route & Live Tracking</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Mini Map */}
        <div className="p-4 border-b border-[#1E2638]">
          <div className="flex gap-2 mb-3">
            <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold">Live Route</button>
            <button className="bg-[#111622] text-brand-muted border border-[#1E2638] px-4 py-1.5 rounded text-xs font-bold hover:text-white transition-colors">Traffic</button>
          </div>
          
          <div className="w-full h-48 bg-[#111622] rounded-lg border border-[#1E2638] flex items-center justify-center relative overflow-hidden mb-4">
             <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop" alt="map" className="w-full h-full object-cover opacity-50 grayscale" />
             <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
             
             {/* Fake route line */}
             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M 20 80 Q 40 50, 70 30" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="4 2" className="animate-pulse" />
             </svg>
             <div className="absolute bottom-[20%] left-[20%] w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111622]"></div>
             <div className="absolute top-[30%] right-[30%] w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-brand-muted"><span className="text-white">4.8 km</span> Distance</div>
            <div className="flex items-center gap-2 text-brand-muted"><span className="text-white">6 min</span> ETA</div>
            <div className="flex items-center gap-2 text-brand-muted"><span className="text-yellow-500">Moderate</span> Traffic</div>
            <div className="flex items-center gap-2 text-brand-muted"><span className="text-red-500">2</span> Road Closures</div>
          </div>
        </div>

        {/* Alternative Routes */}
        <div className="p-4 border-b border-[#1E2638]">
          <h4 className="text-sm font-bold mb-3">Alternative Routes</h4>
          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between text-emerald-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Route 1 (Recommended)
              </div>
              <div className="flex items-center gap-4">
                <span>4.8 km</span>
                <span>6 min</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-brand-muted">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border border-brand-muted"></div>
                Route 2
              </div>
              <div className="flex items-center gap-4">
                <span>5.4 km</span>
                <span>8 min</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-brand-muted">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border border-brand-muted"></div>
                Route 3
              </div>
              <div className="flex items-center gap-4">
                <span>6.2 km</span>
                <span>11 min</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-xs font-bold flex justify-center items-center gap-2 transition-colors">
             <MapPin size={14} /> View on Google Maps
          </button>
        </div>

        {/* Location Details */}
        <div className="p-4">
          <h4 className="text-sm font-bold mb-3">Location Details</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-brand-muted">Address</span>
              <span className="text-white truncate">Near Harri Lake, Vadodara</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-brand-muted">Area</span>
              <span className="text-white">Harri Lake Area</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-brand-muted">Coordinates</span>
              <span className="text-white font-mono">22.3291, 73.1962</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-brand-muted">Ward</span>
              <span className="text-white">Ward 7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
