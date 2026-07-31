import React, { useState } from 'react';

function getTargetDateStr(offset) {
  const d = new Date();
  d.setDate(d.getDate() - (6 - offset));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getScheduleIndex(offset) {
  const d = new Date();
  d.setDate(d.getDate() - (6 - offset));
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

function getDayTitle(offset) {
  if (offset === 6) return 'Today';
  if (offset === 5) return 'Yesterday';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  d.setDate(d.getDate() - (6 - offset));
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
}

export default function MobileHabits({ data, onSave }) {
  const [selectedDay, setSelectedDay] = useState(6);
  const [alert, setAlert] = useState(null);

  const habits = data.habits || [];
  const signupDate = data.signupDate || null;

  const isBeforeSignup = (offset) => {
    if (!signupDate) return false;
    return getTargetDateStr(offset) < signupDate;
  };

  const isRequired = (habit, offset) => {
    if (!habit.schedule || habit.schedule.length !== 7) return true;
    return habit.schedule[getScheduleIndex(offset)];
  };

  const dateStr = getTargetDateStr(selectedDay);
  const log = data.habitLogs?.[dateStr] || { locked: false, data: {} };
  const locked = !!log.locked;
  const blocked = isBeforeSignup(selectedDay);

  const setValue = (habitId, value) => {
    if (locked || blocked) return;
    const newLogs = { ...(data.habitLogs || {}) };
    const dayData = { ...(newLogs[dateStr]?.data || {}) };
    if (value === null) delete dayData[habitId];
    else dayData[habitId] = value;
    newLogs[dateStr] = { locked: false, data: dayData };
    onSave({ ...data, habitLogs: newLogs });

    if (value === 'happy') {
      const r = Math.floor(Math.random() * 20) + 1;
      new Audio(`/sounds/sound${r}.mp3`).play().catch(() => {});
    }
  };

  const toggleLock = () => {
    if (blocked) return;
    if (!locked) {
      const missing = habits.some(h => isRequired(h, selectedDay) && !log.data?.[h.id]);
      if (missing) {
        setAlert('Please fill in all required habits before locking this day.');
        return;
      }
    }
    const newLogs = { ...(data.habitLogs || {}) };
    newLogs[dateStr] = { locked: !locked, data: log.data || {} };
    onSave({ ...data, habitLogs: newLogs });
  };

  return (
    <div className="mobile-tracker">
      <div className="mobile-day-nav">
        <button
          className="mobile-day-nav-btn"
          disabled={selectedDay <= 0}
          onClick={() => setSelectedDay(d => Math.max(0, d - 1))}
        >‹</button>
        <div className="mobile-day-nav-label">{getDayTitle(selectedDay)}</div>
        <button
          className="mobile-day-nav-btn"
          disabled={selectedDay >= 6}
          onClick={() => setSelectedDay(d => Math.min(6, d + 1))}
        >›</button>
      </div>
      {selectedDay !== 6 && (
        <button className="mobile-today-btn" onClick={() => setSelectedDay(6)}>Jump to Today</button>
      )}

      {blocked ? (
        <p className="mobile-empty-msg">This day is before your signup date.</p>
      ) : habits.length === 0 ? (
        <p className="mobile-empty-msg">No habits set up yet. Use the main dashboard to add some.</p>
      ) : (
        <div className="mobile-habit-list">
          {habits.map(h => {
            const required = isRequired(h, selectedDay);
            const value = log.data?.[h.id];
            return (
              <div key={h.id} className={`mobile-habit-row ${!required ? 'not-required' : ''}`}>
                <div className="mobile-habit-label">{h.label}{!required && <small> (not scheduled)</small>}</div>
                <div className="mobile-habit-actions">
                  <button
                    className={`mobile-icon-btn ${value === 'happy' ? 'selected-happy' : ''}`}
                    disabled={locked || !required}
                    onClick={() => setValue(h.id, 'happy')}
                  ><img src="/icons/happysmiley.png" alt="happy" /></button>
                  <button
                    className={`mobile-icon-btn ${value === 'sad' ? 'selected-sad' : ''}`}
                    disabled={locked || !required}
                    onClick={() => setValue(h.id, 'sad')}
                  ><img src="/icons/sadsmiley.png" alt="sad" /></button>
                  {value && !locked && (
                    <button className="mobile-clear-btn" onClick={() => setValue(h.id, null)}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!blocked && habits.length > 0 && (
        <button className={`mobile-lock-btn ${locked ? 'locked' : ''}`} onClick={toggleLock}>
          <img src={locked ? '/icons/closedpadlock.png' : '/icons/openpoadlock.png'} alt="" />
          {locked ? 'Day Locked — Tap to Unlock' : 'Lock Day'}
        </button>
      )}

      {alert && (
        <div className="mobile-alert-overlay" onClick={() => setAlert(null)}>
          <div className="mobile-alert-box" onClick={e => e.stopPropagation()}>
            <p>{alert}</p>
            <button onClick={() => setAlert(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
