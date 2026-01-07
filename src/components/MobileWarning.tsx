
import { useState, useEffect } from 'react';

export default function MobileWarning() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if screen width is less than 768px (standard tablet/mobile breakpoint)
    if (window.innerWidth < 768) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ff4c4c', // Red to catch attention
      color: 'white',
      padding: '12px',
      zIndex: 9999,
      textAlign: 'center',
      fontSize: '0.9rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ flex: 1 }}>
        <strong>Best viewed on Desktop.</strong> This visualization involves heavy graphics.
      </span>
      <button 
        onClick={() => setVisible(false)}
        style={{
          background: 'none',
          border: '1px solid white',
          color: 'white',
          borderRadius: '4px',
          padding: '4px 8px',
          marginLeft: '10px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ✕
      </button>
    </div>
  );
}
