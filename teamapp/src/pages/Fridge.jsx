import React, { useState } from 'react';

export default function Fridge() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="page fridge-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2>🧊 냉장고</h2>
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '700px', 
        borderRadius: '16px', 
        overflow: 'hidden',
        backgroundColor: '#ffffff' /* White placeholder background during load */
      }}>
        {/* Loading Spinner inside placeholder */}
        {!loaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            textAlign: 'center'
          }}>
            냉장고를 여는 중... 🧊
          </div>
        )}
        <iframe
          src="http://localhost:8501"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          onLoad={() => setLoaded(true)}
          style={{ 
            borderRadius: '16px', 
            border: 'none',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
            overflow: 'hidden'
          }}
          title="Streamlit Fridge Backend"
        ></iframe>
      </div>
    </div>
  );
}
