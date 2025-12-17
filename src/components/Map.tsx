
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import FlowLine from './FlowLine';
import ControlPanel from './ControlPanel';
import { useEffect, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
}

interface Flow {
  end_station_id: string;
  end_station_name: string;
  end_lat: number;
  end_lng: number;
  count: number;
}

const CHICAGO_CENTER: [number, number] = [41.8781, -87.6298];

// Helper to handle flying to station
function MapController({ selectedStation, onReset }: { selectedStation: Station | null, onReset: () => void }) {
    const map = useMap();
    useEffect(() => {
        if (selectedStation) {
            map.flyTo([selectedStation.lat, selectedStation.lng], 14, {
                duration: 1.5
            });
            onReset(); // Reset selection prop so we don't re-fly on other updates
        }
    }, [selectedStation, map, onReset]);
    return null;
}

export default function Map() {
  const [stations, setStations] = useState<Station[]>([]);
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [hideRacks, setHideRacks] = useState(false);
  const [stationToZoom, setStationToZoom] = useState<Station | null>(null);

  useEffect(() => {
    fetch('/data/stations.json')
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(err => console.error('Error loading stations:', err));
  }, []);

  const handleStationClick = (station: Station) => {
    setActiveStation(station);
    setFlows([]); // Clear previous flows immediately using React state
    
    // Fetch new flows from backend API
    fetch(`/api/station/${station.id}/flows`)
        .then(res => res.json())
        .then(data => setFlows(data))
        .catch(err => console.error("Error fetching flows:", err));
  };

  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // "Public Rack" filter also hides "Corral"
      if (hideRacks) {
        if (station.name.includes('Public Rack') || station.name.includes('Corral')) {
            return false;
        }
      }
      return true;
    });
  }, [stations, hideRacks]);

  const onStationSelect = (s: { lat: number, lng: number }) => {
      // Find full station object
      const fullStation = stations.find(st => st.lat === s.lat && st.lng === s.lng);
      if (fullStation) {
          setStationToZoom(fullStation);
          handleStationClick(fullStation); // Also select it to show flows
      }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      <ControlPanel 
        stations={stations} 
        onFilterChange={setHideRacks} 
        onStationSelect={onStationSelect}
      />
      
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
        
        <MapController selectedStation={stationToZoom} onReset={() => setStationToZoom(null)} />

        {/* Draw flows first so they are under stations */}
        {activeStation && flows.length > 0 && (() => {
            // Find max count for normalization
            const maxFlow = Math.max(...flows.map(f => f.count));
            
            return flows.map(flow => (
                <FlowLine 
                    key={flow.end_station_id}
                    positions={[
                        [activeStation.lat, activeStation.lng],
                        [flow.end_lat, flow.end_lng]
                    ]}
                    color='#00ccff'
                    // Scale width: min 1px, max 10px based on relative density
                    weight={Math.max(1, (flow.count / maxFlow) * 12)}
                    opacity={0.6}
                />
            ));
        })()}

        {filteredStations.map(station => (
          <CircleMarker 
            key={station.id} 
            center={[station.lat, station.lng]}
            radius={activeStation?.id === station.id ? 6 : 2}
            pathOptions={{ 
                color: activeStation?.id === station.id ? '#00ccff' : '#ff4c4c', 
                fillColor: activeStation?.id === station.id ? '#00ccff' : '#ff4c4c', 
                fillOpacity: 0.7, 
                weight: 0 
            }}
            eventHandlers={{
                click: () => handleStationClick(station)
            }}
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
