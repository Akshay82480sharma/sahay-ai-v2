import re

with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to split the route fetching and the rendering into two useEffects!
# First, let's replace the whole DirectionsRoute component.

new_component = """const DirectionsRoute = ({ origin, destination, onRoutesReady, selectedRouteIndex = 0 }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const renderersRef = useRef([]);
  const [directionsResult, setDirectionsResult] = useState(null);

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
          setDirectionsResult(result);
          
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

  // 2. Render routes and handle selection colors
  useEffect(() => {
    if (!map || !routesLib || !directionsResult) return;

    // Clear old renderers
    renderersRef.current.forEach(r => r.setMap(null));
    renderersRef.current = [];

    directionsResult.routes.forEach((route, index) => {
      const isSelected = index === selectedRouteIndex;
      const renderer = new routesLib.DirectionsRenderer({
        map,
        directions: directionsResult,
        routeIndex: index,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: isSelected ? '#f59e0b' : '#9ca3af',
          strokeOpacity: isSelected ? 0.9 : 0.4,
          strokeWeight: isSelected ? 6 : 4,
          zIndex: isSelected ? 10 : 1,
        },
      });
      renderersRef.current.push(renderer);
    });

    return () => {
      renderersRef.current.forEach(r => r.setMap(null));
      renderersRef.current = [];
    };
  }, [map, routesLib, directionsResult, selectedRouteIndex]);

  return null;
};"""

# Use regex to replace the entire DirectionsRoute component
content = re.sub(r'const DirectionsRoute = \(\{.*?return null;\n\};\n', new_component + '\n', content, flags=re.DOTALL)

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
