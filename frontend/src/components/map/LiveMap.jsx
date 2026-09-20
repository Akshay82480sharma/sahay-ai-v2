import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, Marker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useIncidents } from '../../hooks/useIncidents';
import { useLiveData } from '../../context/LiveDataProvider';

// ── Directions Route (real roads) ──────────────────────────────
// Polyline component for vis.gl
const Polyline = ({ path, options }) => {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;
    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({ map });
    }
    polylineRef.current.setOptions({ path, ...options });
  }, [map, path, options]);

  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  return null;
};

const DirectionsRoute = ({ origin, destination, onRoutesReady, selectedRouteIndex = 0 }) => {
  const map = useMap();
  const geometryLib = useMapsLibrary('geometry');

  const origKey = origin ? `${origin.lat},${origin.lng}` : '';
  const destKey = destination ? `${destination.lat},${destination.lng}` : '';

  useEffect(() => {
    if (!map || !geometryLib || !origin || !destination) return;

    const apiKey = 'AIzaSyAe7ZXaD5UCISdmth0v9u9oZnVQx2nu-Uc';
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes?key=' + apiKey;
    
    const requestBody = {
      origin: { location: { latLng: { latitude: parseFloat(origin.lat), longitude: parseFloat(origin.lng) } } },
      destination: { location: { latLng: { latitude: parseFloat(destination.lat), longitude: parseFloat(destination.lng) } } },
      travelMode: 'DRIVE',
      computeAlternativeRoutes: true
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration'
      },
      body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(data => {
      if (data.routes && data.routes.length > 0) {
        const routeOptions = data.routes.map((route, idx) => {
          // Decode polyline
          const decodedPath = geometryLib.encoding.decodePath(route.polyline.encodedPolyline);
          const path = decodedPath.map(p => ({ lat: p.lat(), lng: p.lng() }));
          
          return {
            index: idx,
            summary: idx === 0 ? 'Primary Route' : `Alternate ${idx}`,
            distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
            duration: `${Math.ceil(parseInt(route.duration) / 60)} min`,
            path: path,
          };
        });
        if (onRoutesReady) onRoutesReady(routeOptions);
      } else {
        throw new Error("No routes found");
      }
    })
    .catch(err => {
      console.error("Routes API error:", err);
      // Fallback
      if (onRoutesReady) onRoutesReady([{
        index: 0,
        summary: "Direct Route (Fallback)",
        distance: "Unknown",
        duration: "Unknown",
        path: [origin, destination]
      }]);
    });

  }, [map, geometryLib, origKey, destKey, onRoutesReady]);

  return null;
};

// ── Vehicle Animation Marker (Realistic GPS Simulation) ────────
const VehicleMarker = ({ routePath, onProgress }) => {
  const [position, setPosition] = useState(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!routePath || routePath.length < 2) {
      setPosition(null);
      return;
    }

    // Pre-calculate cumulative distances along the path
    const cumDist = [0];
    for (let i = 1; i < routePath.length; i++) {
      cumDist.push(cumDist[i - 1] + getDistance(routePath[i - 1], routePath[i]));
    }
    const totalDistance = cumDist[cumDist.length - 1];
    if (totalDistance === 0) return;

    // Simulate a ~40 km/h average speed for emergency vehicle in city
    // But compress time: entire route in ~30 seconds for demo
    const DURATION_MS = 30000;
    const startTime = Date.now();

    setPosition(routePath[0]);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      
      // Ease-in-out for realistic acceleration/deceleration
      const eased = progress < 0.1
        ? progress * 5 * progress * 5 / 2  // accelerate
        : progress > 0.9
          ? 1 - Math.pow(1 - progress, 2) * 2 // decelerate
          : progress; // constant
      
      const targetDist = eased * totalDistance;

      // Binary search for the right segment
      let segIdx = 0;
      for (let i = 1; i < cumDist.length; i++) {
        if (cumDist[i] >= targetDist) {
          segIdx = i - 1;
          break;
        }
        segIdx = i - 1;
      }

      const segStart = cumDist[segIdx];
      const segEnd = cumDist[segIdx + 1] || cumDist[segIdx];
      const segLen = segEnd - segStart;
      const segProgress = segLen > 0 ? (targetDist - segStart) / segLen : 0;

      const from = routePath[segIdx];
      const to = routePath[segIdx + 1] || routePath[segIdx];

      const lat = from.lat + (to.lat - from.lat) * segProgress;
      const lng = from.lng + (to.lng - from.lng) * segProgress;
      setPosition({ lat, lng });

      // Report progress to parent for live ETA updates
      const remainingDist = totalDistance - targetDist;
      const remainingTime = Math.max(0, Math.round((DURATION_MS - elapsed) / 1000));
      let speedKmh = 55;
      if (progress < 0.1) speedKmh = Math.max(10, Math.floor(55 * (progress / 0.1)));
      else if (progress > 0.9) speedKmh = Math.max(0, Math.floor(55 * ((1 - progress) / 0.1)));
      speedKmh += Math.floor(Math.random() * 7) - 3; // Jitter
      if (speedKmh < 0 || progress >= 1) speedKmh = 0;

      onProgress && onProgress({
        progress,
        remainingDistance: remainingDist,
        remainingTime,
        currentPosition: { lat, lng },
        speed: speedKmh
      });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [routePath]);

  if (!position) return null;

  // Emergency vehicle icon — green circle with pulsing ring
  const vehicleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="%2310b981" fill-opacity="0.2" stroke="%2310b981" stroke-width="1"/><circle cx="18" cy="18" r="10" fill="%2310b981" stroke="white" stroke-width="2.5"/><path d="M18 12v6M15 18h6" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;

  return (
    <Marker
      position={position}
      icon={{
        url: `data:image/svg+xml;charset=UTF-8,${vehicleSvg}`,
        anchor: { x: 18, y: 18 },
      }}
      zIndex={9999}
    />
  );
};

// ── Haversine helper (meters) ──────────────────────────────────
function getDistance(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const x = sin1 * sin1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sin2 * sin2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── Incident color helper ──────────────────────────────────────
const getIncidentColor = (severity) => {
  return severity >= 5 ? '#ef4444' : 
         severity === 4 ? '#f97316' : 
         severity === 3 ? '#eab308' : '#3b82f6';
};

// ── Flood Zone Circles ─────────────────────────────────────────
const FloodCircles = ({ zones }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !maps || !zones) return;
    const circles = zones.map(z => {
      const circle = new maps.Circle({
        center: { lat: z.lat, lng: z.lng },
        radius: z.radius,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        map,
      });
      return circle;
    });
    return () => circles.forEach(c => c.setMap(null));
  }, [map, maps, zones]);

  return null;
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function LiveMap({ onSelectIncident, selectedIncident, mapFilter = 'All', selectedRouteIndex = 0, onRouteOptionsReady, onVehicleProgress, deviationOrigin, vehicleProgress }) {
  const { incidents } = useIncidents();
  const { resources = [], globalSettings = {} } = useLiveData();
  const darkMode = globalSettings.darkMode ?? true;
  const satellite = globalSettings.satellite ?? false;
  const [routeOptions, setRouteOptions] = useState([]);
    const [selectedPOI, setSelectedPOI] = useState(null);

  const defaultCenter = { lat: 22.3072, lng: 73.1812 };

  // ── Static Map Data ──────────────────────────────────────────
  const hospitals = [
    { id: 'h1', name: 'SSG Hospital', lat: 22.3023, lng: 73.1925, beds: 42 },
    { id: 'h2', name: 'Gotri Medical College', lat: 22.3168, lng: 73.1491, beds: 15 },
    { id: 'h3', name: 'Bhailal Amin General Hospital', lat: 22.3218, lng: 73.1627, beds: 8 },
    { id: 'h4', name: 'Sterling Hospital', lat: 22.2982, lng: 73.1743, beds: 30 },
    { id: 'h5', name: 'Baroda Medical College', lat: 22.3095, lng: 73.1960, beds: 22 },
  ];

  const roadClosures = [
    { id: 'rc1', name: 'Sayajigunj Underpass — Flooded', lat: 22.3090, lng: 73.1910 },
    { id: 'rc2', name: 'Old Padra Rd — Waterlogged', lat: 22.2950, lng: 73.1720 },
    { id: 'rc3', name: 'Ajwa Road — Debris', lat: 22.3175, lng: 73.2270 },
    { id: 'rc4', name: 'Gotri Bridge — Structural Check', lat: 22.3130, lng: 73.1520 },
  ];

  const floodZones = [
    { id: 'fz1', name: 'Vishwamitri River Bank', lat: 22.3050, lng: 73.2014, radius: 600 },
    { id: 'fz2', name: 'Sursagar Lake Overflow', lat: 22.3005, lng: 73.1960, radius: 400 },
    { id: 'fz3', name: 'Atladara Low-Lying Area', lat: 22.2858, lng: 73.1541, radius: 500 },
    { id: 'fz4', name: 'Harni Lake Overflow', lat: 22.3340, lng: 73.2110, radius: 450 },
  ];

  // ── Find closest resource for routing ────────────────────────
  const routeEndpoints = useMemo(() => {
    if (!selectedIncident || !selectedIncident.lat || !selectedIncident.lng) return null;
    const validResources = resources.filter(r => r.lat && r.lng);
    if (validResources.length === 0) return null;
    let closest = validResources[0];
    let minDist = Infinity;
    validResources.forEach(r => {
      const dist = Math.pow(r.lat - selectedIncident.lat, 2) + Math.pow(r.lng - selectedIncident.lng, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = r;
      }
    });
    return {
      origin: deviationOrigin || { lat: closest.lat, lng: closest.lng },
      destination: { lat: selectedIncident.lat, lng: selectedIncident.lng },
    };
  }, [selectedIncident, resources, deviationOrigin]);

  useEffect(() => {
    if (!selectedIncident) {
      setRouteOptions([]);
    }
  }, [selectedIncident]);

  const handleRoutesReady = useCallback((options) => {
    setRouteOptions(options);
    if (onRouteOptionsReady) {
      onRouteOptionsReady(options);
    }
  }, [onRouteOptionsReady]);

  // ── Filter flags ─────────────────────────────────────────────
  const showIncidents = (globalSettings.showIncidents ?? true) && (mapFilter === 'All' || mapFilter === 'Incidents');
  const showResources = (globalSettings.showResources ?? true) && (mapFilter === 'All' || mapFilter === 'Units');
  const showHospitals = mapFilter === 'All' || mapFilter === 'Hospitals';
  const showFloodZones = mapFilter === 'All' || mapFilter === 'Flood Zones';
  const showRoadClosures = mapFilter === 'All' || mapFilter === 'Road Closures';

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#111] text-brand-muted flex items-center justify-center font-mono text-sm border border-[#1E2638] rounded-xl">
        Missing VITE_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  // SVG icon helpers
  const hospitalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="%23059669" stroke="white" stroke-width="1.5"/><path d="M12 8v8M8 12h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  const roadClosureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="%23ef4444" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 9v5" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="white"/></svg>`;
  const floodZoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%233b82f6" fill-opacity="0.4" stroke="%233b82f6" stroke-width="1.5"/><path d="M6 14c1.5-2 3-2 4.5 0s3 2 4.5 0" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M6 10c1.5-2 3-2 4.5 0s3 2 4.5 0" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;

  return (
    <div className="w-full h-full relative z-0">
      <APIProvider apiKey={apiKey}>
        <Map
          mapTypeId={satellite ? 'hybrid' : 'roadmap'}
          tilt={satellite ? 45 : 0}
          defaultCenter={defaultCenter}
          defaultZoom={13}
          disableDefaultUI={true}
          gestureHandling="greedy"
          styles={satellite ? [] : darkMode ? [
            { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
            { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
            { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#16253a" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
            { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
            { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
          ] : [
            { featureType: "poi", stylers: [{ visibility: "off" }] }
          ]}
          style={{ width: '100%', height: '100%', backgroundColor: darkMode ? '#111' : '#fff' }}
        >
          {/* ── Incident Markers ── */}
          {showIncidents && incidents?.map(inc => {
            const isSelected = selectedIncident && selectedIncident.id === inc.id;
            const color = getIncidentColor(inc.severity);
            const scale = isSelected ? 34 : 28;
            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#1e1e1e" stroke-width="1.5" width="${scale}" height="${scale}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`;
            return (
              inc.lat && inc.lng && (
                <Marker
                  key={`inc-${inc.id}`}
                  position={{ lat: inc.lat, lng: inc.lng }}
                  onClick={() => onSelectIncident && onSelectIncident(inc)}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgStr)}`,
                    anchor: { x: scale / 2, y: scale },
                  }}
                />
              )
            );
          })}

          {/* ── Directions Route (real roads) ── */}
          {routeEndpoints && (
            <DirectionsRoute
              origin={routeEndpoints.origin}
              destination={routeEndpoints.destination}
              selectedRouteIndex={selectedRouteIndex}
              onRoutesReady={handleRoutesReady}
            />
          )}

                    {/* Route Polylines */}
          {routeOptions && routeOptions.map((route, index) => {
            const isSelected = index === selectedRouteIndex;
            return (
              <Polyline
                key={`route-${index}`}
                path={route.path}
                options={{
                  strokeColor: isSelected ? '#f59e0b' : '#9ca3af',
                  strokeOpacity: isSelected ? 0.9 : 0.4,
                  strokeWeight: isSelected ? 6 : 4,
                  zIndex: isSelected ? 10 : 1,
                }}
              />
            );
          })}

          {/* Animated Vehicle Marker */}
          {routeOptions[selectedRouteIndex]?.path && <VehicleMarker routePath={routeOptions[selectedRouteIndex].path} onProgress={onVehicleProgress} />}

          {/* ── Resource Markers ── */}
          {showResources && resources?.filter(res => res.type !== 'rescue_boat').map(res => {
            if (!res.lat || !res.lng) return null;
            const isDispatched = ['dispatched', 'en_route', 'on_scene'].includes(res.status?.toLowerCase());
            const color = isDispatched ? '%23f59e0b' : '%233b82f6';
            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
            return (
              <Marker
                key={`res-${res.id}`}
                position={{ lat: res.lat, lng: res.lng }}
                title={res.name}
                icon={{
                  url: `data:image/svg+xml;charset=UTF-8,${svgStr}`,
                  anchor: { x: 8, y: 8 },
                }}
              />
            );
          })}

          {/* ── Hospital Markers ── */}
          {showHospitals && hospitals.map(h => (
            <Marker
              key={h.id}
              position={{ lat: h.lat, lng: h.lng }}
              onClick={() => setSelectedPOI({ ...h, type: 'hospital' })}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${hospitalSvg}`,
                anchor: { x: 14, y: 14 },
              }}
            />
          ))}

          {/* ── Road Closure Markers ── */}
          {showRoadClosures && roadClosures.map(rc => (
            <Marker
              key={rc.id}
              position={{ lat: rc.lat, lng: rc.lng }}
              onClick={() => setSelectedPOI({ ...rc, type: 'roadClosure' })}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${roadClosureSvg}`,
                anchor: { x: 14, y: 24 },
              }}
            />
          ))}

          {/* ── Flood Zone Markers ── */}
          {showFloodZones && floodZones.map(fz => (
            <Marker
              key={fz.id}
              position={{ lat: fz.lat, lng: fz.lng }}
              onClick={() => setSelectedPOI({ ...fz, type: 'floodZone' })}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${floodZoneSvg}`,
                anchor: { x: 12, y: 12 },
              }}
            />
          ))}

          {/* ── Flood Zone Circles ── */}
          {showFloodZones && <FloodCircles zones={floodZones} />}

          {/* ── POI InfoWindow ── */}
          {selectedPOI && (
            <InfoWindow
              position={{ lat: selectedPOI.lat, lng: selectedPOI.lng }}
              onCloseClick={() => setSelectedPOI(null)}
              headerContent={null}
            >
              <div className="font-sans px-1 py-0.5">
                <h4 className="font-bold text-sm text-gray-800 mb-1">{selectedPOI.name}</h4>
                {selectedPOI.type === 'hospital' && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-emerald-600">{selectedPOI.beds}</span> beds available
                  </p>
                )}
                {selectedPOI.type === 'roadClosure' && (
                  <p className="text-xs text-red-600 font-semibold">Road closed indefinitely</p>
                )}
                {selectedPOI.type === 'floodZone' && (
                  <p className="text-xs text-blue-600 font-semibold">Flood warning area</p>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* ── Live Route Info Badge ── */}
      {routeOptions[selectedRouteIndex] && vehicleProgress && (
        <div className="absolute bottom-4 left-4 z-[500] bg-[#0A0E17]/95 backdrop-blur-md border border-[#1E2638] rounded-xl shadow-2xl font-mono text-xs min-w-[300px] overflow-hidden">
          
          <div className="bg-[#1E2638]/50 px-4 py-2 border-b border-[#1E2638] flex justify-between items-center">
            <span className="text-white font-bold text-sm">DISPATCHED UNIT</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-400 font-bold tracking-wider uppercase">
                {vehicleProgress.progress >= 1 ? 'Arrived' : 'En Route'}
              </span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-brand-muted mb-0.5">ETA</div>
                <div className="text-white font-bold text-sm">
                  {vehicleProgress.progress >= 1 ? '0 min' : `${Math.ceil(vehicleProgress.remainingTime / 60)} min`}
                </div>
              </div>
              <div>
                <div className="text-brand-muted mb-0.5">Distance</div>
                <div className="text-white font-bold text-sm">
                  {(vehicleProgress.remainingDistance / 1000).toFixed(1)} km
                </div>
              </div>
              <div>
                <div className="text-brand-muted mb-0.5">Speed</div>
                <div className="text-white font-bold text-sm text-blue-400">
                  {vehicleProgress.progress >= 1 ? '0 km/h' : `${vehicleProgress.speed} km/h`}
                </div>
              </div>
              <div>
                <div className="text-brand-muted mb-0.5">Route</div>
                <div className="text-white font-bold text-sm truncate">
                  {selectedRouteIndex === 0 ? 'Primary' : `Alternate ${selectedRouteIndex}`}
                </div>
              </div>
            </div>

            <div className="w-full">
               <div className="flex justify-between text-[10px] text-brand-muted mb-1">
                 <span>Progress</span>
                 <span>{Math.round(vehicleProgress.progress * 100)}%</span>
               </div>
               <div className="w-full h-2 bg-[#1E2638] rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                   style={{ width: `${Math.round(vehicleProgress.progress * 100)}%` }}
                 ></div>
               </div>
            </div>

            {vehicleProgress.progress < 1 && (
              <div className="bg-[#1E2638]/30 rounded p-2 border border-[#1E2638]/50 mt-1">
                <div className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Next Turn</div>
                <div className="text-white flex items-center gap-2 text-sm">
                  <span className="text-blue-400 font-sans text-xl leading-none">↰</span> 
                  Follow route geometry
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
