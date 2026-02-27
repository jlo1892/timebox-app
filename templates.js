import { useMemo } from 'react'
import { CATS } from '../data/categories.js'
import { buildReplan } from '../utils/calculations.js'
import { nowHour, fmtHour } from '../utils/dateHelpers.js'

export default function ReplanModal({ boxes, onApply, onDismiss }) {
  const { fits, movable, remaining, realistic } = useMemo(() => buildReplan(boxes, nowHour()), [boxes])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 450, padding: '16px',
      fontFamily: 'Georgia,serif', color: '#e2ddd5',
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '16px', width: '100%', maxWidth: '500px',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #21262d', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔄</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F59E0B', letterSpacing: '2px' }}>REPLAN DE TARDE</div>
          <p style={{ fontSize: '11px', color: '#374151', marginTop: '5px' }}>
            Son las 4pm · quedan ~{Math.round(remaining / 60)}h · realista cubrir {Math.round(realistic / 60)}h
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Fits today */}
          {fits.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', color: '#34D399', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
                ✅ Caben hoy ({fits.length})
              </div>
              {fits.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}

          {/* Move to backlog */}
          {movable.length > 0 && (
            <div>
              <div style={{ fontSize: '9px', color: '#f87171', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
                📦 Mover al backlog o mañana ({movable.length})
              </div>
              {movable.map(t => <TaskRow key={t.id} task={t} dim />)}
            </div>
          )}

          {movable.length === 0 && fits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#374151', fontSize: '12px' }}>
              🎉 No hay tareas pendientes — ¡buen trabajo!
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #21262d', display: 'flex', gap: '8px' }}>
          <button onClick={onDismiss} style={{
            flex: 1, padding: '10px', background: 'transparent',
            color: '#374151', border: '1px solid #21262d', borderRadius: '8px',
            cursor: 'pointer', fontSize: '12px',
          }}>No por ahora</button>
          {movable.length > 0 && (
            <button onClick={() => onApply(movable)} style={{
              flex: 2, padding: '10px',
              background: 'linear-gradient(135deg,#F59E0B,#D97706)',
              color: '#0d1117', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
            }}>
              Mover {movable.length} tarea{movable.length !== 1 ? 's' : ''} al backlog →
            </button>
          )}
          {movable.length === 0 && (
            <button onClick={onDismiss} style={{
              flex: 2, padding: '10px', background: 'linear-gradient(135deg,#34D399,#059669)',
              color: '#0d1117', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
            }}>¡Todo en orden! ✓</button>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, dim }) {
  const cat = CATS[task.category]
  return (
    <div style={{
      background: '#161b22', border: `1px solid ${dim ? '#21262d' : cat.color + '33'}`,
      borderLeft: `3px solid ${dim ? '#374151' : cat.color}`,
      borderRadius: '6px', padding: '8px 11px', marginBottom: '5px',
      display: 'flex', alignItems: 'center', gap: '8px',
      opacity: dim ? 0.5 : 1,
    }}>
      <span style={{ fontSize: '12px' }}>{cat.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
          {task.isMIT && <span style={{ color: '#F59E0B', fontSize: '9px' }}>⭐ </span>}
          {task.task}
        </div>
        <span style={{ fontSize: '8px', color: '#374151' }}>{cat.label} · {task.minutes}m · {task.priority}</span>
      </div>
    </div>
  )
}
