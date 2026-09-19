import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useIncidents } from '../../hooks/useIncidents';

// Fix leaflet default icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LiveMap() {
  const { incidents } = useIncidents();
  // Vadodara coordinates
  const defaultCenter = [22.3072, 73.1812];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {incidents?.map(inc => (
          inc.lat && inc.lng && (
            <Marker key={inc.id} position={[inc.lat, inc.lng]}>
              <Popup>
                <strong>{inc.type}</strong><br/>
                {inc.location_name}<br/>
                Severity: {inc.severity}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
