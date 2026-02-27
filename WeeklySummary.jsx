import { useState } from 'react'
import { TEMPLATES } from '../data/templates.js'
import { CATS } from '../data/categories.js'

export default function TemplatesModal({ onApply, onClose }) {
  const [selected, setSelected] = useState(null)
  const [mode, setMode]         = useState('replace')   // 'replace' | 'add'

  const tpl = TEMPLATES.find(t => t.id === selected)

  const handleApply = () => {
    if (!tpl) return
    const tasks = tpl.tasks.map((t, i) => ({
      id: Date.now() + i, task: t.task, minutes: t.minutes, remaining: t.minutes * 60,
      category: t.category, priority: t.priority, startHour: null,
      status: 'pendiente', note: '', isMIT: false,
    }))
    onApply(tasks, mode)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 350, padding: '16px',
      fontFamily: 'Georgia,serif', color: '#e2ddd5',
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid #21262d', borderRadius: '16px',
        width: '100%', maxWidth: '560px', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#60A5FA', letterSpacing: '2px' }}>🗂 PLANTILLAS DE DÍA</div>
            <div style={{ fontSize: '9px', color: '#374151', marginTop: '2px' }}>Elige una base para tu jornada</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          {/* Template cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '16px' }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)}
                style={{
                  background: selected === t.id ? 'rgba(96,165,250,0.1)' : '#161b22',
                  border: `1px solid ${selected === t.id ? 'rgba(96,165,250,0.4)' : '#21262d'}`,
                  borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{t.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: selected === t.id ? '#60A5FA' : '#e2ddd5', marginBottom: '3px' }}>{t.name}</div>
                <div style={{ fontSize: '9px', color: '#374151', marginBottom: '6px' }}>{t.description}</div>
                <div style={{ fontSize: '8px', color: '#F59E0B' }}>⭐ {t.suggestedMITs} MITs sugeridos</div>
              </div>
            ))}
          </div>

          {/* Preview */}
          {tpl && (
            <div style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', color: '#60A5FA', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Vista previa · {tpl.tasks.reduce((a, t) => a + t.minutes, 0)} min total
              </div>
              {tpl.tasks.map((t, i) => {
                const cat = CATS[t.category]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '11px', flex: 1 }}>{t.task}</span>
                    <span style={{ fontSize: '8px', color: cat.color, background: cat.bg, padding: '1px 5px', borderRadius: '20px' }}>{t.minutes}m</span>
                    <span style={{ fontSize: '8px', color: t.priority === 'Alta' ? '#f87171' : t.priority === 'Normal' ? '#F59E0B' : '#6b7280' }}>{t.priority}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Replace/Add toggle */}
          {tpl && (
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '9px', color: '#374151', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Cómo aplicar?</div>
              <div style={{ display: 'flex', gap: '7px' }}>
                {[['replace', '🔄 Reemplazar mi día'], ['add', '➕ Agregar encima']].map(([v, label]) => (
                  <button key={v} onClick={() => setMode(v)} style={{
                    flex: 1, padding: '8px', background: mode === v ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)',
                    color: mode === v ? '#60A5FA' : '#374151',
                    border: `1px solid ${mode === v ? 'rgba(96,165,250,0.3)' : '#21262d'}`,
                    borderRadius: '7px', cursor: 'pointer', fontSize: '11px',
                  }}>{label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #21262d', display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', background: 'transparent', color: '#374151', border: '1px solid #21262d', borderRadius: '7px', cursor: 'pointer', fontSize: '11px' }}>Cancelar</button>
          <button onClick={handleApply} disabled={!tpl} style={{
            flex: 2, padding: '9px', background: tpl ? 'linear-gradient(135deg,#60A5FA,#3B82F6)' : 'rgba(255,255,255,0.04)',
            color: tpl ? '#0d1117' : '#374151', border: 'none', borderRadius: '7px',
            cursor: tpl ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px',
          }}>
            {tpl ? `Aplicar "${tpl.name}"` : 'Selecciona una plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}
