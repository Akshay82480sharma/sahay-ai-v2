import React, { useMemo } from 'react';
import { useLiveData } from '../../context/LiveDataProvider';

export default function ResourcePanel() {
  const { resources } = useLiveData();

  const statsByType = useMemo(() => {
    const stats = {};
    resources.forEach(r => {
      if (!stats[r.type]) {
        stats[r.type] = { available: 0, dispatched: 0, busy: 0, total: 0 };
      }
      stats[r.type].total += 1;
      if (r.status === 'available') {
        stats[r.type].available += 1;
      } else if (r.status === 'dispatched' || r.status === 'en_route') {
        stats[r.type].dispatched += 1;
      } else {
        stats[r.type].busy += 1;
      }
    });
    return stats;
  }, [resources]);

  const totalAvailable = resources.filter(r => r.status === 'available').length;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Live Resources</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          {totalAvailable} / {resources.length} Available
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(statsByType).length === 0 ? (
          <div className="text-center text-gray-500 italic text-sm p-4">No resources tracked.</div>
        ) : (
          Object.entries(statsByType).map(([type, stats]) => (
            <div key={type} className="flex flex-col gap-1.5 p-3 border border-gray-100 rounded bg-gray-50/30">
              <span className="font-medium text-sm text-gray-800 capitalize">{type.replace('_', ' ')}</span>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-gray-600">{stats.available} Avail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-gray-600">{stats.dispatched} Disp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-gray-600">{stats.busy} Busy</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
