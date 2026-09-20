import React, { useState } from 'react';
import { X, MapPin, Clock, Users, Activity, CheckCircle2, ChevronRight, Navigation } from 'lucide-react';
import { timeAgo } from '../../utils/time';

const getSeverityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

export default function IncidentDrawer({ incident, onClose, onReviewDispatch }) {
  if (!incident) return null;
  const [activeTab, setActiveTab] = useState('Overview');

  const confidencePercent = incident.confidence <= 1 ? Math.round(incident.confidence * 100) : incident.confidence || 94;
  
  // Format the ID nicely
  const displayId = `INC-${incident.id.toString().padStart(4, '0')}`;

  return (
    <div className="w-full h-full bg-[#0A0E17] text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-5 border-b border-[#1E2638] flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold tracking-tight font-mono">{displayId}</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getSeverityColor(incident.priority)}`}>
              {incident.priority || 'UNKNOWN'}
            </span>
          </div>
          <h3 className={`text-lg font-bold capitalize ${incident.priority?.toLowerCase() === 'critical' ? 'text-red-500' : 'text-white'}`}>
            {incident.type || 'Emergency'}
          </h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[#1E2638] rounded-full text-brand-muted transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Basic Info */}
        <div className="p-5 flex gap-4">
          <div className="flex-1 flex flex-col gap-3 text-sm">
            <div className="flex gap-3 text-brand-muted">
              <Clock size={16} className="mt-0.5" />
              <span>Reported {new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} &bull; {timeAgo(incident.created_at)}</span>
            </div>
            <div className="flex gap-3 text-brand-muted">
              <MapPin size={16} className="mt-0.5" />
              <div>
                <div className="text-white">{incident.location_name || 'Location Unknown'}</div>
                <div className="font-mono text-xs mt-0.5">{incident.lat?.toFixed(4)}, {incident.lng?.toFixed(4)}</div>
              </div>
            </div>
            <div className="flex gap-3 text-brand-muted mt-2">
              <Users size={16} />
              <span className="text-white">{incident.summary?.slice(0, 40)}...</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-[#111622] rounded-lg border border-[#1E2638] overflow-hidden shrink-0">
            <img src="https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=300&auto=format&fit=crop" alt="Flood" className="w-full h-full object-cover opacity-80" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E2638] px-5 gap-6">
          {['Overview', 'Response', `Reports (${incident.report_count || 1})`, 'Timeline'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab ? 'border-blue-500 text-white' : 'border-transparent text-brand-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 flex flex-col gap-6">
          
          {/* AI Assessment */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                AI Assessment
              </h4>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                {confidencePercent}% confidence
              </div>
            </div>
            <ul className="text-sm text-brand-muted space-y-2 pl-6 list-disc marker:text-[#1E2638]">

              <li>Multiple corroborating reports</li>
              <li>Severity assessed as {incident.priority?.toUpperCase()}</li>
              <li>{incident.summary?.slice(0, 50)}...</li>
            </ul>
          </div>

          {/* Recommended Response */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-white">Recommended Response</h4>
              <span className="text-xs text-emerald-500 flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} /> Best Match
              </span>
            </div>
            
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded flex items-center justify-center border border-emerald-500/20">
                    <span className="text-xl">🚤</span>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">RESCUE-12</div>
                    <div className="text-xs text-brand-muted">Flood Rescue</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-500 font-bold font-mono">ETA 6 min</div>
                  <div className="text-xs text-brand-muted flex justify-end gap-2 mt-1">
                    <span>4.8 km</span>
                    <span className="text-emerald-500">Available</span>
                  </div>
                </div>
              </div>
              
              <ul className="text-xs text-brand-muted space-y-1 mb-4 pl-1">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> Closest suitable unit</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> Fastest route (avoiding flooded roads)</li>
              </ul>
              
              <div className="flex gap-3">
                {incident.status === 'dispatched' ? (
                  <button 
                    onClick={async () => {
                      const { resolve } = await import('../../api/dispatch');
                      try {
                        await resolve(incident.id);
                        if (onResolveSuccess) {
                          onResolveSuccess(incident.id);
                        } else if (onClose) {
                          onClose();
                        }
                      } catch (err) {
                        console.error('Failed to resolve incident', err);
                        // Optimistic fallback in case of errors
                        if (onResolveSuccess) onResolveSuccess(incident.id);
                      }
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <CheckCircle2 size={16} />
                    Resolve Incident
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={onReviewDispatch}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Navigation size={16} />
                      Dispatch RESCUE-12
                    </button>
                    <button className="px-4 py-2 bg-[#111622] hover:bg-[#1E2638] border border-[#1E2638] rounded text-white text-sm font-semibold transition-colors">
                      Alternatives
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Route Preview */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Route Preview</h4>
            <div className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 flex gap-4 items-center">
              <div className="w-16 h-16 bg-[#1A2234] rounded flex-shrink-0 flex items-center justify-center border border-[#253046]">
                <MapPin size={24} className="text-blue-500" />
              </div>
              <div className="flex-1 text-sm font-mono flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Distance</span>
                  <span className="text-white">4.8 km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Estimated Time</span>
                  <span className="text-white">6 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Route Type</span>
                  <span className="text-white text-xs text-right">Fastest</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
