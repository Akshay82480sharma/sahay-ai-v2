import React from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import IncidentCard from './IncidentCard';

export default function IncidentList({ incidents, onSelectIncident }) {
  const { loading, error } = useIncidents();

  if (loading) return <div className="p-4 text-center text-brand-muted font-mono text-sm">Loading...</div>;
  if (error) return <div className="p-4 text-center text-status-critical font-mono text-sm">Error: Failed to fetch</div>;
  if (!incidents || incidents.length === 0) return <div className="p-4 text-center text-brand-muted font-mono text-sm">No new incidents</div>;

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full scrollbar-thin">
      {incidents.map(inc => (
        <IncidentCard 
          key={inc.id} 
          incident={inc} 
          onClick={() => onSelectIncident(inc)}
        />
      ))}
    </div>
  );
}
