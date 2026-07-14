import React, { useState } from 'react';

const STREAK_MAX = 10;
const CELL_ROWS = 8;

function StreakBar({ streak }) {
  const pct = (Math.min(Math.abs(streak), STREAK_MAX) / STREAK_MAX) * 100;
  const color = streak > 0 ? 'var(--success)' : streak < 0 ? 'var(--danger)' : 'transparent';
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.07)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, background: color, zIndex: 0 }} />
    </>
  );
}

function MetricCell({ item, streak, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <StreakBar streak={streak} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
        <span style={{
          fontSize: 'clamp(0.55rem, 2.4cqh, 0.95rem)',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {item.label} ({streak})
        </span>
      </div>
    </div>
  );
}

export default function HomePanel({ data }) {
  const [selectedMetric, setSelectedMetric] = useState(null);

  if (!data) return <p>Loading...</p>;

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

  // Signed streak: positive run-length of successes, negative run-length of fails.
  // Flips sign as soon as the outcome flips, rather than resetting to zero.
  const getSignedStreak = (metric, isHabit) => {
    const logs = isHabit ? data.habitLogs : data.kpiLogs;
    if (!logs) return 0;
    const ascDates = Object.keys(logs).sort();
    let streak = 0;

    for (const dStr of ascDates) {
      const log = logs[dStr];
      if (!log.locked) continue;

      const cell = log.data[metric.id];
      if (!cell) continue;

      let isSuccess;
      if (isHabit) {
        if (cell !== 'happy' && cell !== 'sad') continue;
        isSuccess = cell === 'happy';
      } else {
        if (cell.status !== 'success' && cell.status !== 'fail') continue;
        isSuccess = cell.status === 'success';
      }

      if (isSuccess) {
        streak = streak >= 0 ? streak + 1 : 1;
      } else {
        streak = streak <= 0 ? streak - 1 : -1;
      }
    }

    return streak;
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
    <div className="home-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'hidden', position: 'relative', fontSize: '1.2rem' }}>

      {/* Top-Line Results */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', margin: 0 }}>Habits % (All Time)</h4>
          <div style={{ fontSize: '1.6rem', color: 'var(--success)' }}>{habitStats.percent}%</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', margin: 0 }}>KPI % (All Time)</h4>
          <div style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>{kpiStats.percent}%</div>
        </div>
      </div>

      {/* Habits + KPIs side by side, all cells visible at once */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: '4px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0, fontSize: '1rem', flexShrink: 0 }}>Habits</h3>
          <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateRows: `repeat(${CELL_ROWS}, 1fr)`, gap: '3px', overflowY: 'auto', containerType: 'size' }}>
            {data.habits.map(h => (
              <MetricCell
                key={h.id}
                item={h}
                streak={getSignedStreak(h, true)}
                onClick={() => setSelectedMetric({ type: 'Habit', ...h })}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: '4px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0, fontSize: '1rem', flexShrink: 0 }}>KPIs</h3>
          <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateRows: `repeat(${CELL_ROWS}, 1fr)`, gap: '3px', overflowY: 'auto', containerType: 'size' }}>
            {data.kpis.map(k => (
              <MetricCell
                key={k.id}
                item={k}
                streak={getSignedStreak(k, false)}
                onClick={() => setSelectedMetric({ type: 'KPI', ...k })}
              />
            ))}
          </div>
        </div>
      </div>

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
