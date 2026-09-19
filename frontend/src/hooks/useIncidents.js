import { useState, useEffect, useCallback } from 'react';
import { getIncidents } from '../api/incidents';

export function useIncidents(status = 'active') {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return { incidents, loading, error, refetch: fetchIncidents, setIncidents };
}
