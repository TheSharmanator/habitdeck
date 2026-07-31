import React, { useState } from 'react';

function getTargetDateStr(offset) {
  const d = new Date();
  d.setDate(d.getDate() - (6 - offset));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export default function MobileKPIs({ data, onSave }) {
  const [selectedDay, setSelectedDay] = useState(6);
  const [alert, setAlert] = useState(null);
  const [drafts, setDrafts] = useState({});

  const kpis = data.kpis || [];
  const signupDate = data.signupDate || null;

  const isBeforeSignup = (offset) => {
    if (!signupDate) return false;
    return getTargetDateStr(offset) < signupDate;
  };

  const dateStr = getTargetDateStr(selectedDay);
  const log = data.kpiLogs?.[dateStr] || { locked: false, data: {} };
  const locked = !!log.locked;
  const blocked = isBeforeSignup(selectedDay);

  const commitValue = (kpi, rawVal) => {
    if (locked || blocked || rawVal === '') return;
    const numVal = parseFloat(rawVal);
    let status = 'neutral';
    if (!isNaN(numVal)) {
      status = (numVal >= kpi.min && numVal <= kpi.max) ? 'success' : 'fail';
      if (status === 'success') {
        const r = Math.floor(Math.random() * 20) + 1;
        new Audio(`/sounds/sound${r}.mp3`).play().catch(() => {});
      }
    }
    const newLogs = { ...(data.kpiLogs || {}) };
    const dayData = { ...(newLogs[dateStr]?.data || {}) };
    dayData[kpi.id] = { value: rawVal, status };
    newLogs[dateStr] = { locked: false, data: dayData };
    onSave({ ...data, kpiLogs: newLogs });
    setDrafts(d => ({ ...d, [kpi.id]: undefined }));
  };

  const markFail = (kpi) => {
    if (locked || blocked) return;
    const newLogs = { ...(data.kpiLogs || {}) };
    const dayData = { ...(newLogs[dateStr]?.data || {}) };
    dayData[kpi.id] = { value: '❌', status: 'fail' };
    newLogs[dateStr] = { locked: false, data: dayData };
    onSave({ ...data, kpiLogs: newLogs });
  };

  const clearValue = (kpi) => {
    if (locked || blocked) return;
    const newLogs = { ...(data.kpiLogs || {}) };
    const dayData = { ...(newLogs[dateStr]?.data || {}) };
    delete dayData[kpi.id];
    newLogs[dateStr] = { locked: false, data: dayData };
    onSave({ ...data, kpiLogs: newLogs });
  };

  const toggleLock = () => {
    if (blocked) return;
    if (!locked) {
      const missing = kpis.some(k => {
        const cell = log.data?.[k.id];
        return !cell || cell.value === '' || cell.value === null;
      });
      if (missing) {
        setAlert("Please fill in all KPI's before locking this day.");
        return;
      }
    }
    const newLogs = { ...(data.kpiLogs || {}) };
    newLogs[dateStr] = { locked: !locked, data: log.data || {} };
    onSave({ ...data, kpiLogs: newLogs });
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
      ) : kpis.length === 0 ? (
        <p className="mobile-empty-msg">No KPIs set up yet. Use the main dashboard to add some.</p>
      ) : (
        <div className="mobile-kpi-list">
          {kpis.map(k => {
            const cell = log.data?.[k.id] || { value: '', status: 'neutral' };
            const draft = drafts[k.id];
            const inputVal = draft !== undefined ? draft : (cell.value === '❌' ? '' : (cell.value ?? ''));
            let statusClass = '';
            if (cell.status === 'success') statusClass = 'kpi-success';
            if (cell.status === 'fail') statusClass = 'kpi-fail';
            return (
              <div key={k.id} className={`mobile-kpi-row ${statusClass}`}>
                <div className="mobile-kpi-info">
                  <div className="mobile-kpi-label">{k.label}</div>
                  <div className="mobile-kpi-range">target {k.min}-{k.max}</div>
                </div>
                <div className="mobile-kpi-actions">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="mobile-kpi-input"
                    placeholder={cell.value === '❌' ? '❌' : '—'}
                    value={inputVal}
                    disabled={locked}
                    onChange={e => setDrafts(d => ({ ...d, [k.id]: e.target.value }))}
                    onBlur={e => { if (e.target.value !== '') commitValue(k, e.target.value); }}
                  />
                  {(cell.value !== '' && cell.value != null) && !locked && (
                    <button className="mobile-clear-btn" onClick={() => clearValue(k)}>✕</button>
                  )}
                  <button className="mobile-fail-btn" disabled={locked} onClick={() => markFail(k)}>Fail</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!blocked && kpis.length > 0 && (
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
