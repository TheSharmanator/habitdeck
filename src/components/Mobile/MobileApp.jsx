import React, { useState, useEffect } from 'react';
import MobileHabits from './MobileHabits';
import MobileKPIs from './MobileKPIs';
import MobileSettings from './MobileSettings';

const emptyUser = { username: '', pin: '', habits: [], kpis: [] };
const SESSION_KEY = 'habitdeck_mobile_session';
const VIEW_KEY = 'habitdeck_mobile_view';

export default function MobileApp() {
  const [screen, setScreen] = useState('loading'); // loading | pick-user | pin | main
  const [users, setUsers] = useState({ u1: emptyUser, u2: emptyUser });
  const [selectedUser, setSelectedUser] = useState(null);
  const [data, setData] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [view, setView] = useState('habits');

  useEffect(() => {
    Promise.all(['u1', 'u2'].map(id =>
      fetch(`/api/data/${id}?t=${Date.now()}`)
        .then(res => res.json())
        .then(d => { setUsers(prev => ({ ...prev, [id]: d })); return [id, d]; })
        .catch(() => [id, null])
    )).then(results => {
      const savedUser = localStorage.getItem(SESSION_KEY);
      const restored = savedUser && results.find(([id, d]) => id === savedUser && d?.pin);
      if (restored) {
        setSelectedUser(savedUser);
        setData(restored[1]);
        setView(localStorage.getItem(VIEW_KEY) || 'habits');
        setScreen('main');
      } else {
        localStorage.removeItem(SESSION_KEY);
        setScreen('pick-user');
      }
    });
  }, []);

  useEffect(() => {
    if (screen !== 'pin' || !data) return;
    if (pinInput.length === 4) {
      if (pinInput === data.pin) {
        setPinError('');
        localStorage.setItem(SESSION_KEY, selectedUser);
        localStorage.setItem(VIEW_KEY, 'habits');
        setScreen('main');
        setView('habits');
      } else {
        setPinError('Incorrect PIN');
      }
      setPinInput('');
    }
  }, [pinInput, screen, data]);

  const pickUser = (id) => {
    setSelectedUser(id);
    setData(users[id]);
    setPinError('');
    setPinInput('');
    setScreen('pin');
  };

  const saveData = async (newData) => {
    setData(newData);
    setUsers(prev => ({ ...prev, [selectedUser]: newData }));
    await fetch(`/api/data/${selectedUser}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });
  };

  const switchView = (v) => {
    localStorage.setItem(VIEW_KEY, v);
    setView(v);
  };

  const deleteAccount = async () => {
    try {
      await fetch(`/api/data/${selectedUser}`, { method: 'DELETE' });
    } finally {
      logOut();
      window.location.reload();
    }
  };

  const logOut = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(VIEW_KEY);
    setScreen('pick-user');
    setSelectedUser(null);
    setData(null);
    setPinInput('');
  };

  if (screen === 'loading') {
    return <div className="mobile-app" />;
  }

  if (screen === 'pick-user') {
    return (
      <div className="mobile-app">
        <div className="mobile-screen mobile-hero-layout">
          <div className="mobile-hero-top">
            <div className="mobile-hero-icon">🎯</div>
            <h1 className="mobile-title">HabitDeck</h1>
            <p className="mobile-subtitle">Who's logging in?</p>
          </div>
          <div className="mobile-user-list">
            {['u1', 'u2'].map(id => {
              const u = users[id];
              const isSetup = !!u.pin;
              return (
                <button
                  key={id}
                  className="mobile-user-row"
                  disabled={!isSetup}
                  onClick={() => isSetup && pickUser(id)}
                >
                  {u.photo ? (
                    <img src={u.photo} alt="" className="mobile-user-photo" />
                  ) : (
                    <div className="mobile-user-avatar">{(u.username || id)[0].toUpperCase()}</div>
                  )}
                  <div className="mobile-user-row-text">
                    <span className="mobile-user-row-name">{u.username || (isSetup ? id : 'Not set up')}</span>
                    {isSetup && <span className="mobile-user-row-hint">Tap to enter PIN</span>}
                  </div>
                  {isSetup && <span className="mobile-user-row-chevron">›</span>}
                </button>
              );
            })}
          </div>
          <div className="mobile-hero-footer">HabitDeck · Mobile Entry</div>
        </div>
      </div>
    );
  }

  if (screen === 'pin') {
    return (
      <div className="mobile-app">
        <div className="mobile-screen mobile-hero-layout">
          <div className="mobile-hero-top">
            {data?.photo ? (
              <img src={data.photo} alt="" className="mobile-pin-photo" />
            ) : (
              <div className="mobile-hero-icon">🔒</div>
            )}
            <h1 className="mobile-title">{data?.username}</h1>
            <p className={`mobile-subtitle ${pinError ? 'error' : ''}`}>{pinError || 'Enter PIN'}</p>
            <div className="mobile-pin-dots">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`mobile-pin-dot ${i < pinInput.length ? 'filled' : ''}`} />
              ))}
            </div>
          </div>
          <div className="mobile-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'Back'].map(num => (
              <button
                key={num}
                className="mobile-numpad-key"
                onClick={() => {
                  if (num === 'Back') { setScreen('pick-user'); return; }
                  if (num === 'C') { setPinInput(''); setPinError(''); return; }
                  setPinInput(p => (p.length < 4 ? p + num : p));
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      <div className="mobile-shell">
        <header className="mobile-header">
          <span className="mobile-header-user">{data.username}</span>
          <button className="mobile-link-btn" onClick={logOut}>Switch User</button>
        </header>
        <main className="mobile-main">
          {view === 'settings'
            ? <MobileSettings
                data={data}
                onSave={saveData}
                onClose={() => switchView('habits')}
                onDeleteAccount={deleteAccount}
              />
            : view === 'kpis'
              ? <MobileKPIs data={data} onSave={saveData} />
              : <MobileHabits data={data} onSave={saveData} />}
        </main>
        <nav className="mobile-bottom-nav">
          <button className={`mobile-nav-btn ${view === 'habits' ? 'active' : ''}`} onClick={() => switchView('habits')}>
            <span className="mobile-nav-icon">✅</span>
            <span>Habits</span>
          </button>
          <button className={`mobile-nav-btn ${view === 'kpis' ? 'active' : ''}`} onClick={() => switchView('kpis')}>
            <span className="mobile-nav-icon">📊</span>
            <span>KPIs</span>
          </button>
          <button className={`mobile-nav-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => switchView('settings')}>
            <span className="mobile-nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
