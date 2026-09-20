import React from 'react';
import { timeAgo } from '../../utils/time';

const getSeverityColor = (severity) => {
  if (severity >= 5) return 'text-status-critical';
  if (severity === 4) return 'text-status-high';
  if (severity === 3) return 'text-status-warning';
  return 'text-status-info';
};

const getSeverityDot = (severity) => {
  if (severity >= 5) return '🔴';
  if (severity === 4) return '🟠';
  if (severity === 3) return '🟡';
  return '🔵';
};

export default function IncidentCard({ incident, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-brand-bg p-3 rounded border border-brand-border cursor-pointer hover:border-brand-muted transition-colors flex flex-col gap-1"
    >
      <div className="flex justify-between items-center text-sm font-mono tracking-wide">
        <div className="flex items-center gap-2">
          <span>{getSeverityDot(incident.severity)}</span>
          <span className={getSeverityColor(incident.severity)}>
            #{incident.id.toString().padStart(4, '0')}
          </span>
        </div>
        <span className="text-brand-muted text-xs">{timeAgo(incident.created_at)}</span>
      </div>
      <div className="font-semibold text-brand-text capitalize mt-1">
        {incident.type || 'Unknown'}
      </div>
      <div className="text-sm text-brand-muted truncate">
        {incident.summary || 'No summary available.'}
      </div>
    </div>
  );
}
