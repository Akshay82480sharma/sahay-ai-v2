import re

with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a Polyline component at the top of the file, outside LiveMap
polyline_code = """
import { useMap, useMapsLibrary, APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

// Polyline component for vis.gl
const Polyline = ({ path, options }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !maps) return;
    if (!polylineRef.current) {
      polylineRef.current = new maps.Polyline({
        map,
        path,
        ...options
      });
    } else {
      polylineRef.current.setOptions({ path, ...options });
    }
    
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, maps, path, options]);

  return null;
};
"""

content = content.replace("import { useMap, useMapsLibrary, APIProvider, Map, Marker } from '@vis.gl/react-google-maps';", polyline_code)

# Now remove the DirectionsRenderer logic from DirectionsRoute
directions_route_new = """const DirectionsRoute = ({ origin, destination, onRoutesReady, selectedRouteIndex = 0 }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  const origKey = origin ? `${origin.lat},${origin.lng}` : '';
  const destKey = destination ? `${destination.lat},${destination.lng}` : '';

  // 1. Fetch routes
  useEffect(() => {
    if (!map || !routesLib || !origin || !destination) return;

    const service = new routesLib.DirectionsService();

    service.route(
      {
        origin,
        destination,
        travelMode: routesLib.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (status === 'OK') {
          // Pass all routes up
          const routeOptions = result.routes.map((route, idx) => {
            const leg = route.legs[0];
            return {
              index: idx,
              summary: route.summary || `Route ${idx + 1}`,
              distance: leg.distance?.text || '',
              duration: leg.duration?.text || '',
              path: route.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() })),
            };
          });
          if (onRoutesReady) onRoutesReady(routeOptions);
        } else {
          console.error("Directions error:", status);
          // Fallback to straight line if routing fails
          const fakePath = [origin, destination];
          if (onRoutesReady) onRoutesReady([{
            index: 0,
            summary: "Direct Route (Fallback)",
            distance: "Unknown",
            duration: "Unknown",
            path: fakePath
          }]);
        }
      }
    );
  }, [map, routesLib, origKey, destKey, onRoutesReady]);

  return null;
};"""

content = re.sub(r'const DirectionsRoute = \(\{.*?return null;\n\};\n', directions_route_new + '\n', content, flags=re.DOTALL)

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
