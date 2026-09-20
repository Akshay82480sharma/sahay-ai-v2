import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getAlerts } from '../api/alerts';
import { getResources } from '../api/resources';

const LiveDataContext = createContext(null);

export function LiveDataProvider({ children }) {
  const { status: connectionStatus, lastMessage } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [resources, setResources] = useState([]);
  const subscribersRef = useRef({});

  // Initial fetch
  useEffect(() => {
    getAlerts().then(setAlerts).catch(err => console.error("Failed to load alerts:", err));
    getResources().then(setResources).catch(err => console.error("Failed to load resources:", err));
  }, []);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { event, data } = lastMessage;

    // Update local state if needed
    if (event === 'alert_created') {
      setAlerts(prev => [data, ...prev]);
    } else if (event === 'resource_updated') {
      setResources(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
    } else if (event === 'alert_updated') {
      setAlerts(prev => prev.map(a => a.id === data.id ? { ...a, ...data } : a));
    }

    // Notify subscribers
    const handlers = subscribersRef.current[event];
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }, [lastMessage]);

  const [globalSettings, setGlobalSettings] = useState({
    showIncidents: true,
    showResources: true,
    darkMode: true,
    satellite: false,
    heatmap: false,
    autoAssign: true,
    aiRecs: true,
    traffic: true,
    sound: false
  });

  const subscribe = useCallback((eventName, handler) => {
    if (!subscribersRef.current[eventName]) {
      subscribersRef.current[eventName] = new Set();
    }
    subscribersRef.current[eventName].add(handler);

    return () => {
      subscribersRef.current[eventName].delete(handler);
    };
  }, []);

  const value = {
    connectionStatus,
    alerts,
    setAlerts,
    resources,
    setResources,
    subscribe,
    globalSettings,
    setGlobalSettings
  };

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  );
}

export function useLiveData() {
  const context = useContext(LiveDataContext);
  if (!context) {
    throw new Error('useLiveData must be used within a LiveDataProvider');
  }
  return context;
}
