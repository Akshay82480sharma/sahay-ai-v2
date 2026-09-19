import React from 'react';

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Emergency Dashboard</h2>
        <div className="flex items-center gap-2">
          {/* ConnectionBadge will go here */}
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Phase A3 Base
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-semibold text-gray-700">Live Map</h3>
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500">
            [Map Placeholder - Phase A4]
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-semibold text-gray-700">Dispatch Panel</h3>
          </div>
          <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
            [Dispatch Panel Placeholder - Phase B4]
          </div>
        </div>
      </div>
    </div>
  );
}
