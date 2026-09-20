import { useState, useEffect, useCallback } from 'react';
import { getIncidents } from '../api/incidents';
import { useLiveData } from '../context/LiveDataProvider';

export function useIncidents(status = 'active') {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Since useLiveData might be called outside provider in tests, we handle it safely
  let subscribe;
  try {
    const liveData = useLiveData();
    subscribe = liveData.subscribe;
  } catch (e) {
    subscribe = () => () => {};
  }

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getIncidents(status);
      setIncidents(data.incidents || data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (!subscribe) return;
    
    const unsubscribeCreated = subscribe('incident_created', (newIncident) => {
      setIncidents(prev => [newIncident, ...prev]);
    });

    const unsubscribeUpdated = subscribe('incident_updated', (updatedIncident) => {
      setIncidents(prev => prev.map(inc => inc.id === updatedIncident.id ? { ...inc, ...updatedIncident } : inc));
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe]);

  return { incidents, loading, error, refetch: fetchIncidents, setIncidents };
}
