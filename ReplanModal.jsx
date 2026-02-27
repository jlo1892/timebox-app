import { CATS } from '../data/categories.js'

export default function BacklogPanel({ backlog, onClose, onMoveToDay, onDelete }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 350, padding: '16px',
      fontFamily: 'Georgia,serif',
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid #21262d', borderRadius: '14px',
        width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#F59E0B', letterSpacing: '2px' }}>📦 BACKLOG</div>
            <div style={{ fontSize: '9px', color: '#374151', marginTop: '2px' }}>Tareas sin fecha asignada</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {backlog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
              <div style={{ fontSize: '12px' }}>El backlog está vacío</div>
              <div style={{ fontSize: '10px', marginTop: '6px', color: '#21262d' }}>Mueve tareas aquí cuando tengas demasiadas para hoy</div>
            </div>
          ) : (
            backlog.map(task => {
              const cat = CATS[task.category]
              return (
                <div key={task.id} style={{
                  background: '#161b22', border: '1px solid #21262d',
                  borderLeft: `3px solid ${cat.color}`, borderRadius: '7px',
                  padding: '10px 12px', marginBottom: '6px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>{task.task}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <span style={{ fontSize: '8px', background: cat.bg, color: cat.color, padding: '1px 5px', borderRadius: '20px' }}>{cat.label}</span>
                      <span style={{ fontSize: '8px', color: '#374151' }}>⏱ {task.minutes}m</span>
                      <span style={{ fontSize: '8px', color: task.priority === 'Alta' ? '#f87171' : task.priority === 'Normal' ? '#F59E0B' : '#6b7280' }}>{task.priority}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => onMoveToDay(task)} style={{
                      padding: '5px 10px', background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.25)', color: '#34D399',
                      borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap',
                    }}>+ Hoy</button>
                    <button onClick={() => onDelete(task.id)} style={{
                      width: '26px', height: '26px', background: 'rgba(248,113,113,0.07)',
                      border: '1px solid rgba(248,113,113,0.15)', color: '#f87171',
                      borderRadius: '5px', cursor: 'pointer', fontSize: '11px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #21262d' }}>
          <p style={{ fontSize: '9px', color: '#374151', lineHeight: 1.6 }}>
            💡 Las tareas del backlog no cuentan en la capacidad del día. Tráelas cuando tengas espacio real.
          </p>
        </div>
      </div>
    </div>
  )
}
