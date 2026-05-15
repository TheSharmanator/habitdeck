import React, { useState, useEffect } from 'react';
import HomePanel from './components/Home/HomePanel';
import HabitTracker from './components/Habits/HabitTracker';
import KPITracker from './components/KPIs/KPITracker';
import PostItCanvas from './components/PostIt/PostItCanvas';
import PostItViewer from './components/PostIt/PostItViewer';
import SettingsPanel from './components/Settings/SettingsPanel';
import BackupSetup from './components/BackupSetup';

function UserPanel({ userId, username, onOpenSettings, unreadMessages, onOpenPostIt, onOpenMessages }) {
  const [data, setData] = useState(null);
  const [currentView, setCurrentView] = useState('home');

  const fetchData = () => {
    fetch(`/api/data/${userId}?t=${Date.now()}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const saveData = async (newData) => {
    setData(newData);
    await fetch(`/api/data/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });
  };

  const toggleSnooze = () => {
    if (!data) return;
    const newData = { ...data, snooze_active: !data.snooze_active };
    saveData(newData);
  };

  const d = new Date();
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
  
  const habitDone = data?.habitLogs?.[yStr]?.locked;
  const kpiDone = data?.kpiLogs?.[yStr]?.locked;

  const yIsBeforeSignup = data?.signupDate ? (yStr < data.signupDate) : false;
  const yesterdayScheduleIndex = yDate.getDay() === 0 ? 6 : yDate.getDay() - 1;
  const isRequired = (item) => {
    if (!item.schedule || item.schedule.length !== 7) return true;
    return item.schedule[yesterdayScheduleIndex];
  };

  const hasHabitsForYesterday = data?.habits?.length > 0 && data.habits.some(isRequired);
  const hasKPIsForYesterday = data?.kpis?.length > 0 && data.kpis.some(isRequired);

  const shouldNagHabits = data && !data.snooze_active && d.getHours() >= 6 && currentView === 'home' && !habitDone && hasHabitsForYesterday && !yIsBeforeSignup;
  const shouldNagKPIs = data && !data.snooze_active && d.getHours() >= 6 && currentView === 'home' && !kpiDone && hasKPIsForYesterday && !yIsBeforeSignup;

  const renderView = () => {
    if (!data) return <p>Loading data...</p>;
    switch (currentView) {
      case 'home': return <HomePanel data={data} />;
      case 'habits': return <HabitTracker data={data} userId={userId} onSave={saveData} onExit={() => setCurrentView('home')} />;
      case 'kpis': return <KPITracker data={data} userId={userId} onSave={saveData} onExit={() => setCurrentView('home')} />;
      default: return <HomePanel data={data} />;
    }
  };

  const isSetup = data && !!data.pin;

  if (!isSetup) {
    return (
      <div className="user-panel" style={{ position: 'relative' }}>
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>User Not Configured</h2>
          <button onClick={onOpenSettings} style={{ padding: '15px 40px', fontSize: '1.2rem', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            Setup User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-panel" style={{ position: 'relative' }}>
      <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', filter: (shouldNagHabits || shouldNagKPIs) ? 'blur(8px)' : 'none', pointerEvents: (shouldNagHabits || shouldNagKPIs) ? 'none' : 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setCurrentView('home')}>
            {data && data.photo ? (
              <img src={data.photo} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                {data && data.username ? data.username[0] : username[0]}
              </div>
            )}
            <h2>{data && data.username ? data.username : username}</h2>
          </div>
          <div className="icons" style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => onOpenMessages()} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', position: 'relative' }} title="Messages">
              <img src="/icons/speechbubble.png" width="48" alt="Speech Bubble" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
              {unreadMessages > 0 && <span className="flash-badge" style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 24, height: 24, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', animation: 'flash 1s infinite' }}>{unreadMessages}</span>}
              <span style={{ display: 'none' }}>💬</span>
            </button>
            <button onClick={() => setCurrentView('kpis')} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer' }} title="KPI Tracker"><img src="/icons/kpi.png" width="48" alt="KPI Tracker" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} /><span style={{ display: 'none' }}>📊</span></button>
            <button onClick={() => setCurrentView('habits')} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer' }} title="Habit Tracker"><img src="/icons/habits.png" width="48" alt="Habits Tracker" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} /><span style={{ display: 'none' }}>✅</span></button>
            <button onClick={() => onOpenPostIt()} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer' }} title="Post-it Notes"><img src="/icons/postit.png" width="48" alt="Post-it Notes" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} /><span style={{ display: 'none' }}>📝</span></button>
            <button onClick={toggleSnooze} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', filter: data?.snooze_active ? 'drop-shadow(0 0 10px #ef4444) brightness(1.5)' : 'none' }} title="Snooze"><img src="/icons/snooze.png" width="48" alt="Snooze" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} /><span style={{ display: 'none' }}>💤</span></button>
            <button onClick={onOpenSettings} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer' }} title="Settings"><img src="/icons/dashboardgear.png" width="48" alt="Settings" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} /><span style={{ display: 'none' }}>⚙️</span></button>
          </div>
        </header>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {renderView()}
        </div>
      </div>
      
      {shouldNagHabits && (
        <div style={{ position: 'absolute', top: '10%', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', zIndex: 101 }}>
          <div className="annoying-flash" style={{ background: '#ef4444', padding: '30px', borderRadius: '20px', color: 'white', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 0 40px rgba(239, 68, 68, 0.8)', maxWidth: '80%' }}>
            <h2 style={{ fontSize: '1.8rem', lineHeight: '1.4', margin: '0 0 20px 0', textTransform: 'uppercase' }}>YOU NEED TO ENTER YOUR HABITS FOR YESTERDAY</h2>
            <button onClick={() => setCurrentView('habits')} style={{ padding: '15px 40px', fontSize: '1.5rem', cursor: 'pointer', background: 'white', color: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>YES, I WILL</button>
          </div>
        </div>
      )}

      {shouldNagKPIs && (
        <div style={{ position: 'absolute', bottom: '10%', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', zIndex: 101 }}>
          <div className="annoying-flash" style={{ background: '#eab308', padding: '30px', borderRadius: '20px', color: 'white', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 0 40px rgba(234, 179, 8, 0.8)', maxWidth: '80%' }}>
            <h2 style={{ fontSize: '1.8rem', lineHeight: '1.4', margin: '0 0 20px 0', textTransform: 'uppercase' }}>YOU NEED TO ENTER YOUR KPI'S FOR YESTERDAY</h2>
            <button onClick={() => setCurrentView('kpis')} style={{ padding: '15px 40px', fontSize: '1.5rem', cursor: 'pointer', background: 'white', color: '#eab308', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>YES, I WILL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [currentDate, setCurrentDate] = useState('');
  const [activeFullScreenSettings, setActiveFullScreenSettings] = useState(null);
  const [fullScreenPostIt, setFullScreenPostIt] = useState(null);
  const [viewingMessages, setViewingMessages] = useState(null);
  const [messages, setMessages] = useState({ u1: [], u2: [] });
  const [showBackupSetup, setShowBackupSetup] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg.firstRun) setShowBackupSetup(true);
        setConfigChecked(true);
      })
      .catch(() => setConfigChecked(true)); // fail safe — don't block app
  }, []);

  useEffect(() => {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
    setCurrentDate(formatted);
  }, []);

  if (!configChecked) return null; // wait for config check before rendering

  if (showBackupSetup) {
    return <BackupSetup onComplete={() => setShowBackupSetup(false)} />;
  }

  if (activeFullScreenSettings) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-color)' }}>
        <SettingsPanel 
          userId={activeFullScreenSettings} 
          onClose={() => setActiveFullScreenSettings(null)} 
        />
      </div>
    );
  }

  if (viewingMessages) {
    const userMessages = messages[viewingMessages];
    if (userMessages.length === 0) {
      setViewingMessages(null);
      return null;
    }
    
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-color)', padding: '20px' }}>
        <PostItViewer 
          messageDataUrl={userMessages[0]}
          onClose={() => setViewingMessages(null)}
          onRead={() => {
            setMessages(prev => {
              const remaining = prev[viewingMessages].slice(1);
              if (remaining.length === 0) setViewingMessages(null);
              return { ...prev, [viewingMessages]: remaining };
            });
          }}
        />
      </div>
    );
  }

  if (fullScreenPostIt) {
    const otherUserId = fullScreenPostIt === 'u1' ? 'u2' : 'u1';
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-color)', padding: '20px' }}>
        <PostItCanvas 
          onClose={() => setFullScreenPostIt(null)}
          onSend={(dataUrl) => {
            setMessages(prev => ({ ...prev, [otherUserId]: [...prev[otherUserId], dataUrl] }));
            setFullScreenPostIt(null);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-color)', borderBottom: '1px solid var(--border)', fontSize: '1.2rem', fontWeight: 'bold', zIndex: 10 }}>
        {currentDate}
      </div>
      
      <div className="split-layout" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <UserPanel 
          userId="u1" 
          username="User 1" 
          onOpenSettings={() => setActiveFullScreenSettings('u1')} 
          unreadMessages={messages.u1.length}
          onOpenPostIt={() => setFullScreenPostIt('u1')}
          onOpenMessages={() => {
            if (messages.u1.length > 0) setViewingMessages('u1');
          }}
        />
        <UserPanel 
          userId="u2" 
          username="User 2" 
          onOpenSettings={() => setActiveFullScreenSettings('u2')} 
          unreadMessages={messages.u2.length}
          onOpenPostIt={() => setFullScreenPostIt('u2')}
          onOpenMessages={() => {
            if (messages.u2.length > 0) setViewingMessages('u2');
          }}
        />
      </div>
    </div>
  );
}

export default App;
