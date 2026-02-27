import { useMemo } from 'react'
import { CATS } from '../data/categories.js'
import { buildWeeklySummary } from '../utils/calculations.js'

export default function WeeklySummary({ onClose }) {
  const { rows, totalMins, totalDone, mitPct, bestDay, dominantCat, recommendation } = useMemo(buildWeeklySummary, [])

  const maxMins = Math.max(...rows.map(r => r.mins), 1)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '12px',
      fontFamily: 'Georgia,serif', color: '#e2ddd5',
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid #21262d', borderRadius: '16px',
        width: '100%', maxWidth: '620px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#A78BFA', letterSpacing: '2px' }}>📊 RESUMEN SEMANAL</div>
            <div style={{ fontSize: '9px', color: '#374151', marginTop: '2px' }}>Últimos 7 días</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>✕ Cerrar</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '18px' }}>
            {[
              { label: 'Minutos enfocados', value: `${totalMins}m`, sub: `≈ ${Math.round(totalMins/60)}h`, color: '#60A5FA' },
              { label: '% MITs cumplidos',  value: `${mitPct}%`,   sub: 'de la semana',                    color: '#F59E0B' },
              { label: 'Tareas completadas',value: totalDone,       sub: 'esta semana',                     color: '#34D399' },
              { label: 'Mejor día',         value: bestDay?.label ?? '—', sub: `${bestDay?.pct ?? 0}% completado`, color: '#A78BFA' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: '#374151', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{kpi.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: '9px', color: '#374151', marginTop: '3px' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Category dominance */}
          {dominantCat >= 0 && (
            <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>{CATS[dominantCat].icon}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: CATS[dominantCat].color }}>Categoría dominante: {CATS[dominantCat].label}</div>
                <div style={{ fontSize: '9px', color: '#374151' }}>Donde pasaste más tiempo enfocado</div>
              </div>
            </div>
          )}

          {/* Daily bars chart */}
          <div style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>Minutos por día</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '90px', marginBottom: '8px' }}>
            {rows.map((row, i) => {
              const h   = row.mins ? Math.max((row.mins / maxMins) * 70, 4) : 0
              const isB = row.date === bestDay?.date
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{ fontSize: '8px', color: '#374151', marginBottom: '2px' }}>{row.mins}m</div>
                  <div style={{ width: '100%', height: `${h}px`, background: isB ? '#A78BFA' : '#21262d', borderRadius: '3px 3px 0 0', position: 'relative', overflow: 'hidden', transition: 'height 0.4s' }}>
                    <div style={{ position: 'absolute', inset: 0, background: isB ? 'linear-gradient(180deg,#A78BFA,#7C3AED)' : 'linear-gradient(180deg,#374151,#21262d)', borderRadius: '3px 3px 0 0' }} />
                  </div>
                  <div style={{ fontSize: '7px', color: isB ? '#A78BFA' : '#374151', textAlign: 'center', lineHeight: 1.2 }}>{row.label.split(' ').slice(0, 2).join(' ')}</div>
                </div>
              )
            })}
          </div>

          {/* Weekly task table */}
          <div style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px', marginBottom: '8px', marginTop: '14px', textTransform: 'uppercase' }}>Detalle por día</div>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #21262d', marginBottom: '16px' }}>
            {rows.map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '8px 12px',
                background: i % 2 === 0 ? '#161b22' : 'transparent',
                borderBottom: i < rows.length - 1 ? '1px solid #21262d' : 'none',
              }}>
                <div style={{ flex: 1.5, fontSize: '10px', fontWeight: 'bold', color: row.date === bestDay?.date ? '#A78BFA' : '#e2ddd5' }}>
                  {row.date === bestDay?.date ? '🏆 ' : ''}{row.label}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '3px', background: '#21262d', borderRadius: '2px', overflow: 'hidden', width: '80%' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.pct === 100 ? '#34D399' : '#F59E0B' }} />
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#374151', minWidth: '80px', textAlign: 'right' }}>
                  ✅ {row.done}/{row.boxes} · {row.mins}m
                </div>
                {row.mits > 0 && (
                  <div style={{ fontSize: '9px', color: '#F59E0B', minWidth: '60px', textAlign: 'right' }}>
                    ⭐ {row.mitDone}/{row.mits}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div style={{
            background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)',
            borderRadius: '10px', padding: '14px',
          }}>
            <div style={{ fontSize: '9px', color: '#A78BFA', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>💡 Recomendación de la semana</div>
            <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#c9b99a' }}>{recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
