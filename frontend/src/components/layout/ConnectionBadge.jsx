import React from 'react';
import { useLiveData } from '../../context/LiveDataProvider';

export default function ConnectionBadge() {
  const { connectionStatus } = useLiveData();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'open':
        return { label: 'LIVE', textColor: 'text-status-success', dot: 'bg-status-success animate-pulse' };
      case 'connecting':
        return { label: 'CONNECTING...', textColor: 'text-status-warning', dot: 'bg-status-warning animate-pulse' };
      case 'closed':
      default:
        return { label: 'OFFLINE', textColor: 'text-status-critical', dot: 'bg-status-critical' };
    }
  };

  const { label, textColor, dot } = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${textColor}`}>
      <div className={`w-2 h-2 rounded-full ${dot}`}></div>
      {label}
    </div>
  );
}
