import React, { useState, useEffect } from 'react';
import { AlertTriangle, Map as MapIcon, Truck, Activity, Settings, BarChart2, PlayCircle, ChevronDown, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ConnectionBadge from './ConnectionBadge';
import { useIncidents } from '../../hooks/useIncidents';
import { useLiveData } from '../../context/LiveDataProvider';

export default function AppShell({ children }) {
  const { incidents } = useIncidents();
  // Safe extraction of resources
  let resources = [];
  try {
    const liveData = useLiveData();
    resources = liveData.resources || [];
  } catch(e) {}
  
  const location = useLocation();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [date, setDate] = useState('Sat, 28 Sep 2024'); // Mocked to match design
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/dashboard') return true;
    return location.pathname === path;
  };

  const SidebarIcon = ({ path, icon: Icon, label }) => {
    const active = isActive(path);
    return (
      <Link to={path} className={`flex flex-col items-center gap-1 p-2 w-full transition-colors border-l-2 ${active ? 'border-blue-500 text-blue-500' : 'border-transparent text-brand-muted hover:text-white hover:bg-[#1E2638]'}`}>
        <Icon size={20} />
        <span className="text-[10px] tracking-wide text-center leading-tight mt-1">{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#0A0E17] flex overflow-hidden text-brand-text font-sans">
      
      {/* FAR LEFT SIDEBAR */}
      <div className="w-[72px] bg-[#111622] border-r border-[#1E2638] flex flex-col items-center py-4 z-50 shrink-0">
        <div className="mb-6 px-2 flex justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        
        <div className="flex flex-col gap-4 w-full mt-2">
          <SidebarIcon path="/" icon={MapIcon} label="Command Center" />
          <SidebarIcon path="/incidents" icon={AlertTriangle} label="Incidents" />
          <SidebarIcon path="/resources" icon={Truck} label="Resources" />
          <SidebarIcon path="/analytics" icon={BarChart2} label="Analytics" />
          <SidebarIcon path="/simulation" icon={PlayCircle} label="Simulation" />
        </div>
        
        <div className="mt-auto w-full flex flex-col gap-4">
          <SidebarIcon path="/settings" icon={Settings} label="Settings" />
          <div className="text-[10px] text-brand-muted/50 text-center px-1 mb-2">Safer Cities<br/>Stronger<br/>Communities</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* TOP NAV BAR */}
        <div className="flex items-center justify-between px-6 py-2 bg-[#111622] border-b border-[#1E2638] shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold tracking-wider leading-none text-white">SAHAY AI</h1>
              <span className="text-[10px] text-brand-muted uppercase tracking-widest mt-0.5">Respond Faster. Save More.</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              SYSTEM OPERATIONAL
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-muted border-r border-[#1E2638] pr-5">
              <Activity size={14} className="text-emerald-500" />
              WebSocket <span className="text-emerald-500">Connected</span>
            </div>
            <div className="flex flex-col items-end leading-tight font-mono">
              <span className="text-white font-bold">{time}</span>
              <span className="text-xs text-brand-muted">{date}</span>
            </div>
            
            {/* Notifications Dropdown */}
            <div className="relative">
              <div 
                className="cursor-pointer text-brand-muted hover:text-white transition-colors"
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              >
                <Bell size={20} />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#111622] flex items-center justify-center text-[8px] text-white font-bold">3</div>
              </div>
              
              {showNotifications && (
                <div className="absolute top-8 right-0 w-80 bg-[#111622] border border-[#1E2638] rounded-xl shadow-2xl z-50 p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Notifications</h4>
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1"></div>
                      <div>
                        <div className="text-white font-bold">Critical Incident Reported</div>
                        <div className="text-brand-muted">Multiple calls for factory fire in Makarpura.</div>
                        <div className="text-brand-muted font-mono mt-1">2 mins ago</div>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                      <div>
                        <div className="text-white font-bold">Unit Deployed</div>
                        <div className="text-brand-muted">RESCUE-12 en route to INC-1042.</div>
                        <div className="text-brand-muted font-mono mt-1">15 mins ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <div 
                className="flex items-center gap-2 cursor-pointer pl-2 border-l border-[#1E2638]"
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              >
                <div className="w-8 h-8 rounded-full bg-[#1E2638] flex items-center justify-center text-white font-bold">A</div>
                <span className="text-white text-sm font-semibold">Operator</span>
                <ChevronDown size={14} className="text-brand-muted" />
              </div>
              
              {showProfile && (
                <div className="absolute top-10 right-0 w-48 bg-[#111622] border border-[#1E2638] rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-4 py-2 border-b border-[#1E2638]">
                    <div className="text-sm font-bold text-white">Akshay Sharma</div>
                    <div className="text-xs text-brand-muted">Level 2 Operator</div>
                  </div>
                  <Link 
                    to="/settings" 
                    onClick={() => setShowProfile(false)}
                    className="block px-4 py-2 hover:bg-[#1E2638] cursor-pointer text-sm text-brand-muted hover:text-white transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <div 
                    onClick={() => { alert('Shift Handover module not available in prototype.'); setShowProfile(false); }}
                    className="px-4 py-2 hover:bg-[#1E2638] cursor-pointer text-sm text-brand-muted hover:text-white transition-colors"
                  >
                    Change Shift
                  </div>
                  <div 
                    onClick={() => { alert('Signing out...'); window.location.reload(); }}
                    className="px-4 py-2 hover:bg-[#1E2638] cursor-pointer text-sm text-red-500 transition-colors"
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden flex relative">
            {children}
          </div>
        </div>
        
      </div>
    </div>
  );
}
