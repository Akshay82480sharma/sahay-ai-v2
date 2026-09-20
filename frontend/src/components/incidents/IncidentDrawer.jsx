import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { timeAgo } from '../../utils/time';

const getSeverityDot = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
};

const getSeverityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'text-status-critical';
    case 'high': return 'text-status-high';
    case 'medium': return 'text-status-warning';
    case 'low': return 'text-status-info';
    default: return 'text-brand-muted';
  }
};

export default function IncidentDrawer({ incident, onClose, onReviewDispatch }) {
  if (!incident) return null;

  const confidencePercent = incident.confidence <= 1 ? Math.round(incident.confidence * 100) : incident.confidence || 85;

  return (
    <div className="absolute inset-0 bg-brand-panel z-10 flex flex-col border-l border-brand-border">
      {/* Header */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between">
        <button onClick={onClose} className="text-brand-muted hover:text-brand-text flex items-center gap-2 font-mono text-sm">
          <ArrowLeft size={16} />
          INCIDENT #{incident.id.toString().padStart(4, '0')}
        </button>
        <button onClick={onClose} className="text-brand-muted hover:text-brand-text">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Title block */}
        <div>
          <div className={`font-mono font-bold flex items-center gap-2 mb-1 ${getSeverityColor(incident.priority)}`}>
            <span>{getSeverityDot(incident.priority)}</span>
            {incident.priority?.toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">{incident.type}</h2>
          <div className="text-brand-muted mt-2 space-y-1">
            <div>{incident.location_name || `${incident.lat?.toFixed(4)}, ${incident.lng?.toFixed(4)}`}</div>
            <div>Reported {timeAgo(incident.created_at)}</div>
          </div>
        </div>

        <hr className="border-brand-border" />

        {/* Situation */}
        <div>
          <h3 className="text-xs font-mono text-brand-muted mb-3 uppercase">Situation</h3>
          <p className="text-brand-text leading-relaxed">
            {incident.summary}
          </p>
        </div>

        <hr className="border-brand-border" />

        {/* AI Assessment */}
        <div>
          <h3 className="text-xs font-mono text-brand-muted mb-3 uppercase">AI Assessment</h3>
          <div className="flex justify-between items-center mb-3 font-mono text-sm">
            <span className="text-brand-text uppercase tracking-wider">Confidence</span>
            <span className="text-status-success">{confidencePercent}%</span>
          </div>
          <ul className="text-brand-text space-y-2 text-sm font-mono">
            <li className="flex gap-2"><span className="text-status-info">›</span> Operational Score: {incident.score}/100</li>
            <li className="flex gap-2"><span className="text-status-info">›</span> Corroborated by {incident.report_count} reports</li>
            <li className="flex gap-2"><span className="text-status-info">›</span> Priority locked as {incident.priority?.toUpperCase()}</li>
          </ul>
        </div>

        <hr className="border-brand-border" />

        {/* Recommended */}
        <div>
          <h3 className="text-xs font-mono text-brand-muted mb-3 uppercase">Recommended Resources</h3>
          <div className="flex flex-col gap-2">
            {Array.isArray(incident.required_resources) && incident.required_resources.length > 0 ? (
              incident.required_resources.map((res, i) => (
                <div key={i} className="flex justify-between items-center bg-brand-bg p-2 rounded border border-brand-border font-mono text-sm">
                  <span className="text-brand-text">🚤 {res}</span>
                  <span className="text-status-warning">~ ETA</span>
                </div>
              ))
            ) : (
              <div className="text-brand-muted italic text-sm">Pending assessment...</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-brand-border bg-brand-bg">
        <button 
          onClick={onReviewDispatch}
          className="w-full py-3 bg-brand-border hover:bg-brand-muted text-brand-text font-mono font-bold tracking-widest transition-colors rounded"
        >
          [ REVIEW DISPATCH ]
        </button>
      </div>
    </div>
  );
}
