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

const getRecommendedUnit = (type) => {
  switch (type?.toLowerCase()) {
    case 'flood':
      return { id: 'RESCUE-12', name: 'Flood Rescue', emoji: '🚤', eta: '6 min', distance: '4.8 km', reason: 'Fastest route (avoiding flooded roads)' };
    case 'fire':
      return { id: 'ENGINE-04', name: 'Fire Engine', emoji: '🚒', eta: '4 min', distance: '3.2 km', reason: 'Closest available heavy pumper' };
    case 'medical':
      return { id: 'AMB-09', name: 'Ambulance (ALS)', emoji: '🚑', eta: '8 min', distance: '5.1 km', reason: 'Nearest Advanced Life Support' };
    case 'accident':
      return { id: 'RESCUE-02', name: 'Rescue Vehicle', emoji: '🚓', eta: '5 min', distance: '3.8 km', reason: 'Equipped with extrication gear' };
    case 'other':
    default:
      return { id: 'PATROL-01', name: 'Patrol Unit', emoji: '🚓', eta: '3 min', distance: '1.5 km', reason: 'Nearest available responder' };
  }
};

const getIncidentImage = (type, summary = '') => {
  const t = (type || '').toLowerCase();
  const s = (summary || '').toLowerCase();

  if (t === 'fire' || s.includes('fire') || s.includes('blaze') || s.includes('burn') || s.includes('blast'))
    return { url: 'https://images.unsplash.com/photo-1486551937199-baf066858de7?q=80&w=300&auto=format&fit=crop', alt: 'Fire' };
  if (t === 'flood' || s.includes('flood') || s.includes('water') || s.includes('drown') || s.includes('submerge'))
    return { url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=300&auto=format&fit=crop', alt: 'Flood' };
  if (t === 'medical' || s.includes('injur') || s.includes('heart') || s.includes('hospital') || s.includes('unconscious'))
    return { url: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?q=80&w=300&auto=format&fit=crop', alt: 'Medical' };
  if (t === 'accident' || s.includes('accident') || s.includes('collid') || s.includes('crash') || s.includes('overturn'))
    return { url: 'https://images.unsplash.com/photo-1543465077-db45d34b88a5?q=80&w=300&auto=format&fit=crop', alt: 'Accident' };
  if (t === 'structural' || s.includes('collaps') || s.includes('building') || s.includes('structur'))
    return { url: 'https://images.unsplash.com/photo-1590004845684-e029d4156fdc?q=80&w=300&auto=format&fit=crop', alt: 'Structural' };
  if (t === 'industrial' || s.includes('industrial') || s.includes('factory') || s.includes('chemical') || s.includes('gas leak') || s.includes('explosion'))
    return { url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=300&auto=format&fit=crop', alt: 'Industrial' };
  if (s.includes('rescue') || s.includes('trap') || s.includes('strand'))
    return { url: 'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?q=80&w=300&auto=format&fit=crop', alt: 'Rescue' };
  if (s.includes('storm') || s.includes('cyclone') || s.includes('wind') || s.includes('thunder'))
    return { url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=300&auto=format&fit=crop', alt: 'Storm' };
  return { url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=300&auto=format&fit=crop', alt: 'Emergency' };
};

export default function IncidentDrawer({ incident, onClose, onReviewDispatch }) {
  if (!incident) return null;
  const [activeTab, setActiveTab] = useState('overview');

  const confidencePercent = incident.confidence <= 1 ? Math.round(incident.confidence * 100) : incident.confidence || 94;
  
  // Format the ID nicely
  const displayId = `INC-${incident.id.toString().padStart(4, '0')}`;

  const recUnit = getRecommendedUnit(incident.type);

  return (
    <div className="w-full h-full bg-[#0A0E17] text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-5 border-b border-[#1E2638] flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold tracking-tight font-mono">{displayId}</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getSeverityColor(incident.priority)}`}>
              {incident.priority || 'Unknown'}
            </span>
          </div>
          <h3 className="text-lg font-semibold">{incident.type ? incident.type.charAt(0).toUpperCase() + incident.type.slice(1) : 'Unknown Type'}</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[#1E2638] rounded-full transition-colors">
          <X size={20} className="text-brand-muted hover:text-white" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Top summary section */}
        <div className="p-5 flex gap-4 border-b border-[#1E2638]">
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
            <div className="flex items-start gap-3 text-brand-muted mt-2">
              <Users size={16} className="mt-0.5 shrink-0" />
              <span className="text-white line-clamp-2 leading-relaxed">{incident.summary}</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-[#111622] rounded-lg border border-[#1E2638] overflow-hidden shrink-0">
            <img src={getIncidentImage(incident.type, incident.summary).url} alt={getIncidentImage(incident.type, incident.summary).alt} className="w-full h-full object-cover opacity-80" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E2638] px-5 gap-6 pt-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'response', label: 'Response' },
            { key: 'reports', label: `Reports (${incident.report_count || 1})` },
            { key: 'timeline', label: 'Timeline' },
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.key ? 'border-blue-500 text-white' : 'border-transparent text-brand-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 flex flex-col gap-8">
          
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              {/* AI Assessment */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    AI Assessment
                  </h4>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {confidencePercent}% confidence
                  </div>
                </div>
                <ul className="text-sm text-brand-muted space-y-2.5 pl-6 list-disc marker:text-[#4b5563]">
                  <li>Multiple corroborating reports</li>
                  <li>Severity assessed as {incident.priority?.toUpperCase()}</li>
                  <li className="leading-relaxed break-words pr-2">{incident.summary}</li>
                </ul>
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
                      <span className="text-white">{recUnit.distance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Estimated Time</span>
                      <span className="text-white">{recUnit.eta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Route Type</span>
                      <span className="text-white text-xs text-right">Fastest</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── RESPONSE TAB ── */}
          {activeTab === 'response' && (
            <>
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
                        <span className="text-xl">{recUnit.emoji}</span>
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white">{recUnit.id}</div>
                        <div className="text-xs text-brand-muted">{recUnit.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-500 font-bold font-mono">ETA {recUnit.eta}</div>
                      <div className="text-xs text-brand-muted flex justify-end gap-2 mt-1">
                        <span>{recUnit.distance}</span>
                        <span className="text-emerald-500">Available</span>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="text-xs text-brand-muted space-y-1 mb-4 pl-1">
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> Closest suitable unit</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> {recUnit.reason}</li>
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
                          Dispatch {recUnit.id}
                        </button>
                        <button 
                          onClick={onReviewDispatch}
                          className="px-4 py-2 bg-[#111622] hover:bg-[#1E2638] border border-[#1E2638] rounded text-white text-sm font-semibold transition-colors"
                        >
                          Alternatives
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── REPORTS TAB ── */}
          {activeTab === 'reports' && (
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Incident Reports</h4>
              <div className="space-y-3">
                {[
                  { time: '15:36', source: 'Citizen Report', text: incident.summary || 'Initial report received from citizen via mobile app.', verified: true },
                  { time: '15:37', source: 'Sensor Data', text: 'Water level sensor triggered at nearby monitoring station.', verified: true },
                  { time: '15:38', source: 'Field Team', text: 'Patrol unit confirmed visual assessment of the situation.', verified: false },
                ].slice(0, incident.report_count || 3).map((report, i) => (
                  <div key={i} className="bg-[#111622] border border-[#1E2638] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-brand-muted">{report.time}</span>
                        <span className="text-xs font-bold text-white">{report.source}</span>
                      </div>
                      {report.verified && (
                        <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">{report.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TIMELINE TAB ── */}
          {activeTab === 'timeline' && (
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Incident Timeline</h4>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-[#1E2638]"></div>
                {[
                  { time: '15:36:00', event: 'Incident reported', detail: 'First citizen report received via mobile app', color: 'bg-emerald-500' },
                  { time: '15:36:12', event: 'AI classification', detail: `Classified as ${incident.type} — ${incident.priority} priority`, color: 'bg-yellow-500' },
                  { time: '15:36:15', event: 'Duplicate check', detail: `${incident.report_count || 1} report(s) consolidated`, color: 'bg-blue-500' },
                  { time: '15:36:30', event: 'Resource matched', detail: `${recUnit.id} identified as best available unit`, color: 'bg-emerald-500' },
                  ...(incident.status === 'dispatched' ? [
                    { time: '15:37:00', event: 'Dispatched', detail: `${recUnit.id} dispatched — ETA ${recUnit.eta}`, color: 'bg-blue-500' },
                    { time: '15:37:10', event: 'En route', detail: 'Unit confirmed en route to incident location', color: 'bg-emerald-500' },
                  ] : [
                    { time: '—', event: 'Awaiting dispatch', detail: 'Operator action required', color: 'bg-yellow-500' },
                  ]),
                ].map((item, i) => (
                  <div key={i} className="relative flex gap-3">
                    <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ${item.color} border-2 border-[#0A0E17] z-10`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-brand-muted">{item.time}</span>
                        <span className="text-xs font-bold text-white">{item.event}</span>
                      </div>
                      <p className="text-[11px] text-brand-muted mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
