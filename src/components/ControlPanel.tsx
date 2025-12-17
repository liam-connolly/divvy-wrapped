
import { useState } from 'react';

interface Props {
  stations: { id: string; name: string; lat: number; lng: number }[];
  onStationSelect: (station: { lat: number; lng: number }) => void;
  onFilterChange: (hideRacks: boolean) => void;
}

export default function ControlPanel({ stations, onStationSelect, onFilterChange }: Props) {

  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideRacks, setHideRacks] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  // Search Logic
  const filteredStations = searchQuery.length > 2 
    ? stations.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) 
    : [];

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHideRacks(checked);
    onFilterChange(checked);
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '12px',
        zIndex: 1000,
        width: isOpen ? '300px' : 'auto',
        border: '1px solid #333',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          padding: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid #333' : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Divvy Wrapped 2025</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{isOpen ? 'Close' : 'Menu'}</span>
      </div>

      {isOpen && (
        <div style={{ padding: '16px', overflowY: 'auto' }}>
          
          {/* Search Bar */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #444',
                backgroundColor: '#222',
                color: 'white',
                boxSizing: 'border-box'
              }}
            />
            {filteredStations.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#222',
                border: '1px solid #444',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10
              }}>
                {filteredStations.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                        onStationSelect(s);
                        setSearchQuery('');
                    }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #333'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#222'}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>About</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#ccc' }}>
              Explore the flow of Divvy bikes across Chicago in 2025. 
              Click on any station to see where rides go.
            </p>
            
            {/* FAQ Dropdown */}
            <div style={{ marginTop: '10px' }}>
                <div 
                    onClick={() => setShowFAQ(!showFAQ)}
                    style={{ cursor: 'pointer', color: '#00ccff', fontSize: '0.9rem' }}
                >
                    {showFAQ ? 'Hide FAQs' : 'View FAQs'}
                </div>
                {showFAQ && (
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#aaa' }}>
                        <p><strong>Q: What do the arrows mean?</strong><br/>They show the direction and volume of trips originating from the selected station.</p>
                        <p style={{ marginTop: '8px' }}><strong>Q: Why are some lines thicker?</strong><br/>Thicker lines represent more popular routes.</p>
                    </div>
                )}
            </div>
          </div>

          {/* Filters Section */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Filters</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', backgroundColor: '#222', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                checked={hideRacks} 
                onChange={handleFilterChange}
                style={{ accentColor: '#00ccff', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Hide Public Racks</span>
            </label>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', marginLeft: '4px' }}>
                *Also hides "Corral" stations
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
