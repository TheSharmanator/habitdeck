import React, { useState } from 'react';

const btn = (extra = {}) => ({
  padding: '18px 40px',
  fontSize: '1.3rem',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  ...extra
});

export default function BackupSetup({ onComplete }) {
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveConfig = async (enabled, driveConfig = {}) => {
    setSaving(true);
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstRun: false, backupEnabled: enabled, driveConfig })
    });
    setSaving(false);
    onComplete();
  };

  const handleNo = () => saveConfig(false);

  const handleSave = () => {
    if (!clientId.trim() || !clientSecret.trim() || !refreshToken.trim()) {
      setError('All three fields are required.');
      return;
    }
    saveConfig(true, {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      refreshToken: refreshToken.trim()
    });
  };

  const wrap = {
    position: 'fixed', inset: 0,
    background: 'var(--bg-color, #111)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px', gap: '30px',
    color: 'white', fontFamily: 'inherit'
  };

  // Step 1 — Yes / No
  if (step === 1) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, textAlign: 'center' }}>Welcome to HabitDeck 🎯</h1>
        <p style={{ fontSize: '1.3rem', color: 'var(--text-muted, #aaa)', textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
          Would you like your data automatically backed up to <strong>Google Drive</strong> every night at <strong>2am</strong>?
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            style={btn({ background: 'var(--success, #22c55e)', color: 'white', minWidth: '200px' })}
            onClick={() => setStep(2)}
          >
            ✅ Yes, back it up
          </button>
          <button
            style={btn({ background: 'rgba(255,255,255,0.1)', color: 'white', minWidth: '200px' })}
            onClick={handleNo}
          >
            ❌ No thanks
          </button>
        </div>
      </div>
    );
  }

  // Step 2 — Instructions + fields
  const stepStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border, #333)',
    borderRadius: '12px',
    padding: '20px 25px',
    maxWidth: '680px',
    width: '100%',
    lineHeight: '1.7'
  };

  const labelStyle = { fontSize: '0.95rem', color: 'var(--text-muted, #aaa)', marginBottom: '6px', display: 'block' };
  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: '1rem',
    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border, #444)',
    color: 'white', borderRadius: '8px', boxSizing: 'border-box'
  };

  return (
    <div style={{ ...wrap, justifyContent: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '2rem', margin: 0 }}>Google Drive Backup — 3 Steps</h1>

      <div style={stepStyle}>
        <p style={{ margin: '0 0 8px 0' }}><strong>Step 1</strong> — Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>console.cloud.google.com</a></p>
        <p style={{ margin: 0, color: '#aaa' }}>Create a new project (or pick an existing one). Search for <strong>"Google Drive API"</strong> and click <strong>Enable</strong>.</p>
      </div>

      <div style={stepStyle}>
        <p style={{ margin: '0 0 8px 0' }}><strong>Step 2</strong> — Create your credentials</p>
        <p style={{ margin: 0, color: '#aaa' }}>
          Go to <strong>APIs &amp; Services → Credentials</strong>.<br />
          Click <strong>Create Credentials → OAuth 2.0 Client ID</strong>.<br />
          Application type: <strong>Desktop app</strong>. Give it any name. Save.<br />
          Copy your <strong>Client ID</strong> and <strong>Client Secret</strong>.
        </p>
      </div>

      <div style={stepStyle}>
        <p style={{ margin: '0 0 8px 0' }}><strong>Step 3</strong> — Get your Refresh Token</p>
        <p style={{ margin: 0, color: '#aaa' }}>
          Go to <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>developers.google.com/oauthplayground</a><br />
          Click the ⚙️ gear icon (top right) → tick <strong>"Use your own OAuth credentials"</strong>.<br />
          Paste your Client ID and Client Secret.<br />
          In the left panel, find <strong>Drive API v3</strong> and select <strong>https://www.googleapis.com/auth/drive.file</strong><br />
          Click <strong>Authorise APIs</strong> → sign in → Click <strong>Exchange authorisation code for tokens</strong>.<br />
          Copy the <strong>Refresh token</strong>.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Client ID</label>
          <input style={inputStyle} value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Paste your Client ID here" />
        </div>
        <div>
          <label style={labelStyle}>Client Secret</label>
          <input style={inputStyle} value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Paste your Client Secret here" />
        </div>
        <div>
          <label style={labelStyle}>Refresh Token</label>
          <input style={inputStyle} value={refreshToken} onChange={e => setRefreshToken(e.target.value)} placeholder="Paste your Refresh Token here" />
        </div>

        {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button
            style={btn({ background: 'var(--accent, #6366f1)', color: 'white', flex: 1 })}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save & Enable Backup'}
          </button>
          <button
            style={btn({ background: 'rgba(255,255,255,0.1)', color: 'white' })}
            onClick={handleNo}
            disabled={saving}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
