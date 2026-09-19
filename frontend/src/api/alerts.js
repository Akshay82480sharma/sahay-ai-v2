import { fetchJson } from './client';

export async function getAlerts() {
  const data = await fetchJson('/alerts');
  return data.alerts || data || [];
}

export async function acknowledgeAlert(id) {
  return fetchJson(`/alerts/${id}/acknowledge`, { method: 'PATCH' });
}
