import React, { useState } from 'react';
import { assign } from '../../api/dispatch';

export default function ApproveDispatch({
  incidentId,
  selectedResourceIds,
  onSuccess,
  onRefresh
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApprove = async () => {
    if (!selectedResourceIds.length) return;
    
    setLoading(true);
    setError(null);
    try {
      await assign(incidentId, selectedResourceIds);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to dispatch units');
      // On 422 (likely resource unavailable), refresh recommendations
      if (err.message && err.message.toLowerCase().includes('not available')) {
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!selectedResourceIds.length) return null;

  return (
    <div className="mt-4 p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          Ready to dispatch {selectedResourceIds.length} unit{selectedResourceIds.length !== 1 ? 's' : ''}.
        </span>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Dispatching...' : 'Approve & Dispatch'}
        </button>
      </div>
      {error && (
        <div className="text-xs text-red-600 font-medium p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
