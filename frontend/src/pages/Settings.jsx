import React, { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [humanApproval, setHumanApproval] = useState(true);
  const [autoDeploy, setAutoDeploy] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-8 font-sans">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="text-brand-text" size={28} />
          <h1 className="text-2xl font-bold tracking-widest uppercase">SYSTEM PREFERENCES</h1>
        </div>

        <div className="flex flex-col gap-8 font-mono">
          
          <div>
            <h2 className="text-sm text-brand-muted uppercase mb-4 tracking-widest border-b border-brand-border pb-2">
              DISPATCH AUTOMATION
            </h2>
            <div className="bg-brand-panel p-6 rounded border border-brand-border flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-brand-text font-bold">Require Human Approval</span>
                  <span className="text-brand-muted text-sm">Force manual review of all AI dispatch recommendations</span>
                </div>
                <div 
                  onClick={() => setHumanApproval(!humanApproval)}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${humanApproval ? 'bg-status-success justify-end' : 'bg-brand-bg border border-brand-border justify-start'}`}
                >
                  <div className={`w-4 h-4 rounded-full ${humanApproval ? 'bg-white' : 'bg-brand-muted'}`}></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-brand-text font-bold">Auto-deploy on CRITICAL</span>
                  <span className="text-brand-muted text-sm">Bypass human review if confidence &gt; 95%</span>
                </div>
                <div 
                  onClick={() => setAutoDeploy(!autoDeploy)}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${autoDeploy ? 'bg-status-success justify-end' : 'bg-brand-bg border border-brand-border justify-start'}`}
                >
                  <div className={`w-4 h-4 rounded-full ${autoDeploy ? 'bg-white' : 'bg-brand-muted'}`}></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm text-brand-muted uppercase mb-4 tracking-widest border-b border-brand-border pb-2">
              NETWORK & TELEMETRY
            </h2>
            <div className="bg-brand-panel p-6 rounded border border-brand-border flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-text">WebSocket Endpoint</span>
                <span className="text-brand-muted">ws://localhost:8000/ws/live</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-text">Polling Fallback Interval</span>
                <span className="text-brand-muted">5000ms</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-text">Local Mutual Aid Radius</span>
                <span className="text-brand-muted">8.0 km</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
