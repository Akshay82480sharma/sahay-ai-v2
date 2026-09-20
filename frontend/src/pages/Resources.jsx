import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useLiveData } from '../context/LiveDataProvider';

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'available': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'dispatched': 
    case 'en_route':
    case 'on_scene':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'returning': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'maintenance':
    case 'offline': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';
  if (status === 'dispatched' || status === 'en_route' || status === 'on_scene') return 'En Route';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function Resources() {
  const { resources = [] } = useLiveData();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const typeMap = {
    'ambulance': 'Ambulance',
    'fire_engine': 'Fire',
    'flood_rescue': 'Rescue',
  };

  const getFilteredResources = () => {
    let filtered = resources;
    if (filter !== 'All') {
      filtered = filtered.filter(r => typeMap[r.type] === filter || (!typeMap[r.type] && filter === 'Other'));
    }
    if (search) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    }
    return filtered;
  };

  const filteredResources = getFilteredResources();

  const counts = {
    'All': resources.length,
    'Ambulance': resources.filter(r => typeMap[r.type] === 'Ambulance').length,
    'Fire': resources.filter(r => typeMap[r.type] === 'Fire').length,
    'Rescue': resources.filter(r => typeMap[r.type] === 'Rescue').length,
    'Other': resources.filter(r => !typeMap[r.type]).length,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0E17] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-wide">Resources</h1>
          <p className="text-brand-muted text-sm mt-1">Manage emergency units and their status</p>
        </div>

        {/* Tabs & Search */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-[#111622] rounded-lg border border-[#1E2638] p-1">
            {['All', 'Ambulance', 'Fire', 'Rescue', 'Other'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                  filter === tab 
                    ? 'bg-[#2563EB] text-white' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                {tab} <span className="ml-1 opacity-70">({counts[tab]})</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search units..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111622] border border-[#1E2638] rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-muted w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111622] border border-[#1E2638] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E2638] text-brand-muted text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Unit ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Current Assignment</th>
                <th className="px-6 py-4">ETA</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              {filteredResources.map((unit) => (
                <tr key={unit.id} className="border-b border-[#1E2638] last:border-0 hover:bg-[#1A2234] transition-colors">
                  <td className="px-6 py-4 font-bold">{unit.name}</td>
                  <td className="px-6 py-4 text-brand-muted capitalize">{(unit.type || 'Unknown').replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(unit.status)}`}>
                      {formatStatus(unit.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-muted">{unit.station}</td>
                  <td className="px-6 py-4 text-brand-muted">-</td>
                  <td className="px-6 py-4 text-brand-muted">-</td>
                </tr>
              ))}
              {filteredResources.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-brand-muted">
                    No resources found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
