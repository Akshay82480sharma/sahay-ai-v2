import React, { useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const SCENARIOS = {
  flood: {
    title: 'Flood Scenario',
    subtitle: 'Heavy rainfall and urban flooding',
    desc: 'Simulates heavy rainfall in Vadodara with multiple flood incidents, rising water levels, and resource deployment.',
    duration: '~ 15 minutes',
    incidents: '8 - 12',
    includes: ['Sensor data', 'citizen reports', 'road closure dispatch'],
    difficulty: 'Medium',
    diffColor: 'text-yellow-500'
  },
  factory_fire: {
    title: 'Fire Outbreak',
    subtitle: 'Multiple fire incidents',
    desc: 'Simulates an industrial fire spreading rapidly across multiple factory units.',
    duration: '~ 10 minutes',
    incidents: '4 - 6',
    includes: ['Heat sensors', 'smoke alarms', 'evacuation'],
    difficulty: 'Hard',
    diffColor: 'text-red-500'
  },
  road_accident: {
    title: 'Mass Casualty Accident',
    subtitle: 'Highway collision simulation',
    desc: 'Simulates a major multi-vehicle collision on the highway requiring triage and multiple ambulances.',
    duration: '~ 8 minutes',
    incidents: '1',
    includes: ['Traffic cams', 'police reports', 'triage'],
    difficulty: 'High',
    diffColor: 'text-orange-500'
  },
  heatwave: {
    title: 'Heatwave Emergency',
    subtitle: 'Heat-related incidents',
    desc: 'Simulates a severe heatwave resulting in multiple medical emergencies across the city.',
    duration: '~ 24 hours (accelerated)',
    incidents: '15 - 20',
    includes: ['Weather alerts', 'hospital capacity', 'medical dispatch'],
    difficulty: 'Medium',
    diffColor: 'text-yellow-500'
  },
  festival: {
    title: 'Festival Crowd Management',
    subtitle: 'High-density crowd scenario',
    desc: 'Simulates a major religious festival with dense crowds, potential stampedes, and missing persons.',
    duration: '~ 30 minutes',
    incidents: '5 - 8',
    includes: ['Drone feeds', 'CCTV analytics', 'police deployment'],
    difficulty: 'Hard',
    diffColor: 'text-red-500'
  }
};

export default function Simulation() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('flood');

  const startSimulation = async () => {
    setLoading(true);
    setStatus(`00:00 ${SCENARIOS[scenario].title} initiated\n00:02 First report generated\n00:04 Multiple reports incoming\n00:07 Resource deployment`);
    
    try {
      await fetch(`http://localhost:8000/simulate/${scenario}`, { 
        method: 'POST',
        headers: {
          'admin-token': 'sahay_demo_2026'
        }
      });
      setTimeout(() => setStatus(prev => prev + '\n00:10 Additional incidents\n00:15 Simulation complete'), 2000);
    } catch (err) {
      console.error(err);
      setStatus('Failed to connect to simulator.');
    } finally {
      setLoading(false);
    }
  };

  const current = SCENARIOS[scenario];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0E17] text-white p-6 font-sans">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Simulation</h1>
            <p className="text-brand-muted text-sm mt-1">Run emergency scenarios for training and demonstration</p>
          </div>
          <div className="bg-[#111622] border border-[#1E2638] px-4 py-2 rounded-lg text-sm text-brand-muted font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Last Run: 08:34
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[500px]">
          {/* Column 1: Scenario Library */}
          <div className="col-span-3 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-brand-muted mb-2">Scenario Library</h3>
            
            {Object.entries(SCENARIOS).map(([key, data]) => {
              const isActive = scenario === key;
              return (
                <div 
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`rounded-lg p-4 cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-[#1E2638] border-l-4 border-blue-500 rounded-l-none' 
                      : 'border border-[#1E2638] hover:bg-[#111622]'
                  }`}
                >
                  <div className="font-bold text-white text-sm">{data.title}</div>
                  <div className="text-xs text-brand-muted mt-1">{data.subtitle}</div>
                </div>
              );
            })}
          </div>

          {/* Column 2: Scenario Details */}
          <div className="col-span-5 bg-[#111622] border border-[#1E2638] rounded-xl p-6 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
            <p className="text-sm text-brand-muted leading-relaxed mb-8">
              {current.desc}
            </p>
            
            <div className="flex flex-col gap-6 text-sm">
              <div className="grid grid-cols-3">
                <span className="text-brand-muted col-span-1">Duration</span>
                <span className="text-white col-span-2 font-mono">{current.duration}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-brand-muted col-span-1">Incidents Generated</span>
                <span className="text-white col-span-2 font-mono">{current.incidents}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-brand-muted col-span-1">Includes</span>
                <span className="text-brand-muted col-span-2">
                  {current.includes.map((inc, i) => (
                    <React.Fragment key={i}>
                      {inc}{i < current.includes.length - 1 && <>,<br/></>}
                    </React.Fragment>
                  ))}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-brand-muted col-span-1">Difficulty</span>
                <span className={`${current.diffColor} font-bold col-span-2`}>{current.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Controls & Events */}
          <div className="col-span-4 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-brand-muted mb-4">Simulation Controls</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={startSimulation}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Play size={18} />
                  {loading ? 'Initializing...' : 'Start Simulation'}
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStatus(prev => prev ? prev + '\n[SYSTEM] Simulation paused by operator' : prev)}
                    className="flex-1 bg-[#111622] border border-[#1E2638] hover:bg-[#1E2638] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Pause size={16} /> Pause
                  </button>
                  <button 
                    onClick={async () => {
                      setStatus('Resetting simulation environment...');
                      try {
                        await fetch('http://localhost:8000/simulate/reset', { 
                          method: 'POST',
                          headers: { 'admin-token': 'sahay_demo_2026' }
                        });
                        setStatus('');
                        // Trigger a hard reload to clear context data
                        window.location.reload();
                      } catch(e) {
                        setStatus('Failed to reset simulation.');
                      }
                    }}
                    className="flex-1 bg-[#111622] border border-[#1E2638] hover:bg-[#1E2638] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-[#111622] border border-[#1E2638] rounded-xl p-5 flex flex-col">
              <h3 className="text-sm font-bold text-brand-muted mb-4">Simulation Events</h3>
              <div className="flex-1 overflow-y-auto font-mono text-sm text-brand-muted whitespace-pre-line leading-loose">
                {status || "Ready to initiate sequence..."}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
