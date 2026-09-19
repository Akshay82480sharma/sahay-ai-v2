import React from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import IncidentCard from './IncidentCard';

export default function IncidentList() {
  const { incidents, loading, error } = useIncidents();

  if (loading) return <div className="p-4 text-center text-gray-500">Loading incidents...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!incidents || incidents.length === 0) return <div className="p-4 text-center text-gray-500">No active incidents</div>;

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {incidents.map(inc => (
        <IncidentCard key={inc.id} incident={inc} />
      ))}
    </div>
  );
}
