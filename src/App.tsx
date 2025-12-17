import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Chicago Open-Source Map</h1>

      {/* Map */}
      <MapContainer
        center={[41.8781, -87.6298]} // Chicago
        zoom={11}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      {/* Existing Vite demo UI */}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </>
  )
}

export default App
