import React, { useRef, useState, useEffect } from 'react';

const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];
const BRUSH_SIZES = [2, 6, 12];
const EMOJIS = ['💋','👍','❤️','😉','🤔','🤷','🤦','😂','😭','😡','😛','🤪','🥱','👊','💪','🤤'];

export default function PostItCanvas({ onClose, onSend }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [bgColor, setBgColor] = useState('#fef08a'); // Default postit yellow
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [eraserMode, setEraserMode] = useState(false);
  const [placedEmojis, setPlacedEmojis] = useState([]);

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
    
    const newEmoji = e.dataTransfer.getData('new_emoji');
    const moveEmojiId = e.dataTransfer.getData('move_emoji');
    
    if (newEmoji) {
      setPlacedEmojis(prev => [...prev, { id: Date.now().toString(), emoji: newEmoji, x: offsetX, y: offsetY }]);
    } else if (moveEmojiId) {
      setPlacedEmojis(prev => prev.map(em => em.id === moveEmojiId ? { ...em, x: offsetX, y: offsetY } : em));
    }
  };

  const sendPostIt = () => {
    if (onSend) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      placedEmojis.forEach(em => {
        ctx.fillText(em.emoji, em.x, em.y);
      });
      const dataUrl = canvas.toDataURL('image/png');
      ctx.restore();
      onSend(dataUrl);
    }
    clearCanvas(true);
    setPlacedEmojis([]);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {COLORS.map(c => (
            <button key={`ink-${c}`} onClick={() => {setColor(c); setEraserMode(false);}} style={{ width: '30px', height: '30px', background: c, border: color === c && !eraserMode ? '3px solid white' : '1px solid gray', borderRadius: '50%' }} />
          ))}
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '10px', display: 'flex', gap: '5px' }}>
          {BRUSH_SIZES.map(s => (
            <button key={`size-${s}`} onClick={() => setBrushSize(s)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', border: brushSize === s ? '3px solid var(--accent)' : '1px solid gray' }}>
              <div style={{ width: s, height: s, background: 'black', borderRadius: '50%' }}></div>
            </button>
          ))}
          <button onClick={() => setEraserMode(true)} style={{ padding: '10px 20px', fontSize: '1.1rem', background: eraserMode ? 'var(--accent)' : 'var(--panel-bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Eraser</button>
        </div>
        <button onClick={() => { clearCanvas(); setPlacedEmojis([]); }} style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: '1.1rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Clear</button>
        {onClose && <button onClick={onClose} style={{ padding: '10px 20px', fontSize: '1.1rem', background: 'var(--panel-bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>}
        <button onClick={sendPostIt} style={{ padding: '10px 25px', fontSize: '1.2rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>SEND</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '60px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
          {EMOJIS.map(e => (
            <div key={e} draggable onDragStart={(ev) => ev.dataTransfer.setData('new_emoji', e)} style={{ fontSize: '24px', textAlign: 'center', cursor: 'grab', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px' }}>{e}</div>
          ))}
          <div 
            style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.2)', padding: '10px 0', borderRadius: '8px', textAlign: 'center', border: '2px dashed #ef4444' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const moveEmojiId = e.dataTransfer.getData('move_emoji');
              if (moveEmojiId) {
                setPlacedEmojis(prev => prev.filter(em => em.id !== moveEmojiId));
              }
            }}
          >
            🗑️
          </div>
        </div>
        
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
          {placedEmojis.map(em => (
            <div 
              key={em.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('move_emoji', em.id);
              }}
              style={{ position: 'absolute', left: em.x, top: em.y, fontSize: '40px', transform: 'translate(-50%, -50%)', cursor: 'grab', touchAction: 'none' }}
            >
              {em.emoji}
            </div>
          ))}
        </div>
        
        <div style={{ width: '40px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
          {COLORS.map(c => (
            <button key={`bg-${c}`} onClick={() => setBgColor(c)} style={{ width: '30px', height: '30px', background: c, border: bgColor === c ? '3px solid white' : '1px solid gray', borderRadius: '4px' }} title="Set Background" />
          ))}
        </div>
      </div>
    </div>
  );
}
