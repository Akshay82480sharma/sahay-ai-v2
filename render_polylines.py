with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

polylines_code = """          {/* ?????? Route Polylines ?????? */}
          {routeOptions.map((route, index) => {
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

          {/* ?????? Animated Vehicle Marker ?????? */}"""

content = content.replace('{/* ?????? Animated Vehicle Marker ?????? */}', polylines_code)

with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
