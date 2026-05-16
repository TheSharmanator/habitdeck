import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set size to a fixed 400x400 for profile avatars
  canvas.width = 400;
  canvas.height = 400;
  
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400
  );

  return canvas.toDataURL('image/jpeg');
}

function VirtualKeyboard({ value, onChange, onClose }) {
  const handleKey = (k) => {
    if (k === 'DEL') onChange(value.slice(0, -1));
    else if (k === 'SPACE') onChange(value + ' ');
    else onChange(value + k);
  };
  
  const rows = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
  ];

  return (
    <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', zIndex: 200, boxShadow: '0 -10px 25px rgba(0,0,0,0.5)', width: '90%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <input type="text" value={value} readOnly style={{ flex: 1, padding: '10px', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', marginRight: '10px' }} />
        <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px' }}>Done</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px' }}>
            {row.map(k => (
              <button key={k} onClick={() => handleKey(k)} style={{ padding: '15px 20px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px' }}>{k}</button>
            ))}
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
          <button onClick={() => onChange('')} style={{ padding: '15px 20px', fontSize: '1.2rem', background: 'var(--warning)', border: 'none', color: 'white', borderRadius: '8px' }}>CLEAR</button>
          <button onClick={() => handleKey('SPACE')} style={{ padding: '15px 40px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', width: '50%' }}>SPACE</button>
          <button onClick={() => handleKey('DEL')} style={{ padding: '15px 20px', fontSize: '1.2rem', background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '8px' }}>DEL</button>
        </div>
      </div>
    </div>
  );
}

function VirtualNumpad({ value, onChange, onClose }) {
  const handleKey = (k) => {
    if (k === 'DEL') onChange(value.slice(0, -1));
    else if (k === 'C') onChange('');
    else onChange(value + k);
  };
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','DEL','C'];

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--panel-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', zIndex: 200, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3>Enter Number</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>✖</button>
      </div>
      <input type="text" value={value} readOnly style={{ width: '100%', padding: '10px', fontSize: '1.5rem', marginBottom: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', textAlign: 'right' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {keys.map(k => (
          <button key={k} onClick={() => handleKey(k)} style={{ padding: '20px', fontSize: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            {k}
          </button>
        ))}
      </div>
      <button onClick={onClose} style={{ width: '100%', padding: '15px', marginTop: '10px', fontSize: '1.2rem', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
        Done
      </button>
    </div>
  );
}

function VirtualPIN({ onUnlock, expectedPin, isSetup }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(isSetup ? 'create' : 'enter');
  
  const handleKey = (k) => {
    if (k === 'DEL') {
      if (step === 'create') setPin(p => p.slice(0, -1));
      else if (step === 'confirm') setConfirmPin(p => p.slice(0, -1));
      else setPin(p => p.slice(0, -1));
    } else {
      if (step === 'create' && pin.length < 4) setPin(p => p + k);
      else if (step === 'confirm' && confirmPin.length < 4) setConfirmPin(p => p + k);
      else if (step === 'enter' && pin.length < 4) setPin(p => p + k);
    }
  };

  const handleSubmit = () => {
    if (step === 'enter') {
      if (pin === expectedPin) onUnlock();
      else { alert('Incorrect PIN'); setPin(''); }
    } else if (step === 'create') {
      if (pin.length === 4) setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === confirmPin) onUnlock(pin);
      else { alert('PINs do not match'); setConfirmPin(''); setStep('create'); setPin(''); }
    }
  };

  let title = "Enter PIN";
  if (step === 'create') title = "Create 4-Digit PIN";
  if (step === 'confirm') title = "Confirm PIN";
  let val = step === 'confirm' ? confirmPin : pin;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
      <h2>{title}</h2>
      <div style={{ fontSize: '2rem', letterSpacing: '10px', margin: '20px 0' }}>
        {'*'.repeat(val.length).padEnd(4, '·')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
        {['1','2','3','4','5','6','7','8','9','C','0','DEL'].map(k => (
          <button key={k} onClick={() => k==='C' ? (step==='confirm'?setConfirmPin(''):setPin('')) : handleKey(k)} style={{ padding: '20px', fontSize: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%' }}>{k}</button>
        ))}
      </div>
      <button onClick={handleSubmit} style={{ marginTop: '20px', padding: '15px 40px', fontSize: '1.2rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px' }}>
        {step === 'enter' ? 'Unlock' : 'Next'}
      </button>
    </div>
  );
}

function PhotoUpload({ onPhotoSaved }) {
  const fileInput = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onPhotoSaved(croppedImage);
    } catch (e) {
      console.error(e);
      onPhotoSaved(null);
    }
  };

  if (imageSrc) {
    return (
      <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '15px', background: 'var(--panel-bg)', zIndex: 10 }}>
          <button onClick={() => setZoom(z => Math.max(1, z - 0.2))} style={{ padding: '10px 20px', fontSize: '1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>➖</button>
          <span style={{ color: 'white', fontSize: '1.2rem' }}>Zoom</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ padding: '10px 20px', fontSize: '1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>➕</button>
        </div>
        <div style={{ padding: '20px', background: 'var(--panel-bg)', display: 'flex', justifyContent: 'center', gap: '20px', zIndex: 10 }}>
          <button onClick={() => setImageSrc(null)} style={{ padding: '15px 30px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '1.2rem' }}>Cancel</button>
          <button onClick={showCroppedImage} style={{ padding: '15px 30px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>Confirm Photo</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
      <h2>Upload Profile Photo</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Select an image from this device.</p>
      
      <input type="file" accept="image/*" ref={fileInput} style={{ display: 'none' }} onChange={handleFileChange} />
      
      <button onClick={() => fileInput.current.click()} style={{ padding: '20px 40px', fontSize: '1.5rem', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>
        📷 Choose Photo
      </button>
      
      <button onClick={() => onPhotoSaved(null)} style={{ marginTop: '30px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer' }}>
        Skip for now
      </button>
    </div>
  );
}

export default function SettingsPanel({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0); // 0 = not onboarding, 1 = name, 2 = photo
  const [formData, setFormData] = useState({ username: '', pin: '', photo: '', habits: [], kpis: [] });
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    fetch(`/api/data/${userId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setFormData(d);
      });
  }, [userId]);

  if (!data) return <div style={{color:'white', padding: '20px'}}>Loading...</div>;

  const handleSave = (silent = false) => {
    fetch(`/api/data/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      if (!silent) {
        onClose();
      }
    });
  };

  const handleUnlock = (newPin) => {
    if (newPin) {
      setFormData({ ...formData, pin: newPin });
      setOnboardingStep(1); // Start onboarding
    } else {
      setUnlocked(true);
    }
  };

  if (!unlocked && onboardingStep === 0) {
    return <VirtualPIN expectedPin={data.pin} isSetup={!data.pin} onUnlock={handleUnlock} />;
  }

  // Onboarding Wizard
  if (onboardingStep === 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
        <h2>Enter Your Name</h2>
        <input 
          type="text" 
          value={formData.username} 
          readOnly 
          onClick={() => setActiveInput({ type: 'username', value: formData.username })}
          style={{ width: '300px', padding: '15px', fontSize: '1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', margin: '20px 0' }} 
        />
        <button onClick={() => setOnboardingStep(2)} style={{ padding: '15px 40px', fontSize: '1.2rem', background: 'var(--success)', border: 'none', color: 'white', borderRadius: '8px' }}>Next</button>
        {activeInput && (
          <VirtualKeyboard 
            value={activeInput.value} 
            onChange={(val) => { setFormData({ ...formData, username: val }); setActiveInput({ type: 'username', value: val }); }} 
            onClose={() => setActiveInput(null)} 
          />
        )}
      </div>
    );
  }

  if (onboardingStep === 2) {
    return <PhotoUpload onPhotoSaved={(photo) => {
      const now = new Date();
      const signupDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const updated = { ...formData, photo, signupDate };
      setFormData(updated);
      setUnlocked(true);
      setOnboardingStep(0);
      fetch(`/api/data/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    }} />;
  }

  // Full Screen Dashboard Layout
  const toggleSchedule = (hIdx, dIdx) => {
    const newHabits = [...formData.habits];
    newHabits[hIdx].schedule[dIdx] = !newHabits[hIdx].schedule[dIdx];
    setFormData({ ...formData, habits: newHabits });
  };

  const addHabit = () => setFormData({ ...formData, habits: [...formData.habits, { id: Date.now(), label: 'New Habit', schedule: [true,true,true,true,true,true,true] }] });
  const removeHabit = (idx) => {
    const habitId = formData.habits[idx].id;
    const newH = [...formData.habits];
    newH.splice(idx, 1);
    // Purge every trace of this habit from all daily logs
    const newHabitLogs = {};
    for (const [dateStr, dayLog] of Object.entries(formData.habitLogs || {})) {
      const newDayData = { ...(dayLog.data || {}) };
      delete newDayData[habitId];
      newHabitLogs[dateStr] = { ...dayLog, data: newDayData };
    }
    setFormData({ ...formData, habits: newH, habitLogs: newHabitLogs });
  };

  const addKpi = () => setFormData({ ...formData, kpis: [...formData.kpis, { id: Date.now(), label: 'New KPI', min: 0, max: 100 }] });
  const removeKpi = (idx) => {
    const kpiId = formData.kpis[idx].id;
    const newK = [...formData.kpis];
    newK.splice(idx, 1);
    // Purge every trace of this KPI from all daily logs
    const newKpiLogs = {};
    for (const [dateStr, dayLog] of Object.entries(formData.kpiLogs || {})) {
      const newDayData = { ...(dayLog.data || {}) };
      delete newDayData[kpiId];
      newKpiLogs[dateStr] = { ...dayLog, data: newDayData };
    }
    setFormData({ ...formData, kpis: newK, kpiLogs: newKpiLogs });
  };

  const nukeAccount = async () => {
    if (window.confirm("WARNING: This will PERMANENTLY DELETE your account and all data. This cannot be undone. Are you absolutely sure?")) {
      const secondCheck = window.confirm("Final check: ALL habits, KPIs and history for this user will be gone. Confirm nuke?");
      if (secondCheck) {
        await fetch(`/api/data/${userId}`, { method: 'DELETE' });
        window.location.reload(); 
      }
    }
  };

  return (
    <div className="settings-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', padding: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {formData.photo ? (
            <img src={formData.photo} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              {formData.username ? formData.username[0] : '?'}
            </div>
          )}
          <h2 style={{ margin: 0 }}>{formData.username}'s Dashboard</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={nukeAccount} style={{ padding: '10px 20px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold' }}>Delete Account</button>
          <button onClick={() => onClose()} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '1rem' }}>Cancel</button>
          <button onClick={() => handleSave(false)} style={{ padding: '10px 20px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold' }}>Save & Exit</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Column: KPIs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(30,41,59,0.5)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>KPIs Configuration</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {formData.kpis.map((k, i) => (
              <div key={k.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    value={k.label} 
                    readOnly
                    onClick={() => setActiveInput({ type: 'kpi', idx: i, value: k.label })}
                    style={{ flex: 1, padding: '10px', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} 
                  />
                  <button onClick={() => removeKpi(i)} style={{ padding: '0 15px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.3rem', cursor: 'pointer' }}>🗑</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><label style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Min</label><input type="text" readOnly onClick={() => setActiveInput({ type: 'kpi-num', field: 'min', idx: i, value: String(k.min) })} value={k.min} style={{ width: '100%', padding: '10px', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} /></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><label style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Max</label><input type="text" readOnly onClick={() => setActiveInput({ type: 'kpi-num', field: 'max', idx: i, value: String(k.max) })} value={k.max} style={{ width: '100%', padding: '10px', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} /></div>
                </div>
              </div>
            ))}
            {formData.kpis.length < 8 && <button onClick={addKpi} style={{ padding: '10px', width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px dashed var(--border)', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer' }}>+ Add KPI</button>}
          </div>
        </div>

        {/* Right Column: Habits */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(30,41,59,0.5)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>Habits Configuration</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {formData.habits.map((h, i) => (
              <div key={h.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    value={h.label} 
                    readOnly
                    onClick={() => setActiveInput({ type: 'habit', idx: i, value: h.label })}
                    style={{ flex: 1, padding: '10px', fontSize: '1.2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} 
                  />
                  <button onClick={() => removeHabit(i)} style={{ padding: '0 15px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.3rem', cursor: 'pointer' }}>🗑</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {['M','T','W','T','F','S','S'].map((day, dIdx) => (
                    <button key={dIdx} onClick={() => toggleSchedule(i, dIdx)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: h.schedule[dIdx] ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>{day}</button>
                  ))}
                </div>
              </div>
            ))}
            {formData.habits.length < 8 && <button onClick={addHabit} style={{ padding: '10px', width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px dashed var(--border)', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer' }}>+ Add Habit</button>}
          </div>
        </div>

      </div>

      {activeInput && activeInput.type === 'kpi-num' && (
        <VirtualNumpad 
          value={activeInput.value} 
          onChange={(val) => {
            const newK = [...formData.kpis];
            if (activeInput.field === 'min') newK[activeInput.idx].min = val;
            else newK[activeInput.idx].max = val;
            setFormData({ ...formData, kpis: newK });
            setActiveInput({ ...activeInput, value: val });
          }} 
          onClose={() => setActiveInput(null)} 
        />
      )}

      {activeInput && activeInput.type !== 'kpi-num' && (
        <VirtualKeyboard 
          value={activeInput.value} 
          onChange={(val) => {
            if (activeInput.type === 'username') setFormData({ ...formData, username: val });
            else if (activeInput.type === 'habit') { const newH = [...formData.habits]; newH[activeInput.idx].label = val; setFormData({ ...formData, habits: newH }); }
            else if (activeInput.type === 'kpi') { const newK = [...formData.kpis]; newK[activeInput.idx].label = val; setFormData({ ...formData, kpis: newK }); }
            setActiveInput({ ...activeInput, value: val });
          }} 
          onClose={() => setActiveInput(null)} 
        />
      )}
    </div>
  );
}
