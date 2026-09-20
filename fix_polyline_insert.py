with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

polyline_code = """
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
"""

import re
# Insert right before DirectionsRoute
# Because of emojis, use a flexible regex
content = re.sub(r'// \?\?\?\?\?\? Directions Route.*?\n', polyline_code + '\n// ?????? Directions Route\n', content)

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
