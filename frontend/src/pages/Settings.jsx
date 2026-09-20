import React, { useState } from 'react';
import { Settings as SettingsIcon, Layout, Bell, Cpu, Monitor, Map } from 'lucide-react';

export default function Settings() {
  const [autoAssign, setAutoAssign] = useState(true);
  const [aiRecs, setAiRecs] = useState(true);
  const [traffic, setTraffic] = useState(true);
  const [sound, setSound] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0E17] text-white p-6 font-sans">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Settings</h1>
            <p className="text-brand-muted text-sm mt-1">Configure system preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 h-[600px]">
          {/* Vertical Nav */}
          <div className="col-span-3 flex flex-col gap-2">
            <button className="flex items-center gap-3 bg-[#1E2638] text-blue-500 font-bold p-3 rounded-lg border-l-4 border-blue-500 transition-colors text-sm">
              <SettingsIcon size={18} /> General
            </button>
            <button className="flex items-center gap-3 text-brand-muted hover:bg-[#111622] hover:text-white p-3 rounded-lg border-l-4 border-transparent transition-colors text-sm">
              <Map size={18} /> Map & Layers
            </button>
            <button className="flex items-center gap-3 text-brand-muted hover:bg-[#111622] hover:text-white p-3 rounded-lg border-l-4 border-transparent transition-colors text-sm">
              <Bell size={18} /> Notifications
            </button>
            <button className="flex items-center gap-3 text-brand-muted hover:bg-[#111622] hover:text-white p-3 rounded-lg border-l-4 border-transparent transition-colors text-sm">
              <Cpu size={18} /> AI & Alerts
            </button>
            <button className="flex items-center gap-3 text-brand-muted hover:bg-[#111622] hover:text-white p-3 rounded-lg border-l-4 border-transparent transition-colors text-sm">
              <Monitor size={18} /> System
            </button>
          </div>

          {/* Settings Form */}
          <div className="col-span-9 flex flex-col gap-8">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">General Settings</h2>
              <p className="text-sm text-brand-muted">Application preferences</p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-3xl">
              
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm text-brand-muted">Organization Name</label>
                <input 
                  type="text" 
                  defaultValue="Sahay AI - Vadodara" 
                  className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-muted">Time Zone</label>
                <select className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option>Asia/Kolkata (UTC+5:30)</option>
                  <option>America/New_York (UTC-5)</option>
                  <option>Europe/London (UTC+0)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-muted">Default Map View</label>
                <select className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option>Vadodara</option>
                  <option>Mumbai</option>
                  <option>Delhi</option>
                </select>
              </div>

            </div>

            <hr className="border-[#1E2638] max-w-3xl my-2" />

            <div className="flex flex-col gap-6 max-w-3xl">
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Auto-assign resources</span>
                <div 
                  onClick={() => setAutoAssign(!autoAssign)}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${autoAssign ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Enable AI recommendations</span>
                <div 
                  onClick={() => setAiRecs(!aiRecs)}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${aiRecs ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Show traffic data</span>
                <div 
                  onClick={() => setTraffic(!traffic)}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${traffic ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Enable sound alerts</span>
                <div 
                  onClick={() => setSound(!sound)}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${sound ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                </div>
              </div>
              
            </div>

            <div className="max-w-3xl flex justify-end mt-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                Save Changes
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
