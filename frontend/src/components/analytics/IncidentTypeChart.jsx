import React from 'react';

export default function IncidentTypeChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div className="text-gray-500 text-sm italic">No data available</div>;
  }

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxVal = Math.max(...entries.map(e => e[1]));

  return (
    <div className="space-y-3">
      {entries.map(([type, count]) => {
        const percentage = maxVal > 0 ? (count / maxVal) * 100 : 0;
        return (
          <div key={type} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize font-medium text-gray-700">{type.replace('_', ' ')}</span>
              <span className="text-gray-500 font-semibold">{count}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
