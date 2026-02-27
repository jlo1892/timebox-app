import { useEffect, useState } from 'react'
import { CATS } from '../data/categories.js'
import { fmtTime } from '../utils/dateHelpers.js'
import { randomMessage } from '../data/motivational.js'

export default function FocusMode({ box, onPause, onDone, onExit }) {
  const cat = CATS[box.category]
  const [msg] = useState(() => randomMessage())
  const pct   = Math.round(((box.minutes * 60 - box.remaining) / (box.minutes * 60)) * 100)

  // Prevent scroll on body while in focus mode
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'radial-gradient(ellipse at center, #0d1f12 0%, #0d1117 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia,serif', color: '#e2ddd5', padding: '24px',
    }}>
      {/* Exit button top-right */}
      <button onClick={onExit} style={{
        position: 'absolute', top: '16px', right: '16px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid #21262d',
        color: '#374151', borderRadius: '8px', padding: '6px 12px',
        cursor: 'pointer', fontSize: '11px',
      }}>← Volver</button>

      {/* Category badge */}
      <div style={{
        background: cat.bg, border: `1px solid ${cat.color}44`,
        borderRadius: '20px', padding: '4px 14px', marginBottom: '20px',
        fontSize: '12px', color: cat.color, display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span>{cat.icon}</span><span>{cat.label}</span>
        {box.isMIT && <span style={{ color: '#F59E0B' }}>· ⭐ MIT</span>}
      </div>

      {/* Task name */}
      <h1 style={{
        fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 'bold',
        textAlign: 'center', marginBottom: '8px', maxWidth: '600px',
        color: '#fff', lineHeight: 1.3,
      }}>{box.task}</h1>

      {/* Motivational message */}
      <p style={{ fontSize: '13px', color: '#374151', marginBottom: '40px', fontStyle: 'italic' }}>"{msg}"</p>

      {/* Timer */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 'clamp(56px, 14vw, 96px)',
        fontWeight: 'bold',
        color: box.remaining < 60 ? '#f87171' : box.remaining < 300 ? '#F59E0B' : cat.color,
        letterSpacing: '4px',
        lineHeight: 1,
        marginBottom: '28px',
        textShadow: `0 0 40px ${cat.color}55`,
      }}>
        {fmtTime(box.remaining)}
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '360px', height: '6px', background: '#21262d', borderRadius: '3px', marginBottom: '40px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${cat.color}88, ${cat.color})`,
          borderRadius: '3px', transition: 'width 1s linear',
          boxShadow: `0 0 12px ${cat.color}66`,
        }} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onPause} style={{
          padding: '12px 28px', background: 'rgba(245,158,11,0.1)',
          color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
        }}>⏸ Pausar</button>
        <button onClick={onDone} style={{
          padding: '12px 28px', background: 'linear-gradient(135deg,#34D399,#059669)',
          color: '#0d1117', border: 'none',
          borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
          boxShadow: '0 0 20px rgba(52,211,153,0.3)',
        }}>✅ Completar</button>
      </div>

      {/* Radial glow behind timer */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
        width: '300px', height: '300px', borderRadius: '50%',
        background: `radial-gradient(circle, ${cat.color}0a 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: -1,
      }} />
    </div>
  )
}
