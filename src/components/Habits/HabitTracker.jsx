import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ICONS = [
  { id: 'happy', src: '/icons/happysmiley.png' },
  { id: 'sad', src: '/icons/sadsmiley.png' }
];

export default function HabitTracker({ data, userId, onSave, onExit }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [gridData, setGridData] = useState({});
  const [padlocks, setPadlocks] = useState({}); 
  const [hoverCell, setHoverCell] = useState(null);
  const [binHover, setBinHover] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);

  const generateDays = () => {
    const daysArr = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let offset = 0; offset <= 6; offset++) {
      if (offset === 5) {
        daysArr.push('Yesterday');
      } else if (offset === 6) {
        daysArr.push('Today');
      } else {
        const d = new Date();
        d.setDate(d.getDate() - (6 - offset));
        const dayStr = dayNames[d.getDay()];
        const dateStr = String(d.getDate()).padStart(2, '0');
        const monthStr = monthNames[d.getMonth()];
        const yearStr = String(d.getFullYear()).slice(-2);
        daysArr.push(`${dayStr}\n${dateStr}-${monthStr}-${yearStr}`);
      }
    }
    return daysArr;
  };
  const days = generateDays();
  const habits = data.habits || [];
  const signupDate = data.signupDate || null;

  const isBeforeSignup = (offset) => {
    if (!signupDate) return false;
    const dateStr = getTargetDateStr(offset);
    return dateStr < signupDate;
  };

  const getScheduleIndex = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - offset));
    let day = d.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getTargetDateStr = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - offset));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!data.habitLogs) return;
    const newGridData = {};
    const newPadlocks = {};
    for (let i = 0; i <= 6; i++) {
      const dateStr = getTargetDateStr(i);
      const log = data.habitLogs[dateStr];
      if (log) {
        newPadlocks[i] = !!log.locked;
        if (log.data) {
          for (const [hId, val] of Object.entries(log.data)) {
            newGridData[`${i}-${hId}`] = val;
          }
        }
      } else {
        newPadlocks[i] = false;
      }
    }
    setGridData(newGridData);
    setPadlocks(newPadlocks);
  }, [data.habitLogs]);

  const isRequired = (habit, offset) => {
    if (!habit.schedule || habit.schedule.length !== 7) return true;
    return habit.schedule[getScheduleIndex(offset)];
  };

  const handlePinClick = (num) => {
    setPinInput(p => p + num);
  };
  
  useEffect(() => {
    if (pinInput.length === 4) {
      if (pinInput === data.pin) {
        setIsUnlocked(true);
      } else {
        setCustomAlert('Incorrect PIN');
      }
      setPinInput('');
    }
  }, [pinInput, data.pin]);

  const updateAndSave = (newGrid, newPadlocks) => {
    setGridData(newGrid);
    setPadlocks(newPadlocks);
    
    const newLogs = { ...(data.habitLogs || {}) };
    for (let i = 0; i <= 6; i++) {
      const dateStr = getTargetDateStr(i);
      const dayData = {};
      for (const h of habits) {
        if (newGrid[`${i}-${h.id}`]) {
          dayData[h.id] = newGrid[`${i}-${h.id}`];
        }
      }
      newLogs[dateStr] = { locked: !!newPadlocks[i], data: dayData };
    }
    if (onSave) onSave({ ...data, habitLogs: newLogs });
  };

  const handleDropOnCell = (e, dayIdx, habit) => {
    e.preventDefault();
    setHoverCell(null);
    if (padlocks[dayIdx]) return; 
    if (!isRequired(habit, dayIdx)) return;
    
    const type = e.dataTransfer.getData('type');
    if (!type || type === 'sourcecell') return;

    const nextGrid = {
      ...gridData,
      [`${dayIdx}-${habit.id}`]: type
    };
    updateAndSave(nextGrid, padlocks);
    
    if (type === 'happy') {
      const r = Math.floor(Math.random() * 20) + 1;
      const audio = new Audio(`/sounds/sound${r}.mp3`);
      audio.play().catch(() => {});
    }
  };

  const handleDragOverCell = (e, dayIdx, habit) => {
    if (padlocks[dayIdx]) return;
    if (!isRequired(habit, dayIdx)) return;
    
    const isSourceCell = Array.from(e.dataTransfer.types || []).some(t => t.toLowerCase() === 'sourcecell');
    if (!isSourceCell) {
        e.preventDefault();
        setHoverCell(`${dayIdx}-${habit.id}`);
    }
  };

  const handleDragLeaveCell = (e) => {
    setHoverCell(null);
  };

  const handleDropOnBin = (e) => {
    e.preventDefault();
    setBinHover(false);
    const source = e.dataTransfer.getData('sourcecell');
    if (source) {
      const nextGrid = { ...gridData };
      delete nextGrid[source];
      updateAndSave(nextGrid, padlocks);
    }
  };

  const togglePadlock = (dIdx) => {
    const isCurrentlyClosed = padlocks[dIdx];
    if (!isCurrentlyClosed) {
      let omitted = false;
      for (const h of habits) {
        if (isRequired(h, dIdx)) {
          if (!gridData[`${dIdx}-${h.id}`]) {
            omitted = true;
            break;
          }
        }
      }
      if (omitted) {
        setCustomAlert('PLEASE FILL IN ALL REQUIRED HABITS FOR THIS DAY BEFORE CLOSING THE PADLOCK.');
        return;
      }
    }
    
    const newPadState = !isCurrentlyClosed;
    const nextPadlocks = { ...padlocks, [dIdx]: newPadState };
    updateAndSave(gridData, nextPadlocks);
  };

  const renderContent = () => {
    if (!isUnlocked) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-color, #111)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'var(--text-color, white)', marginBottom: '30px' }}>Enter PIN</h1>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: i < pinInput.length ? 'var(--accent, white)' : 'transparent', border: '2px solid var(--border, white)' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {[1,2,3,4,5,6,7,8,9, 'C', 0, 'Exit'].map(num => (
              <button 
                key={num} 
                onClick={() => {
                  if(num === 'Exit') {
                      if (onExit) onExit();
                  } else if(num === 'C') setPinInput('');
                  else handlePinClick(num);
                }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '1.5rem', background: 'var(--border, #333)', color: 'var(--text-color, white)', border: 'none', cursor: 'pointer' }}
              >
                {num}
              </button>
            ))}
          </div>
          
          {customAlert && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
              <div style={{ background: '#222', padding: '40px', borderRadius: '15px', border: '3px solid #ef4444', textAlign: 'center', maxWidth: '600px', boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)' }}>
                <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold', lineHeight: '1.4' }}>{customAlert}</h2>
                <button onClick={() => setCustomAlert(null)} style={{ padding: '20px 60px', fontSize: '1.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="habit-tracker" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-color, #1a1a1a)', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <h2 style={{ color: 'var(--text-color, white)', margin: 0, fontSize: '3rem' }}>Habit Tracker</h2>
             <button onClick={() => {if(onExit) onExit();}} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 25px', fontSize: '1.2rem', fontWeight: 'bold', background: 'var(--border, #444)', color: 'var(--text-color, white)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
               <img src="/icons/house.png" alt="Home" style={{ width: '24px', height: '24px' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
               <span style={{ display: 'none' }}>🏠</span>
               HOME
             </button>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {ICONS.map(icon => (
              <div 
                key={icon.id}
                draggable 
                onDragStart={(e) => {
                  e.dataTransfer.setData('type', icon.id);
                }}
                style={{ 
                  width: '60px', height: '60px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--border, rgba(255,255,255,0.1))', 
                  borderRadius: '50%', 
                  cursor: 'grab',
                  fontSize: '2rem'
                }}
              >
                <img src={icon.src} alt={icon.id} style={{ width: '40px', height: '40px', objectFit: 'contain', pointerEvents: 'none' }} />
              </div>
            ))}
            <div
              onDragOver={(e) => { e.preventDefault(); setBinHover(true); }}
              onDragLeave={() => setBinHover(false)}
              onDrop={handleDropOnBin}
              style={{
                width: '60px', height: '60px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: binHover ? '#ef4444' : 'var(--border, rgba(255,255,255,0.1))', 
                borderRadius: '50%', 
                fontSize: '2rem',
                transition: 'background 0.2s',
                color: 'white'
              }}
            >
              <img src="/icons/delete.png" alt="Delete" style={{ width: '32px', height: '32px', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <div className="grid-container" style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: `120px repeat(${Math.max(habits.length, 1)}, 1fr) 80px`, gap: '8px' }}>
          {/* Header row */}
          <div className="cell header"></div>
          {habits.map(h => (
            <div key={h.id} className="cell header" style={{ background: 'var(--border, #333)', color: 'var(--text-color, white)', padding: '15px', textAlign: 'center', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
              {h.label}
            </div>
          ))}
          {habits.length === 0 && <div className="cell header"></div>}
          <div className="cell header" style={{ background: 'var(--border, #333)', color: 'var(--text-color, white)', padding: '15px', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold' }}>Lock</div>

          {/* Grid rows */}
          {days.map((day, dIdx) => {
            const blocked = isBeforeSignup(dIdx);
            return (
            <React.Fragment key={dIdx}>
              <div className="cell row-label" style={{ color: 'var(--text-color, white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-line', background: 'var(--border, rgba(255,255,255,0.05))', borderRadius: '8px', fontWeight: 'bold', opacity: blocked ? 0.4 : 1 }}>
                {day}
              </div>
              {habits.length > 0 ? habits.map(h => {
                if (blocked) {
                  return (
                    <div key={h.id} className="cell drop-zone" style={{ background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70px', opacity: 0.5 }} />
                  );
                }
                const required = isRequired(h, dIdx);
                const cellValue = gridData[`${dIdx}-${h.id}`];
                const isHovered = hoverCell === `${dIdx}-${h.id}`;
                const isLocked = padlocks[dIdx];
                
                let bgColor = 'var(--border, rgba(255,255,255,0.05))';
                if (!required) bgColor = '#000';
                else if (isHovered) bgColor = '#3b82f6';
                else if (cellValue === 'happy') bgColor = 'var(--success, #22c55e)';
                else if (cellValue === 'sad') bgColor = 'var(--danger, #ef4444)';

                return (
                  <div 
                    key={h.id}
                    className="cell drop-zone"
                    draggable={!!cellValue && !isLocked}
                    onDragStart={(e) => {
                      if (!isLocked && cellValue) {
                        e.dataTransfer.setData('sourcecell', `${dIdx}-${h.id}`);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDrop={(e) => handleDropOnCell(e, dIdx, h)}
                    onDragOver={(e) => handleDragOverCell(e, dIdx, h)}
                    onDragLeave={handleDragLeaveCell}
                    style={{ 
                      background: bgColor, 
                      borderRadius: '8px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      minHeight: '70px', 
                      transition: 'background 0.2s',
                      opacity: required ? 1 : 0.5,
                      cursor: (cellValue && !isLocked) ? 'grab' : 'default'
                    }}
                  >
                    {cellValue === 'happy' && <img src="/icons/happysmiley.png" alt="happy" style={{ width: '40px', height: '40px', pointerEvents: 'none' }} />}
                    {cellValue === 'sad' && <img src="/icons/sadsmiley.png" alt="sad" style={{ width: '40px', height: '40px', pointerEvents: 'none' }} />}
                  </div>
                );
              }) : <div />}
              <div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border, rgba(255,255,255,0.05))', borderRadius: '8px', cursor: blocked ? 'default' : 'pointer' }}
                onClick={() => !blocked && togglePadlock(dIdx)}
              >
                <img src={blocked || padlocks[dIdx] ? "/icons/closedpadlock.png" : "/icons/openpoadlock.png"} alt="padlock" style={{ width: '30px', height: '30px', opacity: blocked ? 0.4 : 1 }} />
              </div>
            </React.Fragment>
            );
          })}
        </div>

        {customAlert && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#222', padding: '40px', borderRadius: '15px', border: '3px solid #ef4444', textAlign: 'center', maxWidth: '600px', boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)' }}>
              <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold', lineHeight: '1.4' }}>{customAlert}</h2>
              <button onClick={() => setCustomAlert(null)} style={{ padding: '20px 60px', fontSize: '1.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return createPortal(renderContent(), document.body);
}
