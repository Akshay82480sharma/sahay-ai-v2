import React, { useState, useMemo } from 'react';
import { useLiveData } from '../../context/LiveDataProvider';
import AlertItem from './AlertItem';
import { parseUtc } from '../../utils/time';

export default function AlertFeed() {
  const { alerts } = useLiveData();
  const [showUnacknowledgedOnly, setShowUnacknowledgedOnly] = useState(true);

  const processedAlerts = useMemo(() => {
    let result = [...alerts];
    
    // Sort: unacknowledged first, then newest first
    result.sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      return (parseUtc(b.created_at) || 0) - (parseUtc(a.created_at) || 0);
    });

    if (showUnacknowledgedOnly) {
      result = result.filter(a => !a.acknowledged);
    }

    return result;
  }, [alerts, showUnacknowledgedOnly]);

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800">Alerts</h3>
          {unacknowledgedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
              {unacknowledgedCount} New
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnacknowledgedOnly}
            onChange={(e) => setShowUnacknowledgedOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          Unacknowledged only
        </label>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {processedAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No alerts to display.</p>
          </div>
        ) : (
          processedAlerts.map(alert => (
            <AlertItem key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
