import { useState } from 'react'
import { todayStr, greeting } from '../utils/dateHelpers.js'

export default function MITModal({ onComplete }) {
  const [step, setStep] = useState(0)
  const [mits, setMits] = useState(['', '', ''])
  const [mins, setMins] = useState([45, 45, 45])
  const valid = mits.filter(m => m.trim()).length >= 1
  const upd  = (i, v) => setMits(p => p.map((x, j) => j === i ? v : x))
  const updM = (i, v) => setMins(p => p.map((x, j) => j === i ? v : x))

  const confirm = () => {
    const tasks = mits
      .map((t, i) => t.trim() && {
        id: Date.now() + i, task: t.trim(), minutes: mins[i],
        remaining: mins[i] * 60, category: 0, priority: 'Alta',
        startHour: null, status: 'pendiente', note: '', isMIT: true,
      })
      .filter(Boolean)
    onComplete(tasks)
  }

  const S = {
    wrap:  { minHeight: '100vh', background: 'linear-gradient(135deg,#0d1117 0%,#0a1f0a 60%,#0d1117 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Georgia,serif', color: '#e2ddd5' },
    card:  { width: '100%', maxWidth: '480px' },
    inp:   { flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', color: '#e2ddd5', fontSize: '13px', outline: 'none', fontFamily: 'Georgia,serif', transition: 'border-color 0.2s' },
    sel:   { background: '#161b22', border: '1px solid #21262d', color: '#9ca3af', borderRadius: '8px', padding: '0 8px', fontSize: '11px', cursor: 'pointer', minWidth: '65px' },
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        {step === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>🌅</div>
            <div style={{ fontSize: '11px', color: '#34D399', letterSpacing: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>Ritual Matutino</div>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#e2ddd5', margin: '0 0 10px' }}>{greeting()}</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.7', margin: '0 0 24px' }}>
              Antes de abrir tu agenda, define las{' '}
              <strong style={{ color: '#F59E0B' }}>3 tareas más importantes</strong>.<br />
              Si las completas, el día habrá valido la pena.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
              {['🎯 Enfoque', '⚡ Impacto', '✅ Claridad'].map((t, i) => (
                <div key={i} style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: '10px', padding: '10px', fontSize: '11px', color: '#34D399', flex: 1, textAlign: 'center' }}>{t}</div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ background: 'linear-gradient(135deg,#34D399,#059669)', color: 'white', border: 'none', borderRadius: '12px', padding: '13px 36px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 24px rgba(52,211,153,0.25)' }}>
              Definir mis MITs →
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#34D399', letterSpacing: '3px', marginBottom: '5px', textTransform: 'uppercase' }}>Mis 3 Tareas Más Importantes</div>
              <div style={{ fontSize: '11px', color: '#374151' }}>{todayStr()}</div>
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#F59E0B' : i === 1 ? '#60A5FA' : '#A78BFA', color: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: '10px', color: i === 0 ? '#F59E0B' : i === 1 ? '#9ca3af' : '#4b5563' }}>{i === 0 ? '🔥 Prioridad máxima' : i === 1 ? '⚡ Segunda' : '💡 Tercera (opcional)'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={mits[i]} onChange={e => upd(i, e.target.value)} id={`mit-${i}`}
                    onKeyDown={e => e.key === 'Enter' && i < 2 && document.getElementById(`mit-${i + 1}`)?.focus()}
                    placeholder={i === 0 ? 'La tarea más importante...' : i === 1 ? 'Segunda tarea...' : 'Tercera (opcional)...'}
                    style={{ ...S.inp, border: `1px solid ${mits[i].trim() ? (i === 0 ? '#F59E0B' : i === 1 ? '#60A5FA' : '#A78BFA') : '#21262d'}` }} />
                  <select value={mins[i]} onChange={e => updM(i, parseInt(e.target.value))} style={S.sel}>
                    {[15, 25, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m}m</option>)}
                  </select>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '18px', display: 'flex', gap: '8px' }}>
              <button onClick={() => setStep(0)} style={{ padding: '10px 16px', background: 'transparent', color: '#374151', border: '1px solid #21262d', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>← Atrás</button>
              <button onClick={confirm} disabled={!valid} style={{ flex: 1, padding: '10px', background: valid ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'rgba(245,158,11,0.1)', color: valid ? '#0d1117' : '#374151', border: 'none', borderRadius: '8px', cursor: valid ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px' }}>
                Empezar mi día →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
