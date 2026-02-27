import { calcCapacity, MAX_REALISTIC } from '../utils/calculations.js'

export default function CapacityBar({ boxes, onOpenBacklog }) {
  const { total, pct, overflow, overBy, tasksToMove } = calcCapacity(boxes)

  const color = overflow ? '#f87171' : pct > 60 ? '#F59E0B' : '#34D399'
  const barPct = Math.min(pct, 100)

  return (
    <div style={{
      background: overflow ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${overflow ? 'rgba(248,113,113,0.2)' : '#21262d'}`,
      borderRadius: '8px', padding: '9px 12px', marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Capacidad del día
        </span>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color }}>
          {Math.round(total / 60)}h / {Math.round(MAX_REALISTIC / 60)}h máx
        </span>
      </div>

      {/* Bar */}
      <div style={{ height: '4px', background: '#21262d', borderRadius: '2px', overflow: 'hidden', marginBottom: '7px' }}>
        <div style={{
          height: '100%', width: `${barPct}%`, background: color,
          borderRadius: '2px', transition: 'width 0.4s',
        }} />
      </div>

      {overflow ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#f87171', lineHeight: 1.5 }}>
            ⚠️ {Math.round(overBy / 60)}h extra · mueve ~{tasksToMove} tarea{tasksToMove !== 1 ? 's' : ''} al backlog
          </span>
          <button onClick={onOpenBacklog} style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            color: '#f87171', borderRadius: '5px', padding: '3px 8px',
            cursor: 'pointer', fontSize: '9px', whiteSpace: 'nowrap',
          }}>Ver backlog →</button>
        </div>
      ) : (
        <span style={{ fontSize: '9px', color: '#374151' }}>
          {pct < 50 ? '✅ Día ligero, buen ritmo' : pct < 75 ? '⚡ Carga equilibrada' : '🟡 Al límite, agrega con cuidado'}
        </span>
      )}
    </div>
  )
}
