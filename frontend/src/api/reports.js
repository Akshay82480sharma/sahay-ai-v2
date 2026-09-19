import { fetchJson } from './client';

export const submitReport = async (reportData) => {
  return fetchJson('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
};
