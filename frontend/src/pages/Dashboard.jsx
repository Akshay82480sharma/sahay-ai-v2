import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LiveMap from '../components/map/LiveMap';
import IncidentList from '../components/incidents/IncidentList';
import IncidentDrawer from '../components/incidents/IncidentDrawer';
import UnitTrackingPanel from '../components/incidents/UnitTrackingPanel';
import DispatchModal from '../components/dispatch/DispatchModal';
import { useIncidents } from '../hooks/useIncidents';
import { useLiveData } from '../context/LiveDataProvider';
import { Bell, Flame, AlertTriangle, Ambulance, Timer, BarChart2, Activity } from 'lucide-react';

export default function Dashboard() {
  const { incidents, setIncidents } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [mapFilter, setMapFilter] = useState('All');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.selectedIncidentId && incidents?.length > 0) {
      const inc = incidents.find(i => i.id === location.state.selectedIncidentId);
      if (inc) {
        setSelectedIncident(inc);
      }
      // Optionally clear state so refresh doesn't keep it open? 
      // window.history.replaceState({}, document.title)
    }
  }, [location.state, incidents]);

  const liveData = useLiveData();
  const resources = liveData?.resources || [];

  const unassignedIncidents = incidents?.filter(i => i.status === 'new') || [];
  const activeCount = incidents?.filter(i => i.status === 'new' || i.status === 'dispatched' || i.status === 'active').length || 27;
  const criticalCount = incidents?.filter(i => (i.priority === 'critical' || i.score >= 80) && i.status !== 'resolved').length || 8;
  const unassignedCount = unassignedIncidents.length || 3;
  const unitsDeployed = resources?.filter(r => r.status === 'dispatched' || r.status === 'enroute' || r.status === 'on_scene').length || 12;
  const avgEta = '7:24';

  return (
    <div className="flex-1 flex w-full h-full min-h-0 bg-[#0A0E17] font-sans">
      
      {/* LEFT SECTION (Map + Widgets) */}
      <div className="flex-1 flex flex-col min-w-0 pr-4">
        
        {/* METRICS BAR */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-4">
          <div className="flex items-center gap-3 bg-[#111622] px-4 py-2 rounded-lg border border-[#1E2638] min-w-[160px]">
            <div className="p-2 bg-red-500/10 rounded-full">
              <Bell size={20} className="text-red-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                 <span className="text-xl font-bold leading-none text-white">{activeCount}</span>
              </div>
              <span className="text-[11px] text-brand-muted">Active Incidents</span>
              <span className="text-[10px] text-red-400 mt-0.5">↑ +12%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#111622] px-4 py-2 rounded-lg border border-[#1E2638] min-w-[160px]">
            <div className="p-2 bg-red-500/10 rounded-full">
              <Flame size={20} className="text-red-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                 <span className="text-xl font-bold leading-none text-white">{criticalCount}</span>
              </div>
              <span className="text-[11px] text-brand-muted">Critical</span>
              <span className="text-[10px] text-red-400 mt-0.5">↑ +2</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111622] px-4 py-2 rounded-lg border border-[#1E2638] min-w-[160px]">
            <div className="p-2 bg-yellow-500/10 rounded-full">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                 <span className="text-xl font-bold leading-none text-white">{unassignedCount}</span>
              </div>
              <span className="text-[11px] text-brand-muted">Unassigned</span>
              <span className="text-[10px] text-emerald-400 mt-0.5">↓ -1</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#111622] px-4 py-2 rounded-lg border border-[#1E2638] min-w-[160px]">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Ambulance size={20} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                 <span className="text-xl font-bold leading-none text-white">{unitsDeployed}</span>
              </div>
              <span className="text-[11px] text-brand-muted">Units Deployed</span>
              <span className="text-[10px] text-emerald-400 mt-0.5">↑ +3</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111622] px-4 py-2 rounded-lg border border-[#1E2638] min-w-[160px]">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Timer size={20} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                 <span className="text-xl font-bold leading-none font-mono text-white">{avgEta}</span>
              </div>
              <span className="text-[11px] text-brand-muted">Avg. Response Time</span>
              <span className="text-[10px] text-emerald-400 mt-0.5">↓ -18%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#111622] px-4 py-2 rounded-lg border border-[#1E2638] min-w-[160px]">
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <BarChart2 size={20} className="text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                 <span className="text-xl font-bold leading-none font-mono text-white">92%</span>
              </div>
              <span className="text-[11px] text-brand-muted">Dispatch Success</span>
              <span className="text-[10px] text-emerald-400 mt-0.5">↑ +5%</span>
            </div>
          </div>
        </div>

        {/* MAP */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-[#1E2638] mb-4">
          <LiveMap 
            onSelectIncident={setSelectedIncident} 
            selectedIncident={selectedIncident}
            mapFilter={mapFilter}
          />

          {/* Search and Filters (Floating Top Left) */}
          <div className="absolute top-4 left-4 z-[400] flex gap-2 font-sans">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search location, incident, resource..." 
                className="bg-[#0A0E17]/95 backdrop-blur-sm border border-[#1E2638] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-brand-muted w-[280px] focus:outline-none focus:border-blue-500 shadow-xl"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <div className="flex bg-[#0A0E17]/95 backdrop-blur-sm border border-[#1E2638] rounded-lg shadow-xl p-1">
              <button onClick={() => setMapFilter('All')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mapFilter === 'All' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}>All</button>
              <button onClick={() => setMapFilter('Incidents')} className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${mapFilter === 'Incidents' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}>
                 <div className="w-2 h-2 rounded-full bg-red-500"></div> Incidents
              </button>
              <button onClick={() => setMapFilter('Units')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mapFilter === 'Units' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}>Units</button>
              <button onClick={() => setMapFilter('Hospitals')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mapFilter === 'Hospitals' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}>Hospitals</button>
              <button onClick={() => setMapFilter('Flood Zones')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mapFilter === 'Flood Zones' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}>Flood Zones</button>
              <button onClick={() => setMapFilter('Road Closures')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mapFilter === 'Road Closures' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}>Road Closures</button>
            </div>
          </div>

          {/* Legends floating on map */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-[#0A0E17]/95 backdrop-blur-md border border-[#1E2638] rounded-xl p-3 flex gap-6 shadow-2xl font-sans min-w-[400px]">
            <div className="flex-1">
              <h4 className="text-[9px] text-brand-muted uppercase font-bold mb-2">Incident Severity</h4>
              <div className="flex flex-col gap-1.5 text-[10px] text-white">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>Critical</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>High</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>Medium</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>Low</div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-[9px] text-brand-muted uppercase font-bold mb-2">Resource Types</h4>
              <div className="flex flex-col gap-1.5 text-[10px] text-brand-muted">
                <div className="flex items-center gap-2">🚑 <span className="text-white">Ambulance</span></div>
                <div className="flex items-center gap-2">🚒 <span className="text-white">Fire Engine</span></div>
                <div className="flex items-center gap-2">🚤 <span className="text-white">Rescue Boat</span></div>
                <div className="flex items-center gap-2">🚓 <span className="text-white">Rescue Vehicle</span></div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-[9px] text-brand-muted uppercase font-bold mb-2">Other</h4>
              <div className="flex flex-col gap-1.5 text-[10px] text-brand-muted">
                <div className="flex items-center gap-2">🏥 <span className="text-white">Hospital</span></div>
                <div className="flex items-center gap-2">🚧 <span className="text-white">Road Closure</span></div>
                <div className="flex items-center gap-2">🌊 <span className="text-white">Flood Zone</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM OPERATIONS PANEL */}
        <div className="h-[140px] flex gap-4 shrink-0">
          
          {/* Box 1: Unit in Action */}
          <div className="flex-1 bg-[#111622] border border-[#1E2638] rounded-xl p-4 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start z-10 relative mb-2">
               <h4 className="text-sm font-bold text-white flex items-center gap-2">
                 <Ambulance size={14} /> Units in Action
               </h4>
               {selectedIncident && selectedIncident.status === 'dispatched' ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">En Route</div>
               ) : <Link to="/resources" className="text-[10px] text-brand-muted hover:text-white cursor-pointer transition-colors">View All →</Link>}
            </div>
            
            {selectedIncident && selectedIncident.status === 'dispatched' ? (
              <div className="flex gap-4 items-center z-10 relative">
                <img src="https://images.unsplash.com/photo-1599709664531-157945d8b85b?q=80&w=200&auto=format&fit=crop" className="w-20 h-16 rounded object-cover border border-[#1E2638]" alt="rescue boat" />
                <div className="flex flex-col flex-1 justify-center">
                  <div className="text-white font-bold font-mono text-sm mb-1">RESCUE-12</div>
                  <div className="text-brand-muted text-[10px] mb-2">Flood Rescue Unit</div>
                  
                  <div className="flex items-center gap-3 text-[10px] font-mono text-white">
                     <div className="flex items-center gap-1"><span className="text-brand-muted">4.8 km</span></div>
                     <div className="w-1 h-1 rounded-full bg-brand-muted"></div>
                     <div className="flex items-center gap-1"><span className="text-brand-muted">6 min ETA</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-brand-muted text-xs italic z-10 relative">
                Select a dispatched incident.
              </div>
            )}
          </div>

          {/* Box 2: Live Updates */}
          <div className="flex-1 bg-[#111622] border border-[#1E2638] rounded-xl p-4 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={14} /> Live Updates
              </h4>
              <Link to="/incidents" className="text-[10px] text-brand-muted hover:text-white cursor-pointer transition-colors">View All →</Link>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-[10px] overflow-y-auto">
              <div className="flex items-center gap-3">
                <span className="text-brand-muted">15:36</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-brand-muted">Incident reported (3 sources)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-muted">15:36</span>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-brand-muted">AI classification completed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-muted">15:37</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-white">RESCUE-12 dispatched</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-muted">15:38</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-white">En route to incident</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-muted">15:42</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-white">ETA updated: 6 min</span>
              </div>
            </div>
          </div>

          {/* Box 3: Weather & Conditions */}
          <div className="w-[180px] bg-[#111622] border border-[#1E2638] rounded-xl p-4 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
               Weather
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl">🌧️</span>
              <div>
                <div className="text-xl font-bold text-white font-mono leading-none">28°C</div>
                <div className="text-[10px] text-brand-muted mt-1">Light Rain</div>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="flex flex-col"><span className="text-brand-muted">Visibility</span><span className="text-white">Good</span></div>
              <div className="flex flex-col"><span className="text-brand-muted">Wind</span><span className="text-white">12 km/h</span></div>
            </div>
          </div>

          {/* Box 4: Incident Location */}
          {selectedIncident && (
            <div className="w-[200px] bg-[#111622] border border-[#1E2638] rounded-xl p-4 flex flex-col">
              <h4 className="text-sm font-bold text-white mb-2">Incident Location</h4>
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-[#1E2638] rounded shrink-0 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="text-[10px] text-brand-muted flex flex-col justify-center">
                  <div className="text-white font-bold truncate w-28">{selectedIncident.location_name || 'Harni Lake Area'}</div>
                  <div>Vadodara, Gujarat</div>
                  <div className="font-mono mt-0.5">{selectedIncident.lat?.toFixed(4)}, {selectedIncident.lng?.toFixed(4)}</div>
                </div>
              </div>
              <button className="w-full mt-auto bg-[#1E2638] hover:bg-[#2A3441] text-blue-400 py-1.5 rounded text-[10px] font-bold flex justify-center items-center gap-1 transition-colors">
                View in Google Maps ↗
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR (Incident Details) */}
      <div className="w-[420px] bg-[#0A0E17] border-l border-[#1E2638] flex flex-col h-full overflow-y-auto shrink-0 pb-4">
        {selectedIncident ? (
          <>
            <IncidentDrawer 
              incident={selectedIncident} 
              onClose={() => setSelectedIncident(null)} 
              onReviewDispatch={() => setIsDispatchModalOpen(true)}
              onResolveSuccess={(id) => {
                if (setIncidents) {
                  setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'resolved' } : inc));
                }
                setSelectedIncident(null);
              }}
            />
            {selectedIncident.status === 'dispatched' && (
              <div className="border-t border-[#1E2638]">
                <UnitTrackingPanel incident={selectedIncident} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[#1E2638] flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-white tracking-wide">INCIDENTS</h3>
              <span className="text-xs font-mono bg-[#111622] px-2 py-1 rounded text-brand-muted border border-[#1E2638]">
                {unassignedIncidents.length} NEW
              </span>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <IncidentList incidents={unassignedIncidents} onSelectIncident={setSelectedIncident} />
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isDispatchModalOpen && selectedIncident && (
        <DispatchModal 
          incident={selectedIncident} 
          onClose={() => {
            setIsDispatchModalOpen(false);
            setSelectedIncident(null);
          }}
          onDispatchSuccess={(incidentId) => {
            if (setIncidents) {
              setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'dispatched' } : inc));
            }
            setSelectedIncident(prev => prev && prev.id === incidentId ? { ...prev, status: 'dispatched' } : prev);
          }}
        />
      )}
    </div>
  );
}
