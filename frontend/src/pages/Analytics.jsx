import React, { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../api/analytics';
import { mmss } from '../utils/time';
import { Activity, ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
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
  const totalIncidents = Object.values(incidents_by_type).reduce((a, b) => a + b, 0) || 27;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0E17] text-white p-6 font-sans">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Analytics</h1>
            <p className="text-brand-muted text-sm mt-1">Insights and performance metrics</p>
          </div>
          <button className="flex items-center gap-2 bg-[#111622] border border-[#1E2638] px-4 py-2 rounded-lg text-sm text-white hover:border-brand-muted transition-colors">
            Last 24 hours <ChevronDown size={16} className="text-brand-muted" />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col gap-2">
            <span className="text-3xl font-mono font-bold">{totalIncidents}</span>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-muted">Total Incidents</span>
              <span className="text-emerald-500 font-bold text-xs">+12%</span>
            </div>
          </div>
          <div className="bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col gap-2">
            <span className="text-3xl font-mono font-bold text-red-500">8</span>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-muted">Critical</span>
              <span className="text-red-500 font-bold text-xs">-20%</span>
            </div>
          </div>
          <div className="bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col gap-2">
            <span className="text-3xl font-mono font-bold">{mmss(avg_response_seconds) || '7:24'}</span>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-muted">Avg Response Time</span>
              <span className="text-emerald-500 font-bold text-xs">-18%</span>
            </div>
          </div>
          <div className="bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col gap-2">
            <span className="text-3xl font-mono font-bold">92%</span>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-muted">Dispatch Success</span>
              <span className="text-emerald-500 font-bold text-xs">+4%</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-12 gap-6 h-[280px]">
          {/* Donut Chart */}
          <div className="col-span-4 bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-6">Incidents by Type</h3>
            <div className="flex-1 flex items-center justify-between">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1E2638" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="175" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="200" className="origin-center -rotate-[75deg]" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EAB308" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="220" className="origin-center -rotate-[125deg]" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="230" className="origin-center -rotate-[175deg]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono">{totalIncidents}</span>
                  <span className="text-[10px] text-brand-muted uppercase">Total</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-1 ml-6 text-sm">
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-brand-muted">Flood</span></div><span className="font-mono">32%</span></div>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-brand-muted">Fire</span></div><span className="font-mono">22%</span></div>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-brand-muted">Medical</span></div><span className="font-mono">18%</span></div>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-brand-muted">Accident</span></div><span className="font-mono">14%</span></div>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div><span className="text-brand-muted">Other</span></div><span className="font-mono">14%</span></div>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="col-span-8 bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white">Incidents Trend</h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-brand-muted">Incidents</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-brand-muted">Critical</span></div>
              </div>
            </div>
            <div className="flex-1 relative border-b border-l border-[#1E2638] ml-6 mb-4">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* Grid lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#1E2638" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#1E2638" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#1E2638" strokeWidth="0.5" strokeDasharray="2" />
                
                {/* Incident Line (Blue) */}
                <path d="M 0,80 L 10,75 L 20,60 L 30,65 L 40,40 L 50,55 L 60,30 L 70,35 L 80,45 L 90,20 L 100,25" fill="none" stroke="#3B82F6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                
                {/* Critical Line (Red) */}
                <path d="M 0,90 L 10,85 L 20,80 L 30,85 L 40,75 L 50,80 L 60,65 L 70,70 L 80,75 L 90,60 L 100,65" fill="none" stroke="#EF4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              {/* Y Axis Labels */}
              <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-[10px] text-brand-muted">
                <span>30</span><span>20</span><span>10</span><span>0</span>
              </div>
              {/* X Axis Labels */}
              <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[10px] text-brand-muted">
                <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-12 gap-6 h-[240px]">
          {/* Horizontal Bar Chart 1 */}
          <div className="col-span-7 bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-6">Response Time by Type</h3>
            <div className="flex-1 flex flex-col justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-brand-muted w-16 text-right text-xs">Flood</span>
                <div className="flex-1 h-3 bg-[#1E2638] rounded-r overflow-hidden"><div className="h-full bg-blue-500 w-[82%]"></div></div>
                <span className="font-mono text-xs w-8">8.2</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-brand-muted w-16 text-right text-xs">Fire</span>
                <div className="flex-1 h-3 bg-[#1E2638] rounded-r overflow-hidden"><div className="h-full bg-red-500 w-[60%]"></div></div>
                <span className="font-mono text-xs w-8">6.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-brand-muted w-16 text-right text-xs">Medical</span>
                <div className="flex-1 h-3 bg-[#1E2638] rounded-r overflow-hidden"><div className="h-full bg-yellow-500 w-[34%]"></div></div>
                <span className="font-mono text-xs w-8">3.4</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-brand-muted w-16 text-right text-xs">Accident</span>
                <div className="flex-1 h-3 bg-[#1E2638] rounded-r overflow-hidden"><div className="h-full bg-purple-500 w-[78%]"></div></div>
                <span className="font-mono text-xs w-8">7.8</span>
              </div>
            </div>
          </div>

          {/* Horizontal Progress Bars 2 */}
          <div className="col-span-5 bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-6">Unit Utilization</h3>
            <div className="flex-1 flex flex-col justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-brand-muted text-xs">Ambulance</span></div>
                <div className="flex-1 h-2 bg-[#1E2638] rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[78%]"></div></div>
                <span className="font-mono text-xs w-8">78%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-brand-muted text-xs">Fire Engine</span></div>
                <div className="flex-1 h-2 bg-[#1E2638] rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[65%]"></div></div>
                <span className="font-mono text-xs w-8">65%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-brand-muted text-xs">Rescue</span></div>
                <div className="flex-1 h-2 bg-[#1E2638] rounded-full overflow-hidden"><div className="h-full bg-yellow-500 w-[82%]"></div></div>
                <span className="font-mono text-xs w-8">82%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-brand-muted text-xs">Other</span></div>
                <div className="flex-1 h-2 bg-[#1E2638] rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[54%]"></div></div>
                <span className="font-mono text-xs w-8">54%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
