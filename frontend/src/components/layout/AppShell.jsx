import React, { useState, useEffect } from 'react';
import { ShieldAlert, Map as MapIcon, Ambulance, Activity, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ConnectionBadge from './ConnectionBadge';
import { useIncidents } from '../../hooks/useIncidents';

export default function AppShell({ children }) {
  const { incidents } = useIncidents();
  const location = useLocation();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCount = incidents?.length || 0;
  const criticalCount = incidents?.filter(i => i.priority === 'critical' || i.score >= 80).length || 0;
  const unassignedCount = incidents?.filter(i => i.status === 'new').length || 0;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/dashboard') return true;
    return location.pathname === path;
  };

  const getIconClass = (path) => {
    return isActive(path) ? "text-status-info" : "text-brand-muted hover:text-status-info transition-colors";
  };

  return (
    <div className="h-screen w-screen bg-brand-bg flex flex-col overflow-hidden text-brand-text font-sans">
      
      {/* TOPBAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-panel border-b border-brand-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-wider">SAHAY <span className="font-normal text-brand-muted ml-2">Command Center</span></h1>
        </div>
        <div className="flex items-center gap-6 font-mono text-sm">
          <ConnectionBadge />
          <span className="text-brand-muted">{time}</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 min-h-0">
        
        {/* SIDEBAR */}
        <div className="w-16 bg-brand-panel border-r border-brand-border flex flex-col items-center py-6 gap-8">
          <Link to="/" className={getIconClass('/')}>
            <MapIcon size={24} />
          </Link>
          <Link to="/analytics" className={getIconClass('/analytics')}>
            <Activity size={24} />
          </Link>
          <Link to="/resources" className={getIconClass('/resources')}>
            <Ambulance size={24} />
          </Link>
          <div className="mt-auto">
            <Link to="/simulation" className={`${getIconClass('/simulation')} block mb-6`}>
              <ShieldAlert size={24} />
            </Link>
            <Link to="/settings" className={`${getIconClass('/settings')} block`}>
              <Settings size={24} />
            </Link>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {children}
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="h-10 bg-brand-panel border-t border-brand-border flex items-center px-4 gap-8 font-mono text-xs tracking-wider">
        <div className="flex items-center gap-2">
          <span className="text-brand-muted">ACTIVE</span>
          <span className="text-brand-text">{activeCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-brand-muted">CRITICAL</span>
          <span className="text-status-critical">{criticalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-brand-muted">UNASSIGNED</span>
          <span className="text-status-warning">{unassignedCount}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-brand-muted">AVG ETA</span>
          <span className="text-brand-text">--:--</span>
        </div>
      </div>
      
    </div>
  );
}
