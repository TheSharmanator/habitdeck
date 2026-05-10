import React from 'react';

export default function PostItViewer({ messageDataUrl, onRead, onClose }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingBottom: '10px' }}>
        <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--panel-bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '1.2rem' }}>Home</button>
        <button onClick={onRead} style={{ padding: '10px 20px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem' }}>Read (Next)</button>
      </div>

      <div style={{ flex: 1, border: '2px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black' }}>
        <img 
          src={messageDataUrl} 
          alt="Received Post-it" 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
        />
      </div>
    </div>
  );
}
