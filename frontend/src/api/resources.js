import { fetchJson } from './client';

export async function getResources() {
  const data = await fetchJson('/resources');
  return data.resources || data || [];
}
