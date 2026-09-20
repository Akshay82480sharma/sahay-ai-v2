import re

with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Polyline component to not destroy on every render
new_polyline = """const Polyline = ({ path, options }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !maps) return;
    if (!polylineRef.current) {
      polylineRef.current = new maps.Polyline({ map });
    }
    polylineRef.current.setOptions({ path, ...options });
  }, [map, maps, path, options]);

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

# 2. Fix VehicleMarker to output dynamic speed
old_onprogress = """      onProgress && onProgress({
        progress,
        remainingDistance: remainingDist,
        remainingTime,
        currentPosition: { lat, lng },
      });"""

new_onprogress = """      let speedKmh = 55;
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
      });"""
if "remainingTime" in content and "currentPosition" in content:
    content = content.replace(old_onprogress, new_onprogress)

# 3. Update the UI to use the dynamic speed
content = content.replace("42 km/h", "{vehicleProgress.speed} km/h")

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
