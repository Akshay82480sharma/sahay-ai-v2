import React, { useState } from 'react';
import { Settings as SettingsIcon, Layout, Bell, Cpu, Monitor, Map } from 'lucide-react';
import { useLiveData } from '../context/LiveDataProvider';

export default function Settings() {
  const { globalSettings, setGlobalSettings } = useLiveData();
  const [activeTab, setActiveTab] = useState('General');
  const [autoAssign, setAutoAssign] = useState(true);
  const [aiRecs, setAiRecs] = useState(true);
  const [traffic, setTraffic] = useState(true);
  const [sound, setSound] = useState(false);
  const [notifSettings, setNotifSettings] = useState([true, false, true, false]);

  const tabs = [
    { id: 'General', icon: SettingsIcon },
    { id: 'Map & Layers', icon: Map },
    { id: 'Notifications', icon: Bell },
    { id: 'AI & Alerts', icon: Cpu },
    { id: 'System', icon: Monitor }
  ];

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
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors text-sm ${
                    isActive 
                      ? 'bg-[#1E2638] text-blue-500 font-bold border-blue-500' 
                      : 'text-brand-muted hover:bg-[#111622] hover:text-white border-transparent'
                  }`}
                >
                  <Icon size={18} /> {tab.id}
                </button>
              );
            })}
          </div>

          {/* Settings Form */}
          <div className="col-span-9 flex flex-col gap-8">
            {activeTab === 'General' ? (
              <>
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
              {[
                { label: 'Auto-assign resources', key: 'autoAssign' },
                { label: 'Enable AI recommendations', key: 'aiRecs' },
                { label: 'Show traffic data', key: 'traffic' },
                { label: 'Enable sound alerts', key: 'sound' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-white">{item.label}</span>
                  <div 
                    onClick={() => setGlobalSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${globalSettings[item.key] ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-3xl flex justify-end mt-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                Save Changes
              </button>
            </div>
              </>
            ) : activeTab === 'Map & Layers' ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Map & Layers</h2>
                  <p className="text-sm text-brand-muted">Configure default map visibility</p>
                </div>
                <div className="flex flex-col gap-6 max-w-3xl mt-4">
                  {[
                    { label: 'Show Incidents by Default', key: 'showIncidents' },
                    { label: 'Show Resources by Default', key: 'showResources' },
                    { label: 'Enable Dark Mode Tiles', key: 'darkMode' },
                    { label: 'Display Heatmap Overlay', key: 'heatmap' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-white">{item.label}</span>
                      <div 
                        onClick={() => {
                          setGlobalSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }));
                        }}
                        className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${globalSettings[item.key] ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="max-w-3xl flex justify-end mt-8">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                    Save Changes
                  </button>
                </div>
              </>
            ) : activeTab === 'Notifications' ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Notifications</h2>
                  <p className="text-sm text-brand-muted">Manage SMS and email alerts</p>
                </div>
                <div className="flex flex-col gap-6 max-w-3xl mt-4">
                  {['SMS Alerts for Critical Incidents', 'Email Daily Digest', 'Push Notifications (Browser)', 'Alert on Unit Delay'].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-white">{item}</span>
                      <div 
                        onClick={() => {
                          const newSettings = [...notifSettings];
                          newSettings[i] = !newSettings[i];
                          setNotifSettings(newSettings);
                        }}
                        className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${notifSettings[i] ? 'bg-blue-600 justify-end' : 'bg-[#1E2638] justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="max-w-3xl flex justify-end mt-8">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                    Save Changes
                  </button>
                </div>
              </>
            ) : activeTab === 'AI & Alerts' ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">AI & Alerts</h2>
                  <p className="text-sm text-brand-muted">Configure AI routing and thresholds</p>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-3xl mt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-brand-muted">LLM Provider</label>
                    <select className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option>Gemini 1.5 Flash</option>
                      <option>Gemini 1.5 Pro</option>
                      <option>Local Fallback (Keyword)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-brand-muted">Escalation Threshold</label>
                    <select className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option>5 minutes unassigned</option>
                      <option>10 minutes unassigned</option>
                      <option>15 minutes unassigned</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm text-brand-muted">Auto-Duplicate Merge Confidence Threshold</label>
                    <div className="flex items-center gap-4 mt-2">
                      <input type="range" min="50" max="99" defaultValue="85" className="w-full accent-blue-500" />
                      <span className="text-white font-mono text-sm">85%</span>
                    </div>
                  </div>
                </div>
                <div className="max-w-3xl flex justify-end mt-8">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                    Save Changes
                  </button>
                </div>
              </>
            ) : activeTab === 'System' ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">System</h2>
                  <p className="text-sm text-brand-muted">Database and API configurations</p>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-3xl mt-4">
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm text-brand-muted">API Endpoint URL</label>
                    <input type="text" defaultValue="http://localhost:8000" className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white opacity-70" disabled />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm text-brand-muted">WebSocket URL</label>
                    <input type="text" defaultValue="ws://localhost:8000/ws/live" className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white opacity-70" disabled />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm text-brand-muted">Database Provider</label>
                    <input type="text" defaultValue="SQLite (Local)" className="bg-[#111622] border border-[#1E2638] rounded-lg p-3 text-sm text-white opacity-70" disabled />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
