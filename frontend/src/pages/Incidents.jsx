import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Plus } from 'lucide-react';
import { useIncidents } from '../hooks/useIncidents';

const getSeverityClass = (sev) => {
  switch (sev?.toLowerCase()) {
    case 'critical': return 'bg-red-500/10 text-red-500 border border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    case 'low': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    default: return 'text-brand-muted';
  }
};

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'text-emerald-500';
    case 'dispatched': return 'text-emerald-500';
    case 'new': return 'text-blue-500';
    case 'resolved': return 'text-slate-500';
    default: return 'text-white';
  }
};

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function Incidents() {
  const { incidents } = useIncidents();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const filteredIncidents = (incidents || []).filter(inc => {
    // Tab filter
    if (activeTab === 'Active' && inc.status === 'resolved') return false;
    if (activeTab === 'Critical' && inc.priority !== 'critical') return false;
    if (activeTab === 'High' && inc.priority !== 'high') return false;
    if (activeTab === 'Medium' && inc.priority !== 'medium') return false;
    if (activeTab === 'Low' && inc.priority !== 'low') return false;
    if (activeTab === 'Resolved' && inc.status !== 'resolved') return false;
    
    // Search filter
    if (search && !inc.title?.toLowerCase().includes(search.toLowerCase()) && !inc.type?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const counts = {
    All: incidents?.length || 0,
    Active: incidents?.filter(i => i.status !== 'resolved').length || 0,
    Critical: incidents?.filter(i => i.priority === 'critical').length || 0,
    High: incidents?.filter(i => i.priority === 'high').length || 0,
    Medium: incidents?.filter(i => i.priority === 'medium').length || 0,
    Low: incidents?.filter(i => i.priority === 'low').length || 0,
    Resolved: incidents?.filter(i => i.status === 'resolved').length || 0,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0E17] text-white p-6 font-sans">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Incidents</h1>
            <p className="text-brand-muted text-sm mt-1">Real-time incident management</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm">
            <Plus size={16} /> Add Incident
          </button>
        </div>

        <div className="bg-[#111622] border border-[#1E2638] rounded-xl flex flex-col overflow-hidden min-h-[600px]">
          
          {/* Tabs */}
          <div className="flex px-2 pt-2 border-b border-[#1E2638] overflow-x-auto">
            {['All', 'Active', 'Critical', 'High', 'Medium', 'Low', 'Resolved'].map(tab => {
              const isActive = activeTab === tab;
              let countClass = "text-brand-muted";
              if (tab === 'Critical') countClass = "text-red-500";
              if (tab === 'High') countClass = "text-orange-500";
              
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
                    isActive ? 'border-blue-500 text-white' : 'border-transparent text-brand-muted hover:text-white'
                  }`}
                >
                  <span className={tab === 'Critical' && isActive ? 'text-red-500' : ''}>
                    {tab}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#1A2234] ${countClass}`}>
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-[#1E2638]">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incidents..." 
                className="w-full bg-[#0A0E17] border border-[#1E2638] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-muted bg-[#0A0E17]/50 border-b border-[#1E2638]">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Severity</th>
                  <th className="px-6 py-4 font-semibold">Reported</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]">
                {filteredIncidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    onClick={() => navigate('/', { state: { selectedIncidentId: incident.id } })}
                    className="hover:bg-[#1A2234] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-white">#{String(incident.id).padStart(4, '0')}</td>
                    <td className="px-6 py-4 text-brand-muted">{incident.type || 'Other'}</td>
                    <td className="px-6 py-4 text-brand-muted">{incident.location_name || 'Vadodara'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${getSeverityClass(incident.priority)}`}>
                        {incident.priority || 'Low'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-brand-muted">{formatTime(incident.timestamp)}</td>
                    <td className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                      <span className={getStatusClass(incident.status)}>{incident.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button className="text-brand-muted hover:text-white transition-colors p-1 rounded hover:bg-[#1E2638]">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredIncidents.length === 0 && (
              <div className="flex justify-center items-center h-48 text-brand-muted">
                No incidents found.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
