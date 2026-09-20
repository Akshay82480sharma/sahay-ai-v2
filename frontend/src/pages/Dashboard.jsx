import React from 'react';
import LiveMap from '../components/map/LiveMap';
import IncidentList from '../components/incidents/IncidentList';
import ConnectionBadge from '../components/layout/ConnectionBadge';
import AlertFeed from '../components/alerts/AlertFeed';
import DispatchPanel from '../components/dispatch/DispatchPanel';
import ResourcePanel from '../components/resources/ResourcePanel';

export default function Dashboard() {
  // TODO(Person A): Update IncidentList/LiveMap to set this state when an incident is clicked
  const selectedIncidentId = null;

  return (
    <div className="flex-1 flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Emergency Dashboard</h2>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-700">Active Incidents</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <IncidentList />
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <ResourcePanel />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
          <LiveMap />
        </div>
        
        <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-700">Dispatch Panel</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <DispatchPanel incidentId={selectedIncidentId} />
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <AlertFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
