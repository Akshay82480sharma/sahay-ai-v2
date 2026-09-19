import React, { useState } from 'react';
import { timeAgo } from '../../utils/time';
import { acknowledgeAlert } from '../../api/alerts';
import { useLiveData } from '../../context/LiveDataProvider';

export default function AlertItem({ alert }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setAlerts } = useLiveData();

  const handleAcknowledge = async () => {
    setLoading(true);
    setError(null);
    
    // Optimistic update
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged: true } : a));

    try {
      await acknowledgeAlert(alert.id);
    } catch (err) {
      // Rollback on error
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged: false } : a));
      setError(err.message || 'Failed to acknowledge');
    } finally {
      setLoading(false);
    }
  };

  const getKindConfig = () => {
    switch (alert.kind) {
      case 'critical': return { color: 'bg-red-100 text-red-800 border-red-200', label: '[CRITICAL]', pulse: !alert.acknowledged };
      case 'escalation': return { color: 'bg-red-100 text-red-800 border-red-200', label: '[ESCALATED]', pulse: false };
      case 'delayed': return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: '[DELAYED]', pulse: false };
      case 'shortage': return { color: 'bg-purple-100 text-purple-800 border-purple-200', label: '[SHORTAGE]', pulse: false };
      default: return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: '[INFO]', pulse: false };
    }
  };

  const { color, label, pulse } = getKindConfig();
  const isNewCritical = pulse && !alert.acknowledged;

  return (
    <div className={`p-4 rounded-lg border ${color} bg-white transition-opacity ${alert.acknowledged ? 'opacity-60' : 'opacity-100'} relative overflow-hidden shadow-sm`}>
      {isNewCritical && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" aria-label="New critical alert indicator"></div>
      )}
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${color}`}>
            {label} {alert.kind.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            Incident #{alert.incident_id}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {timeAgo(alert.created_at)}
        </span>
      </div>
      
      <p className="text-sm text-gray-800 font-medium mb-3 pl-2">
        {alert.message}
      </p>
      
      <div className="flex items-center justify-between pl-2">
        <div className="text-xs text-red-600 font-medium h-4">
          {error && <span>{error}</span>}
        </div>
        {!alert.acknowledged && (
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Acknowledge'}
          </button>
        )}
      </div>
    </div>
  );
}
