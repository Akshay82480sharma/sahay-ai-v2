import re

with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_directions_route = """const DirectionsRoute = ({ origin, destination, onRoutesReady, selectedRouteIndex = 0 }) => {
  const map = useMap();
  const geometryLib = useMapsLibrary('geometry');

  const origKey = origin ? `${origin.lat},${origin.lng}` : '';
  const destKey = destination ? `${destination.lat},${destination.lng}` : '';

  useEffect(() => {
    if (!map || !geometryLib || !origin || !destination) return;

    const apiKey = 'AIzaSyAe7ZXaD5UCISdmth0v9u9oZnVQx2nu-Uc';
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    
    const requestBody = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVE',
      computeAlternativeRoutes: true
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
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
};"""

content = re.sub(r'const DirectionsRoute = \(\{.*?return null;\n\};\n', new_directions_route + '\n', content, flags=re.DOTALL)

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
