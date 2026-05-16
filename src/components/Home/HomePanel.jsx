import React, { useState } from 'react';

export default function HomePanel({ data }) {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [viewMode, setViewMode] = useState('habits'); // Default to habits

  if (!data) return <p>Loading...</p>;

  // ... (keeping helper functions same)
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
  };

  const calculateHabitsStats = () => {
    if (!data || !data.habitLogs) return { percent: 0, streak: 0, bestStreak: 0 };
    let successes = 0;
    let misses = 0;
    const dates = Object.keys(data.habitLogs).sort();
    let currentStreak = 0;
    let bestStreak = 0;

    for (const dStr of dates) {
      const log = data.habitLogs[dStr];
      if (!log.locked) continue;
      
      let daySuccess = true;
      let dayHadData = false;
      
      for (const h of data.habits) {
        if (log.data[h.id]) {
          dayHadData = true;
          if (log.data[h.id] === 'happy') successes++;
          else if (log.data[h.id] === 'sad') {
             misses++;
             daySuccess = false;
          }
        }
      }
      
      if (dayHadData) {
        if (daySuccess) {
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
    }
    
    const total = successes + misses;
    const percent = total === 0 ? 0 : Math.round((successes / total) * 100);
    return { percent, streak: currentStreak, bestStreak };
  };

  const calculateKPIStats = () => {
    if (!data || !data.kpiLogs) return { percent: 0, streak: 0, bestStreak: 0 };
    let successes = 0;
    let misses = 0;
    const dates = Object.keys(data.kpiLogs).sort();
    let currentStreak = 0;
    let bestStreak = 0;

    for (const dStr of dates) {
      const log = data.kpiLogs[dStr];
      if (!log.locked) continue;
      
      let daySuccess = true;
      let dayHadData = false;
      
      for (const k of data.kpis) {
        if (log.data[k.id]) {
          dayHadData = true;
          if (log.data[k.id].status === 'success') successes++;
          else if (log.data[k.id].status === 'fail') {
             misses++;
             daySuccess = false;
          }
        }
      }
      
      if (dayHadData) {
        if (daySuccess) {
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
    }
    
    const total = successes + misses;
    const percent = total === 0 ? 0 : Math.round((successes / total) * 100);
    return { percent, streak: currentStreak, bestStreak };
  };

  const getMetricStats = (metric) => {
    if (!metric || !data) return null;
    
    const isHabit = metric.type === 'Habit';
    const logs = isHabit ? data.habitLogs : data.kpiLogs;
    if (!logs) return { yesterday: 'No Data', percent7: 0, percent30: 0, percentAll: 0, currentStreak: 0, bestStreak: 0 };

    let successesAll = 0, totalAll = 0;
    let successes30 = 0, total30 = 0;
    let successes7 = 0, total7 = 0;
    
    let currentStreak = 0, bestStreak = 0, tempStreak = 0;
    
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
    let yesterdayResult = 'No Data';
    
    const ascDates = Object.keys(logs).sort();
    const now = new Date();
    now.setHours(0,0,0,0);
    
    for (const dStr of ascDates) {
      const log = logs[dStr];
      if (!log.locked) continue;
      
      const cell = log.data[metric.id];
      if (!cell) continue;
      
      let isSuccess = false;
      if (isHabit) {
        isSuccess = cell === 'happy';
        if (cell === 'happy' || cell === 'sad') {
          totalAll++;
          if (isSuccess) successesAll++;
        }
      } else {
        isSuccess = cell.status === 'success';
        if (cell.status === 'success' || cell.status === 'fail') {
          totalAll++;
          if (isSuccess) successesAll++;
        }
      }

      if (isSuccess) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      const dParts = dStr.split('-');
      const logDate = new Date(dParts[0], dParts[1]-1, dParts[2]);
      const diffDays = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        total7++;
        if (isSuccess) successes7++;
      }
      if (diffDays <= 30) {
        total30++;
        if (isSuccess) successes30++;
      }
      
      if (dStr === yStr) {
        yesterdayResult = isSuccess ? 'Achieved' : 'Missed';
      }
    }
    currentStreak = tempStreak;

    return {
      yesterday: yesterdayResult,
      percent7: total7 === 0 ? 0 : Math.round((successes7 / total7) * 100),
      percent30: total30 === 0 ? 0 : Math.round((successes30 / total30) * 100),
      percentAll: totalAll === 0 ? 0 : Math.round((successesAll / totalAll) * 100),
      currentStreak,
      bestStreak
    };
  };

  const habitStats = calculateHabitsStats();
  const kpiStats = calculateKPIStats();

  const metricStats = selectedMetric ? getMetricStats(selectedMetric) : null;

  return (
    <div className="home-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', position: 'relative', fontSize: '1.2rem' }}>
      
      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button 
          onClick={() => setViewMode('habits')} 
          style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: viewMode === 'habits' ? 'var(--success)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Habits
        </button>
        <button 
          onClick={() => setViewMode('kpis')} 
          style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: viewMode === 'kpis' ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
        >
          KPIs
        </button>
      </div>

      {/* Top-Line Results */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '1.1rem' }}>Habits % (All Time)</h4>
          <div style={{ fontSize: '2.4rem', color: 'var(--success)' }}>{habitStats.percent}%</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '1.1rem' }}>KPI % (All Time)</h4>
          <div style={{ fontSize: '2.4rem', color: 'var(--accent)' }}>{kpiStats.percent}%</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '1.1rem' }}>Habit Streak</h4>
          <div style={{ fontSize: '1.4rem', marginTop: '5px' }}>🔥 Current: <strong style={{color: 'var(--success)'}}>{habitStats.streak}</strong> | Best: <strong>{habitStats.bestStreak}</strong></div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '1.1rem' }}>KPI Streak</h4>
          <div style={{ fontSize: '1.4rem', marginTop: '5px' }}>🚀 Current: <strong style={{color: 'var(--accent)'}}>{kpiStats.streak}</strong> | Best: <strong>{kpiStats.bestStreak}</strong></div>
        </div>
      </div>

      {/* Habits List */}
      {viewMode === 'habits' && (
        <div className="list-section">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px', fontSize: '1.5rem' }}>Daily Habits</h3>
          {data.habits.map(h => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.2)', marginBottom: '8px', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>{h.label}</span>
              <button onClick={() => setSelectedMetric({ type: 'Habit', ...h })} style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>View</button>
            </div>
          ))}
        </div>
      )}

      {/* KPIs List */}
      {viewMode === 'kpis' && (
        <div className="list-section">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px', fontSize: '1.5rem' }}>Daily KPIs</h3>
          {data.kpis.map(k => (
            <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.2)', marginBottom: '8px', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>{k.label} (Min: {k.min}, Max: {k.max})</span>
              <button onClick={() => setSelectedMetric({ type: 'KPI', ...k })} style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>View</button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Popup Modal */}
      {selectedMetric && metricStats && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>
          <div style={{ background: 'var(--panel-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border)', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>{selectedMetric.label} Stats</h2>
              <button onClick={() => setSelectedMetric(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Yesterday: {getYesterday()}</div>
                <div style={{ fontSize: '1.2rem', marginTop: '5px' }}>Result: <strong style={{ color: metricStats.yesterday === 'Achieved' ? 'var(--success)' : metricStats.yesterday === 'Missed' ? 'var(--danger)' : 'white' }}>{metricStats.yesterday}</strong></div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>Success Rates</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>7 Days: <strong>{metricStats.percent7}%</strong></span>
                  <span>30 Days: <strong>{metricStats.percent30}%</strong></span>
                  <span>All-Time: <strong>{metricStats.percentAll}%</strong></span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>Streaks</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Current: <strong>{metricStats.currentStreak}</strong></span>
                  <span>Highest: <strong>{metricStats.bestStreak}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
