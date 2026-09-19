import { fetchJson } from './client';

export async function getIncidentDetail(id) {
  return fetchJson(`/incidents/${id}`);
}

export async function recommend(incidentId) {
  return fetchJson(`/incidents/${incidentId}/recommend`, { method: 'POST' });
}

export async function assign(incidentId, resourceIds) {
  return fetchJson(`/incidents/${incidentId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ resource_ids: resourceIds }),
  });
}

export async function updateAssignment(assignmentId, status) {
  return fetchJson(`/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
