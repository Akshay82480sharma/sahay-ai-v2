import React from 'react';
import { timeAgo } from '../../utils/time';

const getSeverityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'text-status-critical';
    case 'high': return 'text-status-high';
    case 'medium': return 'text-status-warning';
    case 'low': return 'text-status-info';
    default: return 'text-brand-muted';
  }
};

const getSeverityDot = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
};

export default function IncidentCard({ incident, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-brand-bg p-3 rounded border border-brand-border cursor-pointer hover:border-brand-muted transition-colors flex flex-col gap-1"
    >
      <div className="flex justify-between items-center text-sm font-mono tracking-wide">
        <div className="flex items-center gap-2">
          <span>{getSeverityDot(incident.priority)}</span>
          <span className={getSeverityColor(incident.priority)}>
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
