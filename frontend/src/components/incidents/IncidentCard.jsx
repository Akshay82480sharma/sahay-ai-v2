import React from 'react';
import SeverityBadge from './SeverityBadge';
import { timeAgo } from '../../utils/time';

export default function IncidentCard({ incident }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900 capitalize">{incident.type || 'Unknown'}</h4>
        <SeverityBadge severity={incident.severity || 1} />
      </div>
      <p className="text-sm text-gray-500 mb-2 truncate">{incident.summary || 'No summary available.'}</p>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{incident.location_name || `${incident.lat?.toFixed(4)}, ${incident.lng?.toFixed(4)}`}</span>
        <div className="flex items-center gap-2">
          <span>Reports: {incident.report_count}</span>
          {incident.created_at && (
            <>
              <span>•</span>
              <span>{timeAgo(incident.created_at)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
