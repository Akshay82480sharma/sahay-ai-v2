import React, { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../api/analytics';
import { formatDuration } from '../utils/time';
import IncidentTypeChart from '../components/analytics/IncidentTypeChart';
import StatusCountsChart from '../components/analytics/ResponseTimeChart'; // using the file we wrote

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalyticsSummary()
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-500 font-medium">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-red-500 font-medium bg-red-50 px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-500 font-medium">No analytics data available.</div>
      </div>
    );
  }

  const {
    avg_response_seconds = 0,
    resource_shortages = [],
    incidents_by_type = {},
    status_counts = {},
    hotspots = []
  } = data;

  const total_incidents = Object.values(incidents_by_type).reduce((acc, count) => acc + count, 0);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
      </div>
      
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 mb-1">Total Incidents</span>
          <span className="text-4xl font-bold text-gray-900">{total_incidents}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 mb-1">Avg Response Time</span>
          <span className="text-4xl font-bold text-blue-600">
            {formatDuration(avg_response_seconds)}
          </span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 mb-1">Resource Shortages</span>
          <span className={`text-4xl font-bold ${resource_shortages.length > 0 ? 'text-purple-600' : 'text-green-600'}`}>
            {resource_shortages.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incidents by Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-semibold text-gray-700">Incidents by Type</h3>
          </div>
          <div className="p-4 flex-1">
            <IncidentTypeChart data={incidents_by_type} />
          </div>
        </div>

        {/* Status Counts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-semibold text-gray-700">Incident Statuses</h3>
          </div>
          <div className="p-4 flex-1">
            <StatusCountsChart data={status_counts} />
          </div>
        </div>
      </div>

      {/* Hotspots Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">Incident Hotspots</h3>
        </div>
        <div className="p-0 overflow-x-auto">
          {hotspots.length === 0 ? (
            <div className="text-center p-6 text-gray-500 italic text-sm">No hotspot data available.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location (Lat, Lng)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nearest Place</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hotspots.map((spot, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Only use nearest-place label if a helper already existed; since it didn't, just show Unknown */}
                      <span className="italic">Unknown</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {spot.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
