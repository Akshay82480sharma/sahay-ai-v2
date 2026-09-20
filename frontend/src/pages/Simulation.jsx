import React, { useState } from 'react';
import { ArrowLeft, Play, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Simulation() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [status, setStatus] = useState('');

  const runSimulation = async () => {
    setIsSimulating(true);
    setStatus('Injecting synthetic telemetry payload...');
    
    try {
      await fetch('http://localhost:8000/simulate/flood', { method: 'POST' });
      setStatus('Scenario running! 50 incidents injected.');
      setTimeout(() => setStatus(''), 5000);
    } catch (err) {
      console.error(err);
      setStatus('Simulation failed. Is backend running?');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 font-sans">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-status-critical" size={28} />
          <h1 className="text-2xl font-bold tracking-widest uppercase">SIMULATION</h1>
        </div>

      <div className="bg-brand-panel border border-brand-border rounded p-6 max-w-md font-mono">
        <h2 className="text-brand-muted uppercase text-sm mb-4 tracking-widest">Scenario</h2>
        
        <div className="mb-6">
          <select className="w-full bg-brand-bg border border-brand-border rounded p-2 text-brand-text focus:outline-none">
            <option>Flood Response ▼</option>
          </select>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-brand-muted">Incidents</span>
          <span className="text-brand-text">50</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-brand-muted">Resources</span>
          <span className="text-brand-text">32</span>
        </div>
        <div className="flex justify-between items-center mb-8">
          <span className="text-brand-muted">Duration</span>
          <span className="text-brand-text">10 min</span>
        </div>

        <button 
          onClick={runSimulation}
          disabled={isSimulating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-border hover:bg-brand-muted text-brand-text font-mono font-bold tracking-widest transition-colors rounded disabled:opacity-50"
        >
          <Play size={16} />
          [ START SIMULATION ]
        </button>

        {status && (
          <div className="mt-4 text-center text-status-success text-sm">
            {status}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
