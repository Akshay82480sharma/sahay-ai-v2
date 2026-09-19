import React from 'react';
import { formatDuration } from '../../utils/time';

export default function RecommendationPanel({
  incidentId,
  recommendation,
  loading,
  error,
  onRecommend,
  selectedResourceIds,
  onToggleResource
}) {
  if (!incidentId) return null;

  return (
    <div className="flex flex-col gap-3">
      {!recommendation ? (
        <div className="text-center p-4">
          <button
            onClick={onRecommend}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Get Recommendation'}
          </button>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendation.mutual_aid && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">SHORTAGE WARNING</span>
                <span className="text-purple-900 font-medium text-sm">Mutual Aid Triggered</span>
              </div>
              <p className="text-purple-700 text-xs mt-1">{recommendation.mutual_aid_reason || 'Local resources exhausted.'}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700 flex justify-between items-center">
              Recommended Units
              <button onClick={onRecommend} disabled={loading} className="text-blue-600 hover:underline text-xs">
                Refresh
              </button>
            </h4>
            
            {recommendation.recommendations?.length === 0 ? (
              <p className="text-gray-500 text-sm">No resources available to recommend.</p>
            ) : (
              recommendation.recommendations?.map(rec => {
                const isSelected = selectedResourceIds.includes(rec.resource_id);
                return (
                  <div 
                    key={rec.resource_id} 
                    className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                    onClick={() => onToggleResource(rec.resource_id)}
                  >
                    <div className="mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // handled by div click
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{rec.resource?.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{rec.resource?.type?.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-700">ETA {formatDuration(rec.eta_seconds)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 italic">"{rec.reasoning}"</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
