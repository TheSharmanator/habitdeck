import React, { useRef, useState, useEffect } from 'react';

const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];
const BRUSH_SIZES = [2, 6, 12];
// Map to PNG files in /public/emojis/ — avoids relying on system emoji fonts (broken on Pi/Linux)
const EMOJIS = [
  { key: 'kiss',      src: '/emojis/kiss.png' },
  { key: 'thumbsup',  src: '/emojis/thumbsup.png' },
  { key: 'heart',     src: '/emojis/heart.png' },
  { key: 'wink',      src: '/emojis/wink.png' },
  { key: 'thinking',  src: '/emojis/thinking.png' },
  { key: 'shrug',     src: '/emojis/shrug.png' },
  { key: 'faceplant', src: '/emojis/faceplant.png' },
  { key: 'laughing',  src: '/emojis/laughing.png' },
  { key: 'crying',    src: '/emojis/crying.png' },
  { key: 'angry',     src: '/emojis/angry.png' },
  { key: 'tongueout', src: '/emojis/tongueout.png' },
  { key: 'crazy',     src: '/emojis/crazy.png' },
  { key: 'yawn',      src: '/emojis/yawn.png' },
  { key: 'punch',     src: '/emojis/punch.png' },
  { key: 'flexedarm', src: '/emojis/flexedarm.png' },
  { key: 'drool',     src: '/emojis/drool.png' },
  { key: 'shocked',   src: '/emojis/shocked.png' },
  { key: 'confused',  src: '/emojis/confused.png' },
];

export default function PostItCanvas({ onClose, onSend }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [bgColor, setBgColor] = useState('#fef08a'); // Default postit yellow
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [eraserMode, setEraserMode] = useState(false);
  const [placedEmojis, setPlacedEmojis] = useState([]);
  const [emojiSize, setEmojiSize] = useState(150);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      clearCanvas(true);
    }
  }, []);

  const clearCanvas = (init = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (canvasRef.current && !eraserMode) {
      clearCanvas(); // Reapply background color when it changes
    }
  }, [bgColor]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    if (eraserMode) {
      ctx.strokeStyle = bgColor; // Draw with background color to erase
    } else {
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const endDrawing = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    }
    return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    
    const newEmojiRaw = e.dataTransfer.getData('new_emoji');
    const moveEmojiId = e.dataTransfer.getData('move_emoji');
    
    if (newEmojiRaw) {
      try {
        const emojiObj = JSON.parse(newEmojiRaw);
        setPlacedEmojis(prev => [...prev, { id: Date.now().toString(), key: emojiObj.key, src: emojiObj.src, x: offsetX, y: offsetY, size: emojiSize }]);
      } catch {}
    } else if (moveEmojiId) {
      setPlacedEmojis(prev => prev.map(em => em.id === moveEmojiId ? { ...em, x: offsetX, y: offsetY } : em));
    }
  };

  const sendPostIt = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Draw each placed emoji PNG onto the canvas before capturing
    await Promise.all(placedEmojis.map(em => new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const s = em.size || 48; // fallback
        ctx.drawImage(img, em.x - s/2, em.y - s/2, s, s);
        resolve();
      };
      img.onerror = resolve; // skip broken images gracefully
      img.src = em.src;
    })));
    if (onSend) {
      const dataUrl = canvas.toDataURL('image/png');
      onSend(dataUrl);
    }
    clearCanvas(true);
    setPlacedEmojis([]);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Top section: Two rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
        
        {/* Row 1: Ink colours + Brushes + Eraser + Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Colours + Brushes container */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Ink colours */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {COLORS.map(c => (
                <button key={`ink-${c}`} onClick={() => {setColor(c); setEraserMode(false);}} style={{ width: '36px', height: '36px', background: c, border: color === c && !eraserMode ? '3px solid white' : '1px solid gray', borderRadius: '50%' }} />
              ))}
            </div>
            
            {/* Brush sizes */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {BRUSH_SIZES.map(s => (
                <button key={`size-${s}`} onClick={() => setBrushSize(s)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', border: brushSize === s ? '3px solid var(--accent)' : '1px solid gray' }}>
                  <div style={{ width: s, height: s, background: 'black', borderRadius: '50%' }}></div>
                </button>
              ))}
              <button onClick={() => setEraserMode(true)} style={{ padding: '4px', background: eraserMode ? 'var(--accent)' : 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/icons/eraser.png" alt="Eraser" style={{ width: '28px', height: '28px' }} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { clearCanvas(); setPlacedEmojis([]); }} style={{ padding: '8px 18px', fontSize: '1.2rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Clear</button>
            {onClose && <button onClick={onClose} style={{ padding: '8px 18px', fontSize: '1.2rem', background: 'var(--panel-bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>}
            <button onClick={sendPostIt} style={{ padding: '8px 23px', fontSize: '1.3rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>SEND</button>
          </div>
        </div>

        {/* Row 2: Emojis + Size Toggles */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto' }}>
          {/* Size toggles */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--panel-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button onClick={() => setEmojiSize(75)} style={{ padding: '4px 12px', fontSize: '1rem', background: emojiSize === 75 ? 'var(--accent)' : 'transparent', color: 'white', border: emojiSize === 75 ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Small</button>
            <button onClick={() => setEmojiSize(150)} style={{ padding: '4px 12px', fontSize: '1rem', background: emojiSize === 150 ? 'var(--accent)' : 'transparent', color: 'white', border: emojiSize === 150 ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Med</button>
            <button onClick={() => setEmojiSize(300)} style={{ padding: '4px 12px', fontSize: '1rem', background: emojiSize === 300 ? 'var(--accent)' : 'transparent', color: 'white', border: emojiSize === 300 ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Large</button>
          </div>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

          {/* Emoji strip */}
          <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto' }}>
            {EMOJIS.map(e => (
              <div
                key={e.key}
                draggable
                onDragStart={(ev) => ev.dataTransfer.setData('new_emoji', JSON.stringify(e))}
                style={{ flexShrink: 0, cursor: 'grab', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px' }}
              >
                <img src={e.src} alt={e.key} style={{ width: '43px', height: '43px', objectFit: 'contain', display: 'block' }} />
              </div>
            ))}
          </div>

          {/* Drop-bin */}
          <div
            style={{ flexShrink: 0, width: '51px', height: '51px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '6px', border: '2px dashed #ef4444' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const moveEmojiId = e.dataTransfer.getData('move_emoji');
              if (moveEmojiId) {
                setPlacedEmojis(prev => prev.filter(em => em.id !== moveEmojiId));
              }
            }}
          >
            <img src="/icons/delete.png" alt="Delete" style={{ width: '30px', height: '30px', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Canvas + bg colour picker row */}
      <div style={{ display: 'flex', gap: '8px', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, border: '2px solid var(--border)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseOut={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          />
          {placedEmojis.map(em => {
            const s = em.size || 48;
            return (
              <div 
                key={em.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('move_emoji', em.id);
                }}
                style={{ position: 'absolute', left: em.x, top: em.y, width: `${s}px`, height: `${s}px`, transform: 'translate(-50%, -50%)', cursor: 'grab', touchAction: 'none' }}
              >
                <img src={em.src} alt={em.key} style={{ width: `${s}px`, height: `${s}px`, objectFit: 'contain', pointerEvents: 'none' }} />
              </div>
            );
          })}
        </div>

        {/* Background colour picker — vertical strip on right */}
        <div style={{ width: '50px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', alignItems: 'center' }}>
          {COLORS.map(c => (
            <button key={`bg-${c}`} onClick={() => setBgColor(c)} style={{ width: '39px', height: '39px', background: c, border: bgColor === c ? '3px solid white' : '1px solid gray', borderRadius: '4px', flexShrink: 0 }} title="Set Background" />
          ))}
        </div>
      </div>
    </div>
  );
}
