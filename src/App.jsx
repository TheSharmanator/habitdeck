import React, { useState, useEffect, useRef } from 'react';
import HomePanel from './components/Home/HomePanel';
import HabitTracker from './components/Habits/HabitTracker';
import KPITracker from './components/KPIs/KPITracker';
import PostItCanvas from './components/PostIt/PostItCanvas';
import PostItViewer from './components/PostIt/PostItViewer';
import SettingsPanel from './components/Settings/SettingsPanel';
import BackupSetup from './components/BackupSetup';

function isDndTime() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= 21 * 60 || mins < 5 * 60 + 30;
}

function DndScreen({ onWake }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      onClick={onWake}
      onTouchStart={onWake}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'none', userSelect: 'none',
      }}
    >
      <span style={{
        color: '#3a3a3a',
        fontSize: '6rem',
        fontFamily: 'monospace',
        fontWeight: '300',
        letterSpacing: '0.05em',
      }}>
        {time}
      </span>
    </div>
  );
}

function UserPanel({ userId, username, onOpenSettings, unreadMessages, onOpenPostIt, onOpenMessages, settingsJustClosed }) {
  const [data, setData] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [, setTick] = useState(0);

  const fetchData = () => {
    fetch(`/api/data/${userId}?t=${Date.now()}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Schedule a single re-render at exactly 6am if we haven't reached it yet
  useEffect(() => {
    const now = new Date();
    const sixAm = new Date(now);
    sixAm.setHours(6, 0, 0, 0);
    if (now >= sixAm) return; // already past 6am, nag renders immediately
    const msUntil6am = sixAm - now;
    const timer = setTimeout(() => setTick(t => t + 1), msUntil6am);
    return () => clearTimeout(timer);
  }, []);

  // Re-fetch whenever settings panel closes so we pick up PIN / name / photo
  useEffect(() => {
    if (settingsJustClosed) fetchData();
  }, [settingsJustClosed]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div 
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }} 
              onClick={() => setShowPhotoModal(true)}
            >
              {data && data.photo ? (
                <img src={data.photo} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                  {data && data.username ? data.username[0] : username[0]}
                </div>
              )}
            </div>
            <h2 style={{ cursor: 'pointer' }} onClick={() => setCurrentView('home')}>{data && data.username ? data.username : username}</h2>
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
      {/* In-app photo/settings modal — no system dialogs */}
      {showPhotoModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--panel-bg)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '30px 40px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxWidth: '320px', width: '90%'
          }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '24px', lineHeight: 1.5 }}>
              What would you like to do?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => { setShowPhotoModal(false); onOpenSettings(); }}
                style={{ padding: '14px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ⚙️ Open Settings
              </button>
              <button
                onClick={() => setShowPhotoModal(false)}
                style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
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
  const [settingsCloseCount, setSettingsCloseCount] = useState({ u1: 0, u2: 0 });
  const [dndActive, setDndActive] = useState(() => isDndTime());
  const inactivityRef = useRef(null);

  // Schedule re-evaluation at the next DND boundary (21:00 or 05:30)
  useEffect(() => {
    let timer;
    const scheduleNext = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const target = new Date(now);
      if (mins < 5 * 60 + 30) {
        target.setHours(5, 30, 0, 0);
      } else if (mins < 21 * 60) {
        target.setHours(21, 0, 0, 0);
      } else {
        target.setDate(target.getDate() + 1);
        target.setHours(5, 30, 0, 0);
      }
      timer = setTimeout(() => {
        setDndActive(isDndTime());
        scheduleNext();
      }, Math.max(0, target - now) + 500);
    };
    scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  // When screen is woken during DND, re-blank after 2 min of inactivity
  useEffect(() => {
    if (dndActive) {
      clearTimeout(inactivityRef.current);
      return;
    }
    if (!isDndTime()) return;

    const arm = () => {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(() => setDndActive(true), 2 * 60 * 1000);
    };
    arm();
    window.addEventListener('mousemove', arm);
    window.addEventListener('mousedown', arm);
    window.addEventListener('keydown', arm);
    window.addEventListener('touchstart', arm);
    return () => {
      clearTimeout(inactivityRef.current);
      window.removeEventListener('mousemove', arm);
      window.removeEventListener('mousedown', arm);
      window.removeEventListener('keydown', arm);
      window.removeEventListener('touchstart', arm);
    };
  }, [dndActive]);

  const closeSettings = (userId) => {
    setActiveFullScreenSettings(null);
    setSettingsCloseCount(prev => ({ ...prev, [userId]: prev[userId] + 1 }));
  };

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
    const updateDate = () => {
      const d = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formatted = `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
      setCurrentDate(formatted);
    };
    updateDate();
    const interval = setInterval(updateDate, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!configChecked) return null;

  if (showBackupSetup) {
    return <BackupSetup onComplete={() => setShowBackupSetup(false)} />;
  }

  if (dndActive) {
    return <DndScreen onWake={() => setDndActive(false)} />;
  }

  if (activeFullScreenSettings) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-color)' }}>
        <SettingsPanel 
          userId={activeFullScreenSettings} 
          onClose={() => closeSettings(activeFullScreenSettings)} 
        />
      </div>
    );
  }

  if (viewingMessages) {
    const userMessages = messages[viewingMessages];
    
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-color)', padding: '20px' }}>
        {userMessages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <button onClick={() => setViewingMessages(null)} style={{ padding: '20px 40px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        ) : (
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
        )}
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
          settingsJustClosed={settingsCloseCount.u1}
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
          settingsJustClosed={settingsCloseCount.u2}
          onOpenMessages={() => {
            if (messages.u2.length > 0) setViewingMessages('u2');
          }}
        />
      </div>
    </div>
  );
}

export default App;
