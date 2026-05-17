import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function VirtualNumpad({ onSave, onClose }) {
  const [value, setValue] = useState('');

  const handleKey = (key) => {
    if (key === 'C') setValue('');
    else if (key === 'DEL') setValue(v => v.slice(0, -1));
    else setValue(v => v + key);
  };

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','DEL','C'];

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--panel-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: 'white' }}>Enter Value</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>✖</button>
      </div>
      <input type="text" value={value} readOnly style={{ width: '100%', padding: '10px', fontSize: '1.5rem', marginBottom: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', textAlign: 'right' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {keys.map(k => (
          <button key={k} onClick={() => handleKey(k)} style={{ padding: '15px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            {k}
          </button>
        ))}
      </div>
      <button onClick={() => onSave(value)} style={{ width: '100%', padding: '15px', marginTop: '10px', fontSize: '1.2rem', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
        Enter
      </button>
    </div>
  );
}

export default function KPITracker({ data, userId, onSave, onExit }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [gridData, setGridData] = useState({});
  const [padlocks, setPadlocks] = useState({}); 
  const [activeCell, setActiveCell] = useState(null);
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
  const kpis = data.kpis || [];
  const signupDate = data.signupDate || null;

  const isBeforeSignup = (offset) => {
    if (!signupDate) return false;
    const dateStr = getTargetDateStr(offset);
    return dateStr < signupDate;
  };

  const getTargetDateStr = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - offset));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!data.kpiLogs) return;
    const newGridData = {};
    const newPadlocks = {};
    for (let i = 0; i <= 6; i++) {
      const dateStr = getTargetDateStr(i);
      const log = data.kpiLogs[dateStr];
      if (log) {
        newPadlocks[i] = !!log.locked;
        if (log.data) {
          for (const [kId, cellVal] of Object.entries(log.data)) {
            newGridData[`${i}-${kId}`] = cellVal;
          }
        }
      } else {
        newPadlocks[i] = false;
      }
    }
    setGridData(newGridData);
    setPadlocks(newPadlocks);
  }, [data.kpiLogs]);

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

  const handleSaveValue = (val) => {
    if (!activeCell) return;
    const { dIdx, kpi } = activeCell;
    const numVal = parseFloat(val);
    
    let status = 'neutral';
    if (!isNaN(numVal)) {
      status = (numVal >= kpi.min && numVal <= kpi.max) ? 'success' : 'fail';
      if (status === 'success') {
        const r = Math.floor(Math.random() * 20) + 1;
        const audio = new Audio(`/sounds/sound${r}.mp3`);
        audio.play().catch(() => {});
      }
    }

    setGridData(prev => ({
      ...prev,
      [`${dIdx}-${kpi.id}`]: { value: val, status }
    }));
    setActiveCell(null);
  };

  const togglePadlock = (dIdx) => {
    const isCurrentlyClosed = padlocks[dIdx];
    if (!isCurrentlyClosed) {
      let omitted = false;
      for (const k of kpis) {
        const cell = gridData[`${dIdx}-${k.id}`];
        if (!cell || cell.value === '' || cell.value === null) {
          omitted = true;
          break;
        }
      }
      if (omitted) {
        setCustomAlert("PLEASE FILL IN ALL KPI'S FOR THIS DAY BEFORE CLOSING THE PADLOCK.");
        return;
      }
    }

    const newPadState = !isCurrentlyClosed;
    setPadlocks(prev => ({ ...prev, [dIdx]: newPadState }));
    
    const dateStr = getTargetDateStr(dIdx);
    const dayData = {};
    for (const k of kpis) {
      if (gridData[`${dIdx}-${k.id}`]) {
        dayData[k.id] = gridData[`${dIdx}-${k.id}`];
      }
    }
    
    const newKpiLogs = { 
      ...(data.kpiLogs || {}), 
      [dateStr]: { locked: newPadState, data: dayData } 
    };
    const newData = { ...data, kpiLogs: newKpiLogs };
    if (onSave) onSave(newData);
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
              <div style={{ background: '#222', padding: '40px', borderRadius: '15px', border: '3px solid #eab308', textAlign: 'center', maxWidth: '600px', boxShadow: '0 0 30px rgba(234, 179, 8, 0.5)' }}>
                <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold', lineHeight: '1.4' }}>{customAlert}</h2>
                <button onClick={() => setCustomAlert(null)} style={{ padding: '20px 60px', fontSize: '1.8rem', background: '#eab308', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="kpi-tracker" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-color, #1a1a1a)', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <h2 style={{ color: 'var(--text-color, white)', margin: 0, fontSize: '3rem' }}>KPI Tracker</h2>
             <button onClick={() => {if(onExit) onExit();}} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 25px', fontSize: '1.2rem', fontWeight: 'bold', background: 'var(--border, #444)', color: 'var(--text-color, white)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
               <img src="/icons/house.png" alt="Home" style={{ width: '24px', height: '24px' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
               <span style={{ display: 'none' }}>🏠</span>
               HOME
             </button>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div 
              draggable 
              onDragStart={(e) => {
                e.dataTransfer.setData('type', 'X');
              }}
              style={{ 
                width: '60px', height: '60px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--border, rgba(255,255,255,0.1))', 
                borderRadius: '50%', 
                cursor: 'grab',
                fontSize: '2rem',
                color: 'var(--danger, #ef4444)'
              }}
              title="Drag to fail a KPI without entering data"
            >
              ❌
            </div>
          </div>
        </div>

        <div className="grid-container" style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: `120px repeat(${Math.max(kpis.length, 1)}, 1fr) 80px`, gap: '8px' }}>
          {/* Header row */}
          <div className="cell header"></div>
          {kpis.map(k => (
            <div key={k.id} className="cell header" style={{ background: 'var(--border, #333)', color: 'var(--text-color, white)', padding: '15px', textAlign: 'center', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {k.label} <br/><small>({k.min}-{k.max})</small>
            </div>
          ))}
          {kpis.length === 0 && <div className="cell header"></div>}
          <div className="cell header" style={{ background: 'var(--border, #333)', color: 'var(--text-color, white)', padding: '15px', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold' }}>Lock</div>

          {/* Grid rows */}
          {days.map((day, dIdx) => {
            const blocked = isBeforeSignup(dIdx);
            return (
            <React.Fragment key={dIdx}>
              <div className="cell row-label" style={{ color: 'var(--text-color, white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-line', background: 'var(--border, rgba(255,255,255,0.05))', borderRadius: '8px', fontWeight: 'bold', opacity: blocked ? 0.4 : 1 }}>
                {day}
              </div>
              {kpis.length > 0 ? kpis.map(k => {
                if (blocked) {
                  return (
                    <div key={k.id} style={{ background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70px', opacity: 0.5 }} />
                  );
                }
                const cellData = gridData[`${dIdx}-${k.id}`] || { value: '', status: 'neutral' };
                const isLocked = padlocks[dIdx];
                
                let bgColor = 'var(--border, rgba(255,255,255,0.05))';
                if (cellData.status === 'success') bgColor = 'var(--success, #22c55e)';
                if (cellData.status === 'fail') bgColor = 'var(--danger, #ef4444)';

                return (
                  <div 
                    key={k.id}
                    onClick={() => {
                      if (!isLocked) setActiveCell({ dIdx, kpi: k });
                    }}
                    onDragOver={(e) => {
                      if (!isLocked) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (isLocked) return;
                      const type = e.dataTransfer.getData('type');
                      if (type === 'X') {
                        setGridData(prev => ({
                          ...prev,
                          [`${dIdx}-${k.id}`]: { value: '❌', status: 'fail' }
                        }));
                      }
                    }}
                    style={{ 
                      background: bgColor, 
                      borderRadius: '8px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '1.2rem',
                      minHeight: '70px', 
                      transition: 'background 0.2s',
                      cursor: isLocked ? 'default' : 'pointer'
                    }}
                  >
                    {cellData.value}
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

        {activeCell && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
            <VirtualNumpad onSave={handleSaveValue} onClose={() => setActiveCell(null)} />
          </div>
        )}

        {customAlert && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#222', padding: '40px', borderRadius: '15px', border: '3px solid #eab308', textAlign: 'center', maxWidth: '600px', boxShadow: '0 0 30px rgba(234, 179, 8, 0.5)' }}>
              <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold', lineHeight: '1.4' }}>{customAlert}</h2>
              <button onClick={() => setCustomAlert(null)} style={{ padding: '20px 60px', fontSize: '1.8rem', background: '#eab308', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return createPortal(renderContent(), document.body);
}
