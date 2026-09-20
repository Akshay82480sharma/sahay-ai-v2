import React, { useState, useEffect } from 'react';
import { updateAssignment } from '../../api/dispatch';
import { useLiveData } from '../../context/LiveDataProvider';
import { timeAgo, mmss } from '../../utils/time';

export default function AssignmentTracker({
  incidentId,
  assignments = [],
  onRefresh
}) {
  const { subscribe } = useLiveData();
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [error, setError] = useState(null);

  // Subscribe to assignment and incident updates
  useEffect(() => {
    const unsubA = subscribe('assignment_updated', (data) => {
      if (data.incident_id === incidentId) onRefresh();
    });
    const unsubI = subscribe('incident_updated', (data) => {
      if (data.id === incidentId) onRefresh();
    });
    return () => { unsubA(); unsubI(); };
  }, [subscribe, incidentId, onRefresh]);

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    setLoadingIds(prev => new Set(prev).add(assignmentId));
    setError(null);
    try {
      await updateAssignment(assignmentId, newStatus);
      // Wait for WS to update or call onRefresh
    } catch (err) {
      setError(err.message || 'Failed to update assignment status');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'dispatched': return { color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'en_route': return { color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'on_scene': return { color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'completed': return { color: 'bg-green-100 text-green-800 border-green-200' };
      case 'cancelled': return { color: 'bg-gray-100 text-gray-800 border-gray-200' };
      default: return { color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case 'dispatched': return { label: 'Mark En Route', nextStatus: 'en_route' };
      case 'en_route': return { label: 'Mark On Scene', nextStatus: 'on_scene' };
      case 'on_scene': return { label: 'Mark Completed', nextStatus: 'completed' };
      default: return null;
    }
  };

  if (!assignments || assignments.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="font-semibold text-sm text-gray-700">Active Assignments</h4>
      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      
      <div className="space-y-3">
        {assignments.map(assignment => {
          const isLoading = loadingIds.has(assignment.id);
          const { color } = getStatusConfig(assignment.status);
          const action = getNextAction(assignment.status);
          
          return (
            <div key={assignment.id} className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">Resource #{assignment.resource_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${color}`}>
                      {assignment.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-3">
                    {assignment.eta_seconds != null && (
                      <span>ETA: {mmss(assignment.eta_seconds)}</span>
                    )}
                    {assignment.dispatched_at && (
                      <span>Dispatched {timeAgo(assignment.dispatched_at)}</span>
                    )}
                  </div>
                </div>
                
                {action && (
                  <button
                    onClick={() => handleStatusUpdate(assignment.id, action.nextStatus)}
                    disabled={isLoading}
                    className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isLoading ? 'Updating...' : action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
