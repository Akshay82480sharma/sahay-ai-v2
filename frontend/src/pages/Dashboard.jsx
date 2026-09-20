import React, { useState } from 'react';
import LiveMap from '../components/map/LiveMap';
import IncidentList from '../components/incidents/IncidentList';
import IncidentDrawer from '../components/incidents/IncidentDrawer';
import DispatchModal from '../components/dispatch/DispatchModal';
import { useIncidents } from '../hooks/useIncidents';

export default function Dashboard() {
  const { incidents } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  
  const unassignedIncidents = incidents?.filter(i => i.status === 'new') || [];
  
  return (
    <div className="flex-1 flex h-full min-h-0 bg-brand-bg">
      {/* MAP (Center) */}
      <div className="flex-1 relative">
        <LiveMap />
      </div>
      
      {/* INCIDENTS (Right Panel) */}
      <div className="w-80 bg-brand-panel border-l border-brand-border flex flex-col min-h-0 relative">
        <div className="p-4 border-b border-brand-border flex justify-between items-center">
          <h3 className="font-semibold text-brand-text tracking-wide">INCIDENTS</h3>
          <span className="text-xs font-mono bg-brand-bg px-2 py-1 rounded text-brand-muted border border-brand-border">
            {unassignedIncidents.length} NEW
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <IncidentList incidents={unassignedIncidents} onSelectIncident={setSelectedIncident} />
          {selectedIncident && (
            <IncidentDrawer 
              incident={selectedIncident} 
              onClose={() => setSelectedIncident(null)} 
              onReviewDispatch={() => setIsDispatchModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* MODALS */}
      {isDispatchModalOpen && selectedIncident && (
        <DispatchModal 
          incident={selectedIncident} 
          onClose={() => {
            setIsDispatchModalOpen(false);
            setSelectedIncident(null);
          }} 
        />
      )}
    </div>
  );
}
