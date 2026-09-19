import { fetchJson } from './client';

export const getIncidents = async (status = 'active') => {
  return fetchJson(`/incidents?status=${status}`);
};

export const getIncident = async (id) => {
  return fetchJson(`/incidents/${id}`);
};
