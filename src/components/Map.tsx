
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
}

const CHICAGO_CENTER: [number, number] = [41.8781, -87.6298];

export default function Map() {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    fetch('/data/stations.json')
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(err => console.error('Error loading stations:', err));
  }, []);

  return (

    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer 
        center={CHICAGO_CENTER} 
        zoom={11} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {stations.map(station => (
          <CircleMarker 
            key={station.id} 
            center={[station.lat, station.lng]}
            radius={2}
            pathOptions={{ color: '#ff4c4c', fillColor: '#ff4c4c', fillOpacity: 0.7, weight: 0 }}
          >
            <Popup>
              <div className="text-black">
                <strong>{station.name}</strong><br />
                ID: {station.id}<br />
                Trips started/ended here: {station.count}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
