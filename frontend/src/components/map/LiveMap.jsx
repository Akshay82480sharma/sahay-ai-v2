import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useIncidents } from '../../hooks/useIncidents';
import { useLiveData } from '../../context/LiveDataProvider';
import { Layers, X } from 'lucide-react';

// Remove default Leaflet icon logic
// We'll use custom HTML markers with Tailwind

// Custom Resource Icon (blue circle)
const ResourceIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-3 h-3 bg-[#2563eb] rounded-full border-2 border-brand-panel shadow-md"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Custom Dispatched Icon (pulsing orange circle)
const DispatchedIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f59e0b] opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-[#f59e0b] border-2 border-brand-panel shadow-md"></span>
        </div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const getIncidentIcon = (priority, isSelected) => {
  let color = '#3b82f6'; // low (info)
  if (priority === 'critical') color = '#ef4444';
  else if (priority === 'high') color = '#f97316';
  else if (priority === 'medium') color = '#eab308';

  const scale = isSelected ? 'scale(1.2)' : 'scale(1)';
  const shadow = isSelected ? 'drop-shadow(0px 0px 10px rgba(255,255,255,0.5))' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#1e1e1e" stroke-width="1.5" style="width: 28px; height: 28px; filter: ${shadow}; transform: ${scale}; transition: all 0.2s;">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" fill="white" />
  </svg>`;

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: svg,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

export default function LiveMap({ onSelectIncident, selectedIncident, mapFilter = 'All' }) {
  const { incidents } = useIncidents();
  const { resources = [] } = useLiveData();
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  
  // Vadodara coordinates
  const defaultCenter = [22.3072, 73.1812];
  
  // Lock the map to Vadodara and surrounding area to prevent getting lost
  const bounds = [
    [22.1000, 72.9000], // Southwest
    [22.5000, 73.4000]  // Northeast
  ];

  // Calculate mock route to closest available resource when incident is selected
  const mockRoute = useMemo(() => {
    if (!selectedIncident || !selectedIncident.lat || !selectedIncident.lng) return null;
    
    // Find closest available resource
    const available = resources.filter(r => r.status === 'available' && r.lat && r.lng);
    if (available.length === 0) return null;
    
    let closest = available[0];
    let minDist = Infinity;
    
    available.forEach(r => {
      const dist = Math.pow(r.lat - selectedIncident.lat, 2) + Math.pow(r.lng - selectedIncident.lng, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = r;
      }
    });
    
    return [
      [closest.lat, closest.lng],
      [selectedIncident.lat, selectedIncident.lng]
    ];
  }, [selectedIncident, resources]);

  const showIncidents = mapFilter === 'All' || mapFilter === 'Incidents';
  const showUnits = mapFilter === 'All' || mapFilter === 'Units';
  const showHospitals = mapFilter === 'All' || mapFilter === 'Hospitals';

  return (
    <div className="w-full h-full relative z-0">
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        minZoom={11}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        style={{ height: '100%', width: '100%', backgroundColor: '#111' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_3r9f_1_7c83aca1acb72d1b501b80f2"
          attribution='&copy; OpenStreetMap contributors, &copy; CARTO'
          noWrap={true}
        />
        {showIncidents && incidents?.map(inc => {
          const isSelected = selectedIncident && selectedIncident.id === inc.id;
          return (
            inc.lat && inc.lng && (
              <Marker 
                key={`inc-${inc.id}`} 
                position={[inc.lat, inc.lng]} 
                icon={getIncidentIcon(inc.priority, isSelected)}
                eventHandlers={{ click: () => onSelectIncident && onSelectIncident(inc) }}
              >
              </Marker>
            )
          );
        })}
        {mockRoute && (
          <Polyline 
            positions={mockRoute} 
            color="#f59e0b" 
            weight={3} 
            dashArray="10, 10"
            className="animate-pulse opacity-75"
          />
        )}
        {resources?.filter(res => {
          if (showUnits && res.type !== 'Hospital') return true;
          if (showHospitals && res.type === 'Hospital') return true;
          if (mapFilter === 'All') return true;
          return false;
        }).map(res => (
          res.lat && res.lng && (
            <Marker 
              key={`res-${res.id}`} 
              position={[res.lat, res.lng]}
              icon={['dispatched', 'en_route', 'on_scene'].includes(res.status?.toLowerCase()) ? DispatchedIcon : ResourceIcon}
            >
              <Popup>
                <strong>{res.name}</strong><br/>
                Type: {res.type}<br/>
                Status: <span style={{ textTransform: 'uppercase', color: ['dispatched', 'en_route', 'on_scene'].includes(res.status?.toLowerCase()) ? '#f59e0b' : '#2563eb' }}>{res.status}</span>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
      {/* MAP LAYERS LEGEND */}
      {isLayersOpen ? (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-[400] bg-[#0A0E17]/95 border border-[#1E2638] rounded-lg p-4 shadow-xl backdrop-blur-sm w-48 font-sans">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-xs font-bold flex items-center gap-2">
              <Layers size={14} /> Map Layers
            </h3>
            <button 
              onClick={() => setIsLayersOpen(false)}
              className="text-brand-muted hover:text-white p-1 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        <div className="flex flex-col gap-2 text-xs text-brand-muted">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            <span className="text-white">Incidents</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            <span className="text-white">Emergency Units</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            <span className="text-white">Hospitals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            <span className="text-blue-400">Flood Zones</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            <span className="text-brand-muted">Traffic</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-blue-500" />
            <span className="text-brand-muted">Heatmap</span>
          </label>
        </div>
      </div>
      ) : (
        <button 
          onClick={() => setIsLayersOpen(true)}
          className="absolute top-1/2 -translate-y-1/2 left-4 z-[400] bg-[#0A0E17]/95 border border-[#1E2638] rounded-lg p-3 shadow-xl backdrop-blur-sm text-white hover:bg-[#111622] transition-colors"
          title="Map Layers"
        >
          <Layers size={20} />
        </button>
      )}

    </div>
  );
}
