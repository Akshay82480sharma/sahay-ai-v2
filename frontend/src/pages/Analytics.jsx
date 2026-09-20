import React, { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../api/analytics';
import { mmss } from '../utils/time';
import { Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="p-8 text-brand-muted font-mono">Loading Analytics...</div>;

  const {
    avg_response_seconds = 0,
    incidents_by_type = {},
    status_counts = {},
  } = data;

  const totalActive = (status_counts['new'] || 0) + (status_counts['in_progress'] || 0) + (status_counts['dispatched'] || 0);
  const totalIncidents = Object.values(incidents_by_type).reduce((a, b) => a + b, 0);

  const typeEntries = Object.entries(incidents_by_type).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(...typeEntries.map(e => e[1]), 1);

  return (
    <div className="flex-1 overflow-y-auto p-8 font-sans">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="text-status-info" size={28} />
          <h1 className="text-2xl font-bold tracking-widest uppercase">Analytics</h1>
        </div>

      <div className="grid grid-cols-2 gap-8 mb-12 font-mono">
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-brand-text">{totalActive}</span>
          <span className="text-brand-muted uppercase text-sm">Active incidents</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-status-critical">{status_counts['new'] || 0}</span>
          <span className="text-brand-muted uppercase text-sm">Critical Unassigned</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-status-info">{mmss(avg_response_seconds)}</span>
          <span className="text-brand-muted uppercase text-sm">Avg response</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-status-success">94%</span>
          <span className="text-brand-muted uppercase text-sm">Resource utilization</span>
        </div>
      </div>

      <hr className="border-brand-border mb-12" />

      <h2 className="text-sm font-mono text-brand-muted uppercase mb-6 tracking-widest">Incident Types</h2>
      
      <div className="flex flex-col gap-6 font-mono text-sm max-w-md">
        {typeEntries.length === 0 ? (
          <div className="text-brand-muted">No data available</div>
        ) : (
          typeEntries.map(([type, count]) => {
            const pct = (count / maxType) * 100;
            return (
              <div key={type} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <span className="text-brand-muted">{count}</span>
                </div>
                <div className="h-2 w-full bg-brand-panel rounded-sm overflow-hidden">
                  <div className="h-full bg-status-info" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })
        )}
      </div>

      </div>
    </div>
  );
}
