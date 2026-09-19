import React from 'react';
import { useLiveData } from '../../context/LiveDataProvider';

export default function ConnectionBadge() {
  const { connectionStatus } = useLiveData();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'open':
        return { label: 'Live', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
      case 'connecting':
        return { label: 'Connecting...', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500 animate-pulse' };
      case 'closed':
      default:
        return { label: 'Offline', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
    }
  };

  const { label, color, dot } = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`}></span>
      {label}
    </div>
  );
}
