import { useState, useEffect, useRef, useCallback } from 'react'
import { CATS, HOURS } from './data/categories.js'
import { TODAY, fmtTime, fmtHour, todayStr, nowHour } from './utils/dateHelpers.js'
import { loadDay, saveDay, isMITDone, markMITDone, isReplanShown, markReplanShown, loadBacklog, saveBacklog } from './utils/storage.js'
import { buildExportHTML, triggerDownload } from './utils/export.js'

import MITModal       from './components/MITModal.jsx'
import FocusMode      from './components/FocusMode.jsx'
import CapacityBar    from './components/CapacityBar.jsx'
import BacklogPanel   from './components/BacklogPanel.jsx'
import ReplanModal    from './components/ReplanModal.jsx'
import TemplatesModal from './components/TemplatesModal.jsx'
import WeeklySummary  from './components/WeeklySummary.jsx'
import HistoryPanel   from './components/HistoryPanel.jsx'

// ── Shared style tokens ────────────────────────────────────────────────────────
const lbl = { display: 'block', fontSize: '9px', color: '#374151', marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' }
const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 11px', color: '#e2ddd5', fontSize: '12px', marginBottom: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Georgia,serif' }
const mb  = c => ({ background: 'transparent', border: `1px solid ${c}44`, color: c, borderRadius: '3px', width: '17px', height: '17px', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })
const ab  = c => ({ width: '26px', height: '26px', background: `${c}14`, color: c, border: `1px solid ${c}22`, borderRadius: '5px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' })

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  // Phase: 'mit' | 'app'
  const [phase, setPhase] = useState(() => {
    const d = loadDay(TODAY)
    if (d) return 'app'
    return isMITDone(TODAY) ? 'app' : 'mit'
  })

  const [boxes,   setBoxes]   = useState(() => loadDay(TODAY)?.boxes   || [])
  const [mits,    setMits]    = useState(() => loadDay(TODAY)?.mits    || [])
  const [aiSummary, setAiSummary] = useState(() => loadDay(TODAY)?.aiSummary || '')
  const [backlog, setBacklog] = useState(() => loadBacklog())

  const [view,       setView]       = useState('timeline')
  const [activeTimer, setActiveTimer] = useState(null)
  const [focusBox,   setFocusBox]   = useState(null)   // FocusMode: box or null
  const [showForm,   setShowForm]   = useState(false)
  const [editNote,   setEditNote]   = useState(null)
  const [noteText,   setNoteText]   = useState('')
  const [dragBox,    setDragBox]    = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [loadingAI,  setLoadingAI]  = useState(false)
  const [aiMode,     setAiMode]     = useState('summary')
  const [exportMsg,  setExportMsg]  = useState('')

  const [showBacklog,   setShowBacklog]   = useState(false)
  const [showReplan,    setShowReplan]    = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showHistory,   setShowHistory]   = useState(false)
  const [showWeekly,    setShowWeekly]    = useState(false)

  const [form, setForm] = useState({ task: '', minutes: 25, category: 0, priority: 'Normal', startHour: null })

  const timelineRef = useRef(null)
  const intervalRef = useRef(null)
  const saveTimeout = useRef(null)

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const persist = useCallback((b, m, ai) => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveDay(TODAY, { boxes: b, mits: m, aiSummary: ai })
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1400)
    }, 600)
  }, [])
  useEffect(() => { if (phase === 'app') persist(boxes, mits, aiSummary) }, [boxes, mits, aiSummary, phase])

  // Persist backlog
  useEffect(() => { saveBacklog(backlog) }, [backlog])

  // ── Replan check at 16:00 ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'app') return
    const checkReplan = () => {
      const h = nowHour()
      if (h >= 16 && h < 22 && !isReplanShown(TODAY)) {
        setShowReplan(true)
        markReplanShown(TODAY)
      }
    }
    checkReplan()
    const id = setInterval(checkReplan, 60 * 1000)
    return () => clearInterval(id)
  }, [phase])

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTimer !== null) {
      intervalRef.current = setInterval(() => {
        setBoxes(prev => prev.map(b => {
          if (b.id !== activeTimer) return b
          const rem = b.remaining - 1
          if (rem <= 0) {
            clearInterval(intervalRef.current)
            setActiveTimer(null)
            setFocusBox(null)
            return { ...b, remaining: 0, status: 'completado' }
          }
          return { ...b, remaining: rem }
        }))
        // Keep focusBox in sync with latest remaining
        setFocusBox(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : prev)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [activeTimer])

  // ── MIT complete ───────────────────────────────────────────────────────────
  const handleMITComplete = tasks => {
    setMits(tasks); setBoxes(tasks)
    markMITDone(TODAY)
    saveDay(TODAY, { boxes: tasks, mits: tasks, aiSummary: '' })
    setPhase('app')
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addBox = () => {
    if (!form.task.trim()) return
    setBoxes(p => [...p, {
      id: Date.now(), task: form.task, minutes: form.minutes, remaining: form.minutes * 60,
      category: form.category, priority: form.priority, startHour: form.startHour,
      status: 'pendiente', note: '', isMIT: false,
    }])
    setForm({ task: '', minutes: 25, category: 0, priority: 'Normal', startHour: null })
    setShowForm(false)
  }

  const updateStart = (id, h) => setBoxes(p => p.map(b => b.id === id ? { ...b, startHour: h } : b))

  const startTimer = id => {
    if (activeTimer && activeTimer !== id) pauseTimer(activeTimer)
    setActiveTimer(id)
    setBoxes(p => p.map(b => b.id === id ? { ...b, status: 'activo' } : b))
    const box = boxes.find(b => b.id === id)
    if (box) setFocusBox({ ...box, status: 'activo' })
  }
  const pauseTimer = id => {
    setActiveTimer(null)
    setFocusBox(null)
    setBoxes(p => p.map(b => b.id === id ? { ...b, status: 'pausado' } : b))
  }
  const doneBox   = id => { setActiveTimer(null); setFocusBox(null); setBoxes(p => p.map(b => b.id === id ? { ...b, status: 'completado' } : b)) }
  const deleteBox = id => { if (activeTimer === id) { setActiveTimer(null); setFocusBox(null) }; setBoxes(p => p.filter(b => b.id !== id)) }

  const saveNote = () => { setBoxes(p => p.map(b => b.id === editNote ? { ...b, note: noteText } : b)); setEditNote(null) }

  const resetDay = () => {
    if (!window.confirm('¿Empezar un nuevo día? El actual ya está guardado.')) return
    try { localStorage.removeItem(`timebox:mit:${TODAY}`) } catch {}
    setBoxes([]); setMits([]); setAiSummary(''); setPhase('mit')
  }

  // ── Backlog ────────────────────────────────────────────────────────────────
  const moveToBacklog = id => {
    const box = boxes.find(b => b.id === id)
    if (!box) return
    setBacklog(p => [...p, { ...box, id: Date.now() }])
    deleteBox(id)
  }
  const backlogToDay = task => {
    setBoxes(p => [...p, { ...task, id: Date.now(), status: 'pendiente', remaining: task.minutes * 60, startHour: null }])
    setBacklog(p => p.filter(t => t.id !== task.id))
    setShowBacklog(false)
  }
  const deleteFromBacklog = id => setBacklog(p => p.filter(t => t.id !== id))

  // ── Replan apply ───────────────────────────────────────────────────────────
  const applyReplan = movable => {
    movable.forEach(t => moveToBacklog(t.id))
    setShowReplan(false)
  }

  // ── Templates apply ────────────────────────────────────────────────────────
  const applyTemplate = (tasks, mode) => {
    if (mode === 'replace') setBoxes(tasks)
    else setBoxes(p => [...p, ...tasks])
    setShowTemplates(false)
  }

  // ── Load past day ──────────────────────────────────────────────────────────
  const loadPastDay = (_, data) => {
    const nb = (data.boxes || []).map(b => ({ ...b, id: Date.now() + Math.random(), status: 'pendiente', remaining: b.minutes * 60, startHour: null, note: '' }))
    setBoxes(p => [...p, ...nb])
    setShowHistory(false)
  }

  // ── AI ─────────────────────────────────────────────────────────────────────
  const callAI = async mode => {
    setLoadingAI(true); setAiSummary(''); setAiMode(mode)
    const mitStr = mits.map(m => `"${m.task}"(${boxes.find(b => b.id === m.id)?.status === 'completado' ? '✅' : 'pendiente'})`).join(',') || 'ninguna'
    let prompt = ''
    if (mode === 'schedule') {
      const un = boxes.filter(b => b.startHour === null), sc = boxes.filter(b => b.startHour !== null)
      prompt = `Experto Timebox. ${todayStr()}. MITs: ${mitStr}. Programadas: ${sc.map(b => `"${b.task}" ${fmtHour(b.startHour)} ${b.minutes}min`).join(',') || 'ninguna'}. Sin hora: ${un.map(b => `id=${b.id} "${b.task}" ${b.minutes}min ${b.priority}`).join('|') || 'ninguna'}. No solapar, 10min buffer, Alta primero. SOLO JSON: {"assignments":[{"id":0,"startHour":9.5}],"tip":"consejo"}`
    } else {
      prompt = `Coach Timebox español. ${todayStr()}. MITs: ${mitStr}. Completadas: ${boxes.filter(b => b.status === 'completado').map(b => `"${b.task}"${b.isMIT ? ' (MIT)' : ''}`).join(',') || 'ninguna'}. Pendientes: ${boxes.filter(b => b.status !== 'completado').map(b => `"${b.task}"`).join(',') || 'ninguna'}. Notas: ${boxes.filter(b => b.note).map(b => `${b.task}: ${b.note}`).join('|') || 'ninguna'}. Resumen motivador conciso, logros, mejoras, recomendación mañana. Máx 120 palabras.`
    }
    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }) })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      if (mode === 'schedule') {
        try { const j = JSON.parse(text.replace(/```json|```/g, '').trim()); j.assignments?.forEach(a => updateStart(a.id, a.startHour)); setAiSummary(j.tip || '✅ ¡Programado!') }
        catch { setAiSummary('⚠️ Intenta de nuevo.') }
      } else setAiSummary(text)
    } catch { setAiSummary('Error de conexión.') }
    setLoadingAI(false)
  }

  const doExport = () => {
    const html = buildExportHTML(boxes, mits, aiSummary, TODAY)
    const res  = triggerDownload(html, `timebox-${TODAY}.html`)
    setExportMsg(res)
    setTimeout(() => setExportMsg(''), 5000)
  }

  const onTimelineDrop = useCallback(e => {
    if (!dragBox || !timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const snap = Math.round((7 + (e.clientY - rect.top) / rect.height * 16) * 4) / 4
    updateStart(dragBox, Math.max(7, Math.min(22, snap)))
    setDragBox(null)
  }, [dragBox])

  // ── Derived ────────────────────────────────────────────────────────────────
  if (phase === 'mit') return <MITModal onComplete={handleMITComplete} />
  if (focusBox) return (
    <FocusMode
      box={focusBox}
      onPause={() => pauseTimer(activeTimer)}
      onDone={() => doneBox(activeTimer)}
      onExit={() => setFocusBox(null)}
    />
  )

  const completedCount = boxes.filter(b => b.status === 'completado').length
  const totalMins      = boxes.filter(b => b.status === 'completado').reduce((a, b) => a + b.minutes, 0)
  const mitsDone       = mits.filter(m => boxes.find(b => b.id === m.id && b.status === 'completado')).length
  const unscheduled    = boxes.filter(b => b.startHour === null)
  const scheduled      = boxes.filter(b => b.startHour !== null)

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'Georgia,serif', color: '#e2ddd5', fontSize: '13px' }}>

      {/* ── MODALS ── */}
      {showBacklog   && <BacklogPanel backlog={backlog} onClose={() => setShowBacklog(false)} onMoveToDay={backlogToDay} onDelete={deleteFromBacklog} />}
      {showReplan    && <ReplanModal boxes={boxes} onApply={applyReplan} onDismiss={() => setShowReplan(false)} />}
      {showTemplates && <TemplatesModal onApply={applyTemplate} onClose={() => setShowTemplates(false)} />}
      {showHistory   && <HistoryPanel onClose={() => setShowHistory(false)} onLoadDay={loadPastDay} />}
      {showWeekly    && <WeeklySummary onClose={() => setShowWeekly(false)} />}

      {/* ── TOP BAR ── */}
      <div style={{ background: 'rgba(13,17,23,0.97)', borderBottom: '1px solid #21262d', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px', color: '#F59E0B' }}>⏳ TIMEBOX</div>
            <div style={{ fontSize: '8px', color: '#374151' }}>{todayStr()}</div>
          </div>

          {/* MITs badge */}
          <div style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '2px 9px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: '#F59E0B' }}>⭐</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: mitsDone === mits.length && mits.length ? '#34D399' : '#F59E0B' }}>{mitsDone}/{mits.length}</span>
          </div>

          <span style={{ fontSize: '9px', color: savedFlash ? '#34D399' : 'transparent', transition: 'color 0.4s' }}>💾</span>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#161b22', borderRadius: '6px', border: '1px solid #21262d', overflow: 'hidden' }}>
            {[['timeline', '🗓'], ['list', '📋']].map(([v, ic]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '4px 9px', background: view === v ? '#F59E0B' : 'transparent', color: view === v ? '#0d1117' : '#374151', border: 'none', cursor: 'pointer', fontSize: '12px' }}>{ic}</button>
            ))}
          </div>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowTemplates(true)} style={{ padding: '4px 8px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.18)', color: '#60A5FA', borderRadius: '6px', cursor: 'pointer', fontSize: '9px' }}>🗂 Plantillas</button>
          <button onClick={() => setShowWeekly(true)}    style={{ padding: '4px 8px', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)', color: '#A78BFA', borderRadius: '6px', cursor: 'pointer', fontSize: '9px' }}>📊 Semana</button>
          <button onClick={() => setShowHistory(true)}   style={{ padding: '4px 8px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', color: '#34D399', borderRadius: '6px', cursor: 'pointer', fontSize: '9px' }}>📚 Historial</button>
          <button onClick={resetDay} title="Nuevo día" style={{ padding: '4px 7px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '5px', fontSize: '10px', color: '#f87171', cursor: 'pointer' }}>🔄</button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#F59E0B', lineHeight: '1' }}>{completedCount}/{boxes.length}</div>
            <div style={{ fontSize: '8px', color: '#374151' }}>{totalMins}m</div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: '#F59E0B', color: '#0d1117', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '17px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 12px rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

      {/* ── MITs strip ── */}
      {mits.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.03)', borderBottom: '1px solid rgba(245,158,11,0.07)', padding: '4px 14px', display: 'flex', gap: '5px', alignItems: 'center', overflowX: 'auto' }}>
          <span style={{ fontSize: '8px', color: '#374151', whiteSpace: 'nowrap', letterSpacing: '1px', textTransform: 'uppercase' }}>⭐ MITs:</span>
          {mits.map((m, i) => {
            const box  = boxes.find(b => b.id === m.id)
            const done = box?.status === 'completado'
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: done ? 'rgba(52,211,153,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${done ? 'rgba(52,211,153,0.18)' : 'rgba(245,158,11,0.15)'}`, borderRadius: '20px', padding: '1px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: done ? '#34D399' : '#F59E0B' }}>{i + 1}.</span>
                <span style={{ fontSize: '9px', color: done ? '#34D399' : '#e2ddd5', textDecoration: done ? 'line-through' : 'none', opacity: done ? .5 : 1 }}>{m.task}</span>
                {done && <span style={{ fontSize: '8px' }}>✅</span>}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ width: '230px', minWidth: '230px', borderRight: '1px solid #21262d', minHeight: 'calc(100vh - 100px)', padding: '10px', display: 'flex', flexDirection: 'column' }}>

          {/* Capacity bar */}
          <CapacityBar boxes={boxes} onOpenBacklog={() => setShowBacklog(true)} />

          {/* Backlog button */}
          <button onClick={() => setShowBacklog(true)} style={{ width: '100%', marginBottom: '8px', padding: '5px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid #21262d', borderRadius: '6px', color: '#374151', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📦 Backlog</span>
            {backlog.length > 0 && <span style={{ background: '#F59E0B', color: '#0d1117', borderRadius: '20px', padding: '1px 6px', fontSize: '8px', fontWeight: 'bold' }}>{backlog.length}</span>}
          </button>

          <div style={{ fontSize: '8px', color: '#374151', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Sin programar ({unscheduled.length})</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {unscheduled.length === 0 && <div style={{ fontSize: '9px', color: '#374151', textAlign: 'center', padding: '8px' }}>Todo programado ✨</div>}
            {unscheduled.map(box => {
              const cat = CATS[box.category]
              return (
                <div key={box.id} draggable onDragStart={() => setDragBox(box.id)} onDragEnd={() => setDragBox(null)}
                  style={{ background: '#161b22', border: `1px solid ${dragBox === box.id ? cat.color : '#21262d'}`, borderLeft: `3px solid ${cat.color}`, borderRadius: '6px', padding: '7px 9px', marginBottom: '5px', cursor: 'grab', userSelect: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>{box.isMIT ? '⭐ ' : ''}{box.task}</div>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <span style={{ fontSize: '8px', background: cat.bg, color: cat.color, padding: '1px 4px', borderRadius: '20px' }}>{cat.icon} {cat.label}</span>
                        <span style={{ fontSize: '8px', color: '#374151' }}>⏱ {box.minutes}m</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <button onClick={() => moveToBacklog(box.id)} title="Mover al backlog" style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '10px' }}>📦</button>
                      <button onClick={() => deleteBox(box.id)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                    </div>
                  </div>
                  <select onChange={e => updateStart(box.id, e.target.value === '' ? null : parseFloat(e.target.value))} value={box.startHour ?? ''}
                    style={{ width: '100%', marginTop: '5px', background: '#0d1117', border: '1px solid #21262d', color: '#6b7280', borderRadius: '4px', padding: '2px 4px', fontSize: '9px', cursor: 'pointer' }}>
                    <option value="">-- asignar hora --</option>
                    {HOURS.map(h => [0, .25, .5, .75].map(m => <option key={`${h}-${m}`} value={h + m}>{String(h > 12 ? h - 12 : h).padStart(2, '0')}:{String(m * 60).padStart(2, '0')} {h >= 12 ? 'PM' : 'AM'}</option>))}
                  </select>
                </div>
              )
            })}
          </div>

          {/* AI + Export */}
          <div style={{ borderTop: '1px solid #21262d', marginTop: '8px', paddingTop: '8px' }}>
            <div style={{ fontSize: '8px', color: '#374151', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>IA + Exportar</div>
            {[['schedule', '🗓 IA programa mi día', 'rgba(52,211,153,0.07)', '#34D399', 'rgba(52,211,153,0.18)'], ['summary', '🤖 Resumen del día', 'rgba(245,158,11,0.07)', '#F59E0B', 'rgba(245,158,11,0.18)']].map(([mode, label, bg, color, border]) => (
              <button key={mode} onClick={() => callAI(mode)} disabled={loadingAI || boxes.length === 0}
                style={{ width: '100%', marginBottom: '4px', padding: '6px 9px', background: bg, color, border: `1px solid ${border}`, borderRadius: '6px', cursor: loadingAI || boxes.length === 0 ? 'not-allowed' : 'pointer', fontSize: '9px', fontWeight: 'bold', textAlign: 'left' }}>
                {loadingAI && aiMode === mode ? '⏳ ...' : label}
              </button>
            ))}
            <button onClick={doExport} disabled={boxes.length === 0}
              style={{ width: '100%', marginBottom: '5px', padding: '6px 9px', background: 'rgba(96,165,250,0.07)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.18)', borderRadius: '6px', cursor: boxes.length === 0 ? 'not-allowed' : 'pointer', fontSize: '9px', fontWeight: 'bold', textAlign: 'left' }}>
              📄 Exportar → Google Docs
            </button>
            {exportMsg === 'ok' && <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '5px', padding: '7px', fontSize: '9px', color: '#34D399', lineHeight: 1.6, marginBottom: '4px' }}>✅ Descargado.<br />En Drive: arrastra → <b>Abrir con Docs</b></div>}
            {exportMsg === 'tab' && <div style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '5px', padding: '7px', fontSize: '9px', color: '#60A5FA', lineHeight: 1.6, marginBottom: '4px' }}>📄 Nueva pestaña. Ctrl+S para guardar.</div>}
            {aiSummary && (
              <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '6px', padding: '8px', fontSize: '9px', lineHeight: 1.7, color: '#c9b99a', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                <div style={{ fontSize: '7px', color: '#F59E0B', marginBottom: '3px', fontWeight: 'bold', letterSpacing: '1px' }}>🤖 IA</div>
                {aiSummary}
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN VIEW ── */}
        <div style={{ flex: 1, padding: '11px 14px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>

          {/* TIMELINE */}
          {view === 'timeline' && (
            <div>
              <div style={{ fontSize: '9px', color: '#374151', marginBottom: '9px' }}>
                {scheduled.length} timeboxes · arrastra tareas del panel izquierdo
              </div>
              <div ref={timelineRef} style={{ position: 'relative' }} onDragOver={e => e.preventDefault()} onDrop={onTimelineDrop}>
                {HOURS.map(h => {
                  const isNow = Math.floor(nowHour()) === h, nowMin = nowHour() - Math.floor(nowHour())
                  return (
                    <div key={h} style={{ display: 'flex', minHeight: '58px', borderTop: `1px solid ${isNow ? 'rgba(245,158,11,0.3)' : '#161b22'}` }}>
                      <div style={{ width: '50px', minWidth: '50px', paddingTop: '3px', paddingRight: '6px', fontSize: '8px', color: isNow ? '#F59E0B' : '#21262d', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
                        {fmtHour(h)}{isNow && <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: '#F59E0B', marginLeft: '2px', boxShadow: '0 0 4px #F59E0B' }} />}
                      </div>
                      <div style={{ flex: 1, position: 'relative', minHeight: '58px', borderLeft: '1px solid #1e2536' }}>
                        {isNow && <div style={{ position: 'absolute', top: `${nowMin * 58}px`, left: 0, right: 0, height: '1px', background: '#F59E0B', zIndex: 10 }} />}
                        {scheduled.filter(b => b.startHour != null && Math.floor(b.startHour) === h).map(box => {
                          const cat = CATS[box.category], tp = (box.startHour - h) * 58, ht = Math.max((box.minutes / 60) * 58, 23)
                          const isAct = box.status === 'activo', pct = ((box.minutes * 60 - box.remaining) / (box.minutes * 60)) * 100
                          return (
                            <div key={box.id} style={{ position: 'absolute', top: tp, left: '2px', right: '3px', height: ht, background: cat.bg, border: `1px solid ${isAct ? cat.color : cat.color + '44'}`, borderLeft: `3px solid ${cat.color}`, borderRadius: '4px', padding: '2px 5px', overflow: 'hidden', zIndex: 2, boxShadow: isAct ? `0 0 9px ${cat.color}33` : 'none' }}>
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${cat.color}14`, transition: 'width 1s linear' }} />
                              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: cat.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: box.status === 'completado' ? 'line-through' : 'none' }}>
                                    {box.isMIT ? '⭐ ' : ''}{cat.icon} {box.task}
                                  </div>
                                  {ht > 32 && <div style={{ fontSize: '8px', color: '#374151' }}>{box.status === 'completado' ? '✅' : fmtTime(box.remaining)}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginLeft: '2px' }}>
                                  {box.status !== 'completado' && (isAct
                                    ? <button onClick={() => pauseTimer(box.id)} style={mb(cat.color)}>⏸</button>
                                    : <button onClick={() => startTimer(box.id)} style={mb(cat.color)}>▶</button>
                                  )}
                                  <button onClick={() => { setEditNote(box.id); setNoteText(box.note) }} style={mb('#A78BFA')}>📝</button>
                                  <button onClick={() => deleteBox(box.id)} style={mb('#f87171')}>✕</button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* LIST */}
          {view === 'list' && (
            <div>
              {boxes.length === 0 && <div style={{ textAlign: 'center', padding: '50px', color: '#374151' }}><div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>Agrega tareas con +</div>}
              {['Alta', 'Normal', 'Baja'].map(pri => {
                const group = boxes.filter(b => b.priority === pri)
                if (!group.length) return null
                return (
                  <div key={pri} style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '8px', color: '#374151', letterSpacing: '1px', marginBottom: '5px', textTransform: 'uppercase' }}>{pri === 'Alta' ? '🔴' : pri === 'Normal' ? '🟡' : '🟢'} {pri}</div>
                    {group.map(box => {
                      const cat = CATS[box.category], isAct = box.status === 'activo', pct = ((box.minutes * 60 - box.remaining) / (box.minutes * 60)) * 100
                      return (
                        <div key={box.id} style={{ background: '#161b22', border: `1px solid ${isAct ? cat.color : '#21262d'}`, borderLeft: `3px solid ${box.isMIT ? '#F59E0B' : cat.color}`, borderRadius: '7px', padding: '10px 13px', marginBottom: '5px', position: 'relative', overflow: 'hidden', boxShadow: isAct ? `0 0 12px ${cat.color}18` : 'none' }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', width: `${pct}%`, background: cat.color, transition: 'width 1s linear' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '27px', height: '27px', borderRadius: '6px', background: cat.bg, border: `1.5px solid ${cat.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{box.status === 'completado' ? '✅' : isAct ? '⏱' : cat.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '11px', textDecoration: box.status === 'completado' ? 'line-through' : 'none', opacity: box.status === 'completado' ? .4 : 1 }}>
                                {box.isMIT && <span style={{ color: '#F59E0B', fontSize: '9px' }}>⭐ </span>}{box.task}
                              </div>
                              <div style={{ display: 'flex', gap: '3px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '8px', background: cat.bg, color: cat.color, padding: '1px 4px', borderRadius: '20px' }}>{cat.label}</span>
                                {box.startHour != null && <span style={{ fontSize: '8px', color: '#374151' }}>🕐 {fmtHour(box.startHour)}</span>}
                                {box.note && <span style={{ fontSize: '8px', color: '#374151', fontStyle: 'italic' }}>📝 {box.note.slice(0, 22)}</span>}
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Courier New',monospace", fontSize: '14px', fontWeight: 'bold', color: isAct ? cat.color : box.status === 'completado' ? '#34D399' : '#e2ddd5', minWidth: '54px', textAlign: 'center' }}>
                              {box.status === 'completado' ? '✓' : fmtTime(box.remaining)}
                            </div>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              {box.status !== 'completado' && (isAct
                                ? <button onClick={() => pauseTimer(box.id)} style={ab('#F59E0B')}>⏸</button>
                                : <button onClick={() => startTimer(box.id)} style={ab('#34D399')}>▶</button>
                              )}
                              {box.status !== 'completado' && <button onClick={() => doneBox(box.id)} style={ab('#60A5FA')}>✓</button>}
                              <button onClick={() => { setEditNote(box.id); setNoteText(box.note) }} style={ab('#A78BFA')}>📝</button>
                              <button onClick={() => moveToBacklog(box.id)} title="Mover al backlog" style={ab('#F59E0B')}>📦</button>
                              <button onClick={() => deleteBox(box.id)} style={ab('#f87171')}>✕</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD MODAL ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#161b22', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '390px', color: '#e2ddd5', fontFamily: 'Georgia,serif' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 15px', fontSize: '13px', color: '#F59E0B', letterSpacing: '2px' }}>⏳ NUEVA TAREA</h2>
            <div style={lbl}>Tarea</div>
            <input autoFocus value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addBox()} placeholder="¿Qué vas a hacer?" style={inp} />
            <div style={lbl}>Duración</div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '11px', flexWrap: 'wrap' }}>
              {[15, 25, 30, 45, 60, 90].map(m => <button key={m} onClick={() => setForm(f => ({ ...f, minutes: m }))} style={{ padding: '5px 8px', background: form.minutes === m ? '#F59E0B' : 'rgba(255,255,255,0.04)', color: form.minutes === m ? '#0d1117' : '#374151', border: `1px solid ${form.minutes === m ? '#F59E0B' : '#21262d'}`, borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: form.minutes === m ? 'bold' : 'normal' }}>{m}m</button>)}
            </div>
            <div style={lbl}>Hora</div>
            <select value={form.startHour ?? ''} onChange={e => setForm(f => ({ ...f, startHour: e.target.value === '' ? null : parseFloat(e.target.value) }))} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Sin asignar</option>
              {HOURS.map(h => [0, .25, .5, .75].map(m => <option key={`${h}-${m}`} value={h + m}>{String(h > 12 ? h - 12 : h).padStart(2, '0')}:{String(m * 60).padStart(2, '0')} {h >= 12 ? 'PM' : 'AM'}</option>))}
            </select>
            <div style={lbl}>Categoría</div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '11px', flexWrap: 'wrap' }}>
              {CATS.map((cat, i) => <button key={i} onClick={() => setForm(f => ({ ...f, category: i }))} style={{ padding: '4px 8px', background: form.category === i ? cat.bg : 'rgba(255,255,255,0.03)', color: form.category === i ? cat.color : '#374151', border: `1px solid ${form.category === i ? cat.color + '55' : '#21262d'}`, borderRadius: '20px', cursor: 'pointer', fontSize: '10px' }}>{cat.icon} {cat.label}</button>)}
            </div>
            <div style={lbl}>Prioridad</div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {['Alta', 'Normal', 'Baja'].map(p => <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{ flex: 1, padding: '6px', background: form.priority === p ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', color: form.priority === p ? '#F59E0B' : '#374151', border: `1px solid ${form.priority === p ? 'rgba(245,158,11,0.28)' : '#21262d'}`, borderRadius: '5px', cursor: 'pointer', fontSize: '10px' }}>{p}</button>)}
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', background: 'transparent', color: '#374151', border: '1px solid #21262d', borderRadius: '7px', cursor: 'pointer', fontSize: '11px' }}>Cancelar</button>
              <button onClick={addBox} disabled={!form.task.trim()} style={{ flex: 2, padding: '9px', background: form.task.trim() ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'rgba(245,158,11,0.1)', color: '#0d1117', border: 'none', borderRadius: '7px', cursor: form.task.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px' }}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTE MODAL ── */}
      {editNote !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }} onClick={() => setEditNote(null)}>
          <div style={{ background: '#161b22', border: '1px solid rgba(167,139,250,0.22)', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '320px', fontFamily: 'Georgia,serif', color: '#e2ddd5' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', color: '#A78BFA', fontSize: '12px' }}>📝 Nota</h3>
            <textarea autoFocus value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Obstáculo, aprendizaje, comentario..."
              style={{ ...inp, height: '80px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '7px' }}>
              <button onClick={() => setEditNote(null)} style={{ flex: 1, padding: '8px', background: 'transparent', color: '#374151', border: '1px solid #21262d', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveNote} style={{ flex: 2, padding: '8px', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
