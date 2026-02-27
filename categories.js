import { useState, useMemo } from 'react'
import { CATS } from '../data/categories.js'
import { getIndex, loadDay } from '../utils/storage.js'
import { dateLabel, TODAY, fmtHour } from '../utils/dateHelpers.js'
import { buildExportHTML, triggerDownload } from '../utils/export.js'

export default function HistoryPanel({ onClose, onLoadDay }) {
  const [selected, setSelected] = useState(null)

  const { index, days } = useMemo(() => {
    const idx = getIndex()
    const d = {}
    idx.forEach(date => { const v = loadDay(date); if (v) d[date] = v })
    return { index: idx, days: d }
  }, [])

  const totalDone = Object.values(days).reduce((a, d) => a + (d.boxes || []).filter(b => b.status === 'completado').length, 0)
  const totalMins = Object.values(days).reduce((a, d) => a + (d.boxes || []).filter(b => b.status === 'completado').reduce((s, b) => s + b.minutes, 0), 0)
  const sel = selected && days[selected]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '12px',
      fontFamily: 'Georgia,serif',
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid #21262d', borderRadius: '16px',
        width: '100%', maxWidth: '820px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F59E0B', letterSpacing: '2px' }}>📚 HISTORIAL</div>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            {[{ v: index.length, l: 'días', c: '#F59E0B' }, { v: totalDone, l: 'tareas ✓', c: '#34D399' }, { v: `${Math.round(totalMins / 60)}h`, l: 'enfocado', c: '#60A5FA' }].map(({ v, l, c }, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: 'bold', color: c }}>{v}</div>
                <div style={{ fontSize: '9px', color: '#374151' }}>{l}</div>
              </div>
            ))}
            <button onClick={onClose} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Day list */}
          <div style={{ width: '200px', minWidth: '200px', borderRight: '1px solid #21262d', overflowY: 'auto', padding: '10px 8px' }}>
            {index.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#374151', fontSize: '11px' }}>Sin historial aún</div>}
            {index.map(date => {
              const d = days[date]; if (!d) return null
              const boxes = d.boxes || [], done = boxes.filter(b => b.status === 'completado').length, total = boxes.length, pct = total ? Math.round(done / total * 100) : 0
              const isToday = date === TODAY, isSel = selected === date
              return (
                <div key={date} onClick={() => setSelected(isSel ? null : date)}
                  style={{ background: isSel ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isSel ? 'rgba(245,158,11,0.3)' : isToday ? 'rgba(52,211,153,0.22)' : '#21262d'}`, borderRadius: '8px', padding: '9px 10px', marginBottom: '5px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: isSel ? '#F59E0B' : isToday ? '#34D399' : '#e2ddd5' }}>{isToday ? '🟢 Hoy' : dateLabel(date)}</div>
                    <div style={{ fontSize: '9px', color: pct === 100 ? '#34D399' : pct > 50 ? '#F59E0B' : '#6b7280', fontWeight: 'bold' }}>{pct}%</div>
                  </div>
                  <div style={{ height: '2px', background: '#21262d', borderRadius: '1px', overflow: 'hidden', marginBottom: '4px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#34D399' : '#F59E0B' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', color: '#374151' }}>✅ {done}/{total}</span>
                    <span style={{ fontSize: '9px', color: '#374151' }}>⏱ {boxes.filter(b => b.status === 'completado').reduce((a, b) => a + b.minutes, 0)}m</span>
                  </div>
                  {d.mits?.length > 0 && <div style={{ fontSize: '9px', color: '#F59E0B', marginTop: '2px' }}>⭐ {d.mits.filter(m => boxes.find(b => b.id === m.id && b.status === 'completado')).length}/{d.mits.length} MITs</div>}
                </div>
              )
            })}
          </div>

          {/* Detail */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', color: '#e2ddd5' }}>
            {!selected && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>👈</div>
                <div style={{ fontSize: '12px' }}>Selecciona un día</div>
              </div>
            )}
            {selected && sel && (() => {
              const boxes = sel.boxes || [], mits = sel.mits || [], done = boxes.filter(b => b.status === 'completado'), mitIds = mits.map(m => m.id)
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{dateLabel(selected)}</div>
                      <div style={{ fontSize: '9px', color: '#374151', marginTop: '2px' }}>{done.length}/{boxes.length} completadas · {done.reduce((a, b) => a + b.minutes, 0)}m</div>
                    </div>
                    <div style={{ display: 'flex', gap: '7px' }}>
                      {selected !== TODAY && (
                        <button onClick={() => onLoadDay(selected, sel)} style={{ padding: '6px 11px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>📋 Cargar hoy</button>
                      )}
                      <button onClick={() => {
                        const html = buildExportHTML(boxes, mits, sel.aiSummary || '', selected)
                        triggerDownload(html, `timebox-${selected}.html`)
                      }} style={{ padding: '6px 11px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' }}>📄 Exportar</button>
                    </div>
                  </div>

                  {mits.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '9px', color: '#F59E0B', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>⭐ MITs</div>
                      {mits.map((m, i) => { const b = boxes.find(x => x.id === m.id); const d = b?.status === 'completado'; return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 9px', background: d ? 'rgba(52,211,153,0.06)' : 'rgba(245,158,11,0.04)', border: `1px solid ${d ? 'rgba(52,211,153,0.18)' : 'rgba(245,158,11,0.12)'}`, borderRadius: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: d ? '#34D399' : '#F59E0B' }}>{i + 1}.</span>
                          <span style={{ fontSize: '11px', flex: 1, textDecoration: d ? 'line-through' : 'none', opacity: d ? .5 : 1 }}>{m.task}</span>
                          <span>{d ? '✅' : '⏳'}</span>
                        </div>
                      )})}
                    </div>
                  )}

                  {boxes.sort((a, b) => (a.startHour ?? 99) - (b.startHour ?? 99)).map(box => {
                    const cat = CATS[box.category]
                    return (
                      <div key={box.id} style={{ background: '#161b22', border: '1px solid #21262d', borderLeft: `3px solid ${mitIds.includes(box.id) ? '#F59E0B' : cat.color}`, borderRadius: '6px', padding: '8px 10px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px' }}>{box.status === 'completado' ? '✅' : cat.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', textDecoration: box.status === 'completado' ? 'line-through' : 'none', opacity: box.status === 'completado' ? .4 : 1 }}>
                            {mitIds.includes(box.id) && <span style={{ color: '#F59E0B', fontSize: '9px' }}>⭐ </span>}{box.task}
                          </div>
                          <div style={{ fontSize: '8px', color: '#374151' }}>{cat.label}{box.startHour != null && ` · ${fmtHour(box.startHour)}`} · {box.minutes}m{box.note && ` · 📝 ${box.note.slice(0, 22)}`}</div>
                        </div>
                        <span style={{ fontSize: '9px', color: box.status === 'completado' ? '#34D399' : '#6b7280' }}>{box.priority}</span>
                      </div>
                    )
                  })}

                  {sel.aiSummary && (
                    <div style={{ marginTop: '12px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '7px', padding: '10px', fontSize: '10px', lineHeight: '1.7', color: '#c9b99a', whiteSpace: 'pre-line' }}>
                      <div style={{ fontSize: '8px', color: '#F59E0B', marginBottom: '4px', fontWeight: 'bold' }}>🤖 IA</div>
                      {sel.aiSummary}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
