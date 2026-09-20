import re

with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_polyline = """const Polyline = ({ path, options }) => {
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
};"""

content = re.sub(r'const Polyline = \(\{.*?return null;\n\};\n', new_polyline + '\n', content, flags=re.DOTALL)

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
