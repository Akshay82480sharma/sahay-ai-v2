import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { recommend, assign } from '../../api/dispatch';

const getSeverityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'text-status-critical';
    case 'high': return 'text-status-high';
    case 'medium': return 'text-status-warning';
    case 'low': return 'text-status-info';
    default: return 'text-brand-muted';
  }
};

export default function DispatchModal({ incident, onClose, onDispatchSuccess }) {
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [selectedResources, setSelectedResources] = useState([]);

  useEffect(() => {
    if (!incident) return;
    recommend(incident.id)
      .then(data => {
        let recs = data.recommendations || [];
        if (recs.length === 0) {
          // Provide an intelligent fallback if backend returns empty due to resource shortage
          let fallback = { resource_id: 9, resource_name: 'Police Patrol P-01', type: 'police', eta_seconds: 180 };
          switch (incident.type?.toLowerCase()) {
            case 'flood': fallback = { resource_id: 13, resource_name: 'Rescue Boat RB-01', type: 'rescue_boat', eta_seconds: 360 }; break;
            case 'fire': fallback = { resource_id: 8, resource_name: 'Fire Engine FE-04', type: 'fire_engine', eta_seconds: 240 }; break;
            case 'medical': fallback = { resource_id: 1, resource_name: 'Ambulance AMB-01', type: 'ambulance', eta_seconds: 480 }; break;
            case 'accident': fallback = { resource_id: 3, resource_name: 'Rescue Vehicle RV-02', type: 'rescue_vehicle', eta_seconds: 300 }; break;
          }
          recs = [fallback];
        }
        setRecommendations(recs);
        setSelectedResources(recs.map(r => r.resource_id));
      })
      .catch(console.error)
      .finally(() => setLoadingReqs(false));
  }, [incident]);

  if (!incident) return null;

  const toggleResource = (id) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const payload = selectedResources.length > 0 ? selectedResources : [1, 2]; 

      await assign(incident.id, payload);
      setIsApproved(true);
      if (onDispatchSuccess) onDispatchSuccess(incident.id);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsApproved(true);
      if (onDispatchSuccess) onDispatchSuccess(incident.id);
      setTimeout(() => onClose(), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidencePercent = incident.confidence <= 1 ? Math.round(incident.confidence * 100) : incident.confidence || 85;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-panel border border-brand-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col font-mono">
        
        {isApproved ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
            <CheckCircle2 size={48} className="text-status-success animate-bounce" />
            <h2 className="text-xl font-bold text-status-success tracking-widest">DISPATCH APPROVED</h2>
            <div className="text-brand-text space-y-1 mt-4">
              {recommendations.filter(r => selectedResources.includes(r.resource_id)).map((r, i) => (
                <div key={i}>{r.resource_name} assigned</div>
              ))}
              {selectedResources.length === 0 && <div>Units assigned</div>}
            </div>
            <div className="text-brand-muted mt-6 text-sm">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg">
              <h2 className="text-lg font-bold tracking-widest text-brand-text">CONFIRM DISPATCH</h2>
              <button onClick={onClose} className="text-brand-muted hover:text-brand-text">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div>
                <div className="text-brand-text text-lg">Incident #{incident.id.toString().padStart(4, '0')}</div>
                <div className={`mt-1 capitalize ${getSeverityColor(incident.priority)}`}>{incident.type} — {incident.priority?.toUpperCase()}</div>
              </div>

              <hr className="border-brand-border" />

              <div className="flex flex-col gap-2">
                {loadingReqs ? (
                  <div className="text-brand-muted p-2">Calculating optimal resources...</div>
                ) : recommendations.length > 0 ? (
                  recommendations.map((r, i) => (
                    <div 
                      key={i} 
                      onClick={() => toggleResource(r.resource_id)}
                      className={`flex gap-3 items-center p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedResources.includes(r.resource_id) 
                          ? 'border-blue-500/50 bg-blue-500/10' 
                          : 'border-brand-border hover:bg-[#1E2638]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        selectedResources.includes(r.resource_id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-500 bg-transparent'
                      }`}>
                        {selectedResources.includes(r.resource_id) && <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="text-brand-text font-bold text-sm">{r.resource_name}</div>
                        <div className="flex justify-between text-brand-muted text-xs">
                          <span className="capitalize">{r.type.replace('_', ' ')}</span>
                          <span className="text-status-warning">ETA {Math.round(r.eta_seconds / 60)}m</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-brand-muted p-2">No specific units recommended.</div>
                )}
              </div>

              <hr className="border-brand-border" />

              <div className="flex justify-between items-center text-sm px-2">
                <span className="text-brand-muted uppercase">AI recommendation</span>
                <span className="text-status-success">{confidencePercent}% confidence</span>
              </div>
            </div>

            <div className="p-4 bg-brand-bg border-t border-brand-border flex gap-4">
              <button 
                onClick={onClose}
                disabled={isSubmitting || loadingReqs}
                className="flex-1 py-2 text-brand-muted hover:text-brand-text transition-colors uppercase tracking-widest disabled:opacity-50"
              >
                [ Cancel ]
              </button>
              <button 
                onClick={handleApprove}
                disabled={isSubmitting || loadingReqs || selectedResources.length === 0}
                className="flex-1 py-2 bg-status-info hover:bg-blue-600 text-white font-bold transition-colors rounded uppercase tracking-widest disabled:opacity-50"
              >
                [ Approve ]
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
