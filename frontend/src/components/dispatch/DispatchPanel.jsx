import React, { useState, useEffect, useCallback } from 'react';
import { getIncidentDetail, recommend } from '../../api/dispatch';
import RecommendationPanel from './RecommendationPanel';
import ApproveDispatch from './ApproveDispatch';
import AssignmentTracker from './AssignmentTracker';

export default function DispatchPanel({ incidentId }) {
  const [incidentDetail, setIncidentDetail] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  
  const [loadingRec, setLoadingRec] = useState(false);
  const [errorRec, setErrorRec] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    setErrorDetail(null);
    try {
      const data = await getIncidentDetail(id);
      setIncidentDetail(data);
    } catch (err) {
      setErrorDetail(err.message || 'Failed to fetch incident details');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    setIncidentDetail(null);
    setRecommendation(null);
    setSelectedResourceIds([]);
    
    if (incidentId) {
      fetchDetail(incidentId);
    }
  }, [incidentId, fetchDetail]);

  const handleRecommend = async () => {
    if (!incidentId) return;
    setLoadingRec(true);
    setErrorRec(null);
    try {
      const rec = await recommend(incidentId);
      setRecommendation(rec);
      // Auto-select all recommended resources
      setSelectedResourceIds((rec.recommendations || []).map(r => r.resource_id));
    } catch (err) {
      setErrorRec(err.message || 'Failed to get recommendation');
    } finally {
      setLoadingRec(false);
    }
  };

  const handleToggleResource = (id) => {
    setSelectedResourceIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const handleApproveSuccess = () => {
    setRecommendation(null);
    setSelectedResourceIds([]);
    fetchDetail(incidentId); // refresh assignments
  };

  if (!incidentId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center text-sm">
        Select an incident to view dispatch options.
      </div>
    );
  }

  const hasAssignments = incidentDetail?.assignments && incidentDetail.assignments.length > 0;
  const isDispatched = incidentDetail?.status === 'dispatched' || incidentDetail?.status === 'resolved';

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto overflow-x-hidden">
      <div className="p-4 space-y-6">
        {errorDetail && <div className="text-red-500 text-sm">{errorDetail}</div>}
        
        {loadingDetail && !incidentDetail ? (
          <div className="text-gray-500 text-sm text-center">Loading incident details...</div>
        ) : (
          <>
            <div className="pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Incident #{incidentId}</h3>
              <p className="text-sm text-gray-500 capitalize">{incidentDetail?.status}</p>
            </div>

            {hasAssignments && (
              <AssignmentTracker 
                incidentId={incidentId} 
                assignments={incidentDetail.assignments} 
                onRefresh={() => fetchDetail(incidentId)} 
              />
            )}

            {!isDispatched && (
              <>
                <RecommendationPanel 
                  incidentId={incidentId}
                  recommendation={recommendation}
                  loading={loadingRec}
                  error={errorRec}
                  onRecommend={handleRecommend}
                  selectedResourceIds={selectedResourceIds}
                  onToggleResource={handleToggleResource}
                />
                
                <ApproveDispatch 
                  incidentId={incidentId}
                  selectedResourceIds={selectedResourceIds}
                  onSuccess={handleApproveSuccess}
                  onRefresh={handleRecommend}
                />
              </>
            )}

            {incidentDetail?.audit_logs && incidentDetail.audit_logs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4">Audit Trail</h4>
                <div className="space-y-4 border-l-2 border-blue-100 ml-2 pl-4 relative">
                  {incidentDetail.audit_logs.map(log => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      <p className="text-xs text-gray-400 mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        By: {log.actor}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span className="block mt-1 bg-gray-50 p-2 rounded text-gray-600 font-mono text-[10px]">
                            {JSON.stringify(log.details)}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
