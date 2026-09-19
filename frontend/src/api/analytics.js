import { fetchJson } from './client';

export async function getAnalyticsSummary() {
  return fetchJson('/analytics/summary');
}
