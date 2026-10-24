import React, { useRef, useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DEFAULT_SCHEDULE = [true, true, true, true, true, true, true];

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Same output contract as the desktop SettingsPanel: a fixed 400x400 JPEG
// avatar, so a photo set here and a photo set on the kiosk are identical.
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 400;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, 400, 400
  );
  return canvas.toDataURL('image/jpeg', 0.9);
}

const clone = (obj) => JSON.parse(JSON.stringify(obj ?? {}));

function PhotoEditor({ initial, onSave, onCancel }) {
  const fileInput = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_area, pixels) => setCroppedAreaPixels(pixels), []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmCrop = async () => {
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(cropped);
    } catch (err) {
      console.error(err);
    }
  };

  if (!imageSrc) {
    return (
      <div className="mob-settings-fullscreen">
        <div className="mob-photo-pick">
          {initial ? (
            <img src={initial} alt="" className="mob-photo-preview" />
          ) : (
            <div className="mob-photo-placeholder">📷</div>
          )}
          <p className="mob-hint">Choose a square-ish photo — you can zoom and reposition it next.</p>
          <input type="file" accept="image/*" ref={fileInput} style={{ display: 'none' }} onChange={handleFileChange} />
          <button className="mob-btn primary" onClick={() => fileInput.current?.click()}>Choose Photo</button>
          {initial && (
            <button className="mob-btn ghost" onClick={() => onSave(null)}>Remove Photo</button>
          )}
          <button className="mob-btn ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mob-settings-fullscreen">
      <div className="mob-crop-area">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="mob-crop-controls">
        <button className="mob-round-btn" onClick={() => setZoom(z => Math.max(1, +(z - 0.2).toFixed(2)))}>➖</button>
        <span className="mob-crop-zoom-label">Zoom</span>
        <button className="mob-round-btn" onClick={() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(2)))}>➕</button>
      </div>
      <div className="mob-crop-actions">
        <button className="mob-btn ghost" onClick={() => setImageSrc(null)}>Back</button>
        <button className="mob-btn primary" onClick={confirmCrop}>Use Photo</button>
      </div>
    </div>
  );
}

export default function MobileSettings({ data, onSave, onClose, onDeleteAccount }) {
  const [form, setForm] = useState(() => clone(data));
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState(null);
  const [alert, setAlert] = useState(null);
  const [nukeStep, setNukeStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const habits = form.habits || [];
  const kpis = form.kpis || [];

  const scheduleOf = (h) =>
    Array.isArray(h.schedule) && h.schedule.length === 7 ? h.schedule : DEFAULT_SCHEDULE;

  /* ---------------- profile ---------------- */
  const setUsername = (value) => setForm(f => ({ ...f, username: value }));
  const setPhoto = (photo) => {
    setForm(f => ({ ...f, photo }));
    setShowPhotoEditor(false);
  };

  /* ---------------- pin ---------------- */
  const pinIsValid = newPin.length === 4 && newPin === confirmPin;
  const changePin = () => {
    if (!/^\d{4}$/.test(newPin)) { setPinMsg({ error: true, text: 'PIN must be 4 digits.' }); return; }
    if (newPin !== confirmPin) { setPinMsg({ error: true, text: 'PINs do not match.' }); return; }
    setForm(f => ({ ...f, pin: newPin }));
    setNewPin('');
    setConfirmPin('');
    setPinMsg({ error: false, text: 'PIN updated — tap Save to apply.' });
  };

  /* ---------------- habits ---------------- */
  const updateHabitLabel = (idx, label) => {
    const next = [...habits];
    next[idx] = { ...next[idx], label };
    setForm(f => ({ ...f, habits: next }));
  };

  const toggleSchedule = (hIdx, dIdx) => {
    const next = habits.map((h, i) => {
      if (i !== hIdx) return h;
      const schedule = [...scheduleOf(h)];
      schedule[dIdx] = !schedule[dIdx];
      return { ...h, schedule };
    });
    setForm(f => ({ ...f, habits: next }));
  };

  const addHabit = () => setForm(f => ({
    ...f,
    habits: [...(f.habits || []), { id: Date.now(), label: 'New Habit', schedule: [...DEFAULT_SCHEDULE] }]
  }));

  const removeHabit = (idx) => {
    const habitId = habits[idx].id;
    const newHabits = habits.filter((_, i) => i !== idx);
    // Purge every trace of this habit from the daily logs, exactly like the
    // desktop panel — otherwise orphaned entries linger in the JSON forever.
    const newLogs = {};
    for (const [dateStr, dayLog] of Object.entries(form.habitLogs || {})) {
      const dayData = { ...(dayLog.data || {}) };
      delete dayData[habitId];
      newLogs[dateStr] = { ...dayLog, data: dayData };
    }
    setForm(f => ({ ...f, habits: newHabits, habitLogs: newLogs }));
  };

  /* ---------------- kpis ---------------- */
  const updateKpi = (idx, field, value) => {
    const next = kpis.map((k, i) => (i === idx ? { ...k, [field]: value } : k));
    setForm(f => ({ ...f, kpis: next }));
  };

  const addKpi = () => setForm(f => ({
    ...f,
    kpis: [...(f.kpis || []), { id: Date.now(), label: 'New KPI', min: 0, max: 100 }]
  }));

  const removeKpi = (idx) => {
    const kpiId = kpis[idx].id;
    const newKpis = kpis.filter((_, i) => i !== idx);
    const newLogs = {};
    for (const [dateStr, dayLog] of Object.entries(form.kpiLogs || {})) {
      const dayData = { ...(dayLog.data || {}) };
      delete dayData[kpiId];
      newLogs[dateStr] = { ...dayLog, data: dayData };
    }
    setForm(f => ({ ...f, kpis: newKpis, kpiLogs: newLogs }));
  };

  /* ---------------- save / discard / delete ---------------- */
  const save = async () => {
    if (!form.username?.trim()) { setAlert('A name is required.'); return; }
    if (newPin && form.pin !== newPin) { setAlert('Tap "Update PIN" to apply the new PIN before saving.'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const discard = () => onClose?.();

  if (showPhotoEditor) {
    return (
      <PhotoEditor
        initial={form.photo}
        onSave={setPhoto}
        onCancel={() => setShowPhotoEditor(false)}
      />
    );
  }

  return (
    <div className="mob-settings">
      <h2 className="mob-settings-title">Settings</h2>

      {/* ---------- Profile ---------- */}
      <section className="mob-card">
        <h3 className="mob-card-title">Profile</h3>
        <div className="mob-profile-row">
          <button className="mob-avatar-btn" onClick={() => setShowPhotoEditor(true)}>
            {form.photo ? (
              <img src={form.photo} alt="" className="mob-avatar-img" />
            ) : (
              <div className="mob-avatar-fallback">
                {form.username ? form.username[0].toUpperCase() : '?'}
              </div>
            )}
            <span className="mob-avatar-badge">📷</span>
          </button>
          <div className="mob-profile-fields">
            <label className="mob-label">Display name</label>
            <input
              className="mob-input"
              type="text"
              value={form.username || ''}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoComplete="off"
            />
            <span className="mob-hint">Photo and name show on the kiosk dashboard.</span>
          </div>
        </div>
      </section>

      {/* ---------- PIN ---------- */}
      <section className="mob-card">
        <h3 className="mob-card-title">Login PIN</h3>
        <p className="mob-hint">
          {form.pin ? 'Enter a new 4-digit PIN twice to change it.' : 'Set a 4-digit PIN for this user.'}
        </p>
        <div className="mob-pin-row">
          <div className="mob-pin-col">
            <label className="mob-label">New PIN</label>
            <input
              className="mob-input mob-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              placeholder="••••"
              onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinMsg(null); }}
            />
          </div>
          <div className="mob-pin-col">
            <label className="mob-label">Confirm PIN</label>
            <input
              className="mob-input mob-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              placeholder="••••"
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinMsg(null); }}
            />
          </div>
        </div>
        {pinMsg && <p className={`mob-msg ${pinMsg.error ? 'error' : 'ok'}`}>{pinMsg.text}</p>}
        <button className="mob-btn secondary" disabled={!pinIsValid} onClick={changePin}>
          Update PIN
        </button>
      </section>

      {/* ---------- Habits ---------- */}
      <section className="mob-card">
        <h3 className="mob-card-title">Habits</h3>
        {habits.length === 0 && <p className="mob-hint">No habits yet.</p>}
        {habits.map((h, i) => {
          const schedule = scheduleOf(h);
          return (
            <div key={h.id} className="mob-config-item">
              <div className="mob-config-head">
                <input
                  className="mob-input mob-config-label"
                  type="text"
                  value={h.label}
                  onChange={(e) => updateHabitLabel(i, e.target.value)}
                  placeholder="Habit name"
                />
                <button className="mob-delete-btn" onClick={() => removeHabit(i)} title="Delete habit">✕</button>
              </div>
              <div className="mob-day-toggles">
                {DAY_LABELS.map((day, dIdx) => (
                  <button
                    key={dIdx}
                    className={`mob-day-toggle ${schedule[dIdx] ? 'on' : ''}`}
                    onClick={() => toggleSchedule(i, dIdx)}
                    title={['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][dIdx]}
                  >{day}</button>
                ))}
              </div>
            </div>
          );
        })}
        {habits.length < 8 && (
          <button className="mob-btn dashed" onClick={addHabit}>+ Add Habit</button>
        )}
      </section>

      {/* ---------- KPIs ---------- */}
      <section className="mob-card">
        <h3 className="mob-card-title">KPIs</h3>
        {kpis.length === 0 && <p className="mob-hint">No KPIs yet.</p>}
        {kpis.map((k, i) => (
          <div key={k.id} className="mob-config-item">
            <div className="mob-config-head">
              <input
                className="mob-input mob-config-label"
                type="text"
                value={k.label}
                onChange={(e) => updateKpi(i, 'label', e.target.value)}
                placeholder="KPI name"
              />
              <button className="mob-delete-btn" onClick={() => removeKpi(i)} title="Delete KPI">✕</button>
            </div>
            <div className="mob-kpi-range-row">
              <div className="mob-kpi-num">
                <label className="mob-label">Min</label>
                <input
                  className="mob-input"
                  type="text"
                  inputMode="decimal"
                  value={k.min}
                  onChange={(e) => updateKpi(i, 'min', e.target.value)}
                />
              </div>
              <div className="mob-kpi-num">
                <label className="mob-label">Max</label>
                <input
                  className="mob-input"
                  type="text"
                  inputMode="decimal"
                  value={k.max}
                  onChange={(e) => updateKpi(i, 'max', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        {kpis.length < 8 && (
          <button className="mob-btn dashed" onClick={addKpi}>+ Add KPI</button>
        )}
      </section>

      {/* ---------- Danger ---------- */}
      <section className="mob-card danger">
        <h3 className="mob-card-title">Danger Zone</h3>
        <p className="mob-hint">Deletes all habits, KPIs and history for this user. Cannot be undone.</p>
        <button className="mob-btn danger" onClick={() => setNukeStep(1)}>Delete Account</button>
      </section>

      {/* sticky action bar sits above the tab bar */}
      <div className="mob-settings-actions">
        <button className="mob-btn ghost" onClick={discard} disabled={saving}>Cancel</button>
        <button className="mob-btn primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {alert && (
        <div className="mobile-alert-overlay" onClick={() => setAlert(null)}>
          <div className="mobile-alert-box" onClick={e => e.stopPropagation()}>
            <p>{alert}</p>
            <button onClick={() => setAlert(null)}>OK</button>
          </div>
        </div>
      )}

      {nukeStep > 0 && (
        <div className="mobile-alert-overlay" onClick={() => setNukeStep(0)}>
          <div className="mobile-alert-box" onClick={e => e.stopPropagation()}>
            {nukeStep === 1 ? (
              <>
                <p><strong style={{ color: '#ef4444' }}>⚠️ Delete Account</strong><br />
                  This permanently deletes ALL habits, KPIs and history for {form.username || 'this user'}.</p>
                <div className="mob-alert-actions">
                  <button className="mob-btn ghost" onClick={() => setNukeStep(0)}>Cancel</button>
                  <button className="mob-btn danger" onClick={() => setNukeStep(2)}>Yes, Delete</button>
                </div>
              </>
            ) : (
              <>
                <p><strong style={{ color: '#ef4444' }}>Final Confirmation</strong><br />
                  Last chance. All data is gone forever.</p>
                <div className="mob-alert-actions">
                  <button className="mob-btn ghost" onClick={() => setNukeStep(0)}>Cancel</button>
                  <button className="mob-btn danger" onClick={() => onDeleteAccount?.()}>NUKE IT</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
