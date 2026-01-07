import Map from './components/Map';
import MobileWarning from './components/MobileWarning';

function App() {
  return (

    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      <MobileWarning />
      <Map />
    </div>
  );
}

export default App;
