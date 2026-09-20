import React from 'react';
import { ArrowLeft, Ambulance } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockResources = {
  total: 42,
  available: 31,
  deployed: 8,
  offline: 3,
  categories: [
    {
      name: 'AMBULANCES',
      units: [
        { id: 'AMB-07', status: 'AVAILABLE', type: 'Medical' },
        { id: 'AMB-12', status: 'DEPLOYED', type: 'Medical' },
        { id: 'AMB-15', status: 'AVAILABLE', type: 'Medical' },
      ]
    },
    {
      name: 'FIRE UNITS',
      units: [
        { id: 'FIRE-03', status: 'AVAILABLE', type: 'Fire' },
        { id: 'FIRE-08', status: 'DEPLOYED', type: 'Fire' },
      ]
    },
    {
      name: 'RESCUE',
      units: [
        { id: 'BOAT-12', status: 'AVAILABLE', type: 'Flood Rescue' },
        { id: 'BOAT-14', status: 'OFFLINE', type: 'Flood Rescue' },
      ]
    }
  ]
};

const getStatusColor = (status) => {
  switch (status) {
    case 'AVAILABLE': return 'text-status-success';
    case 'DEPLOYED': return 'text-status-warning';
    case 'OFFLINE': return 'text-status-critical';
    default: return 'text-brand-muted';
  }
};

export default function Resources() {
  return (
    <div className="flex-1 overflow-y-auto p-8 font-sans">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <Ambulance className="text-brand-text" size={28} />
          <h1 className="text-2xl font-bold tracking-widest uppercase">RESOURCES</h1>
        </div>

      <div className="grid grid-cols-4 gap-8 mb-12 font-mono">
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-brand-text">{mockResources.total}</span>
          <span className="text-brand-muted uppercase text-sm">TOTAL</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-status-success">{mockResources.available}</span>
          <span className="text-brand-muted uppercase text-sm">AVAILABLE</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-status-warning">{mockResources.deployed}</span>
          <span className="text-brand-muted uppercase text-sm">DEPLOYED</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl text-status-critical">{mockResources.offline}</span>
          <span className="text-brand-muted uppercase text-sm">OFFLINE</span>
        </div>
      </div>

      <div className="flex flex-col gap-10 font-mono">
        {mockResources.categories.map((category, i) => (
          <div key={i}>
            <h2 className="text-sm text-brand-muted uppercase mb-4 tracking-widest border-b border-brand-border pb-2">
              {category.name}
            </h2>
            <div className="flex flex-col gap-3">
              {category.units.map((unit, j) => (
                <div key={j} className="flex justify-between items-center bg-brand-panel p-3 rounded border border-brand-border cursor-pointer hover:border-brand-muted transition-colors">
                  <div className="flex flex-col">
                    <span className="text-brand-text font-bold text-base">{unit.id}</span>
                    <span className="text-brand-muted text-xs">{unit.type}</span>
                  </div>
                  <span className={`${getStatusColor(unit.status)} text-sm font-bold tracking-widest`}>
                    {unit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
