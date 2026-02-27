import { CATS } from '../data/categories.js'
import { loadDay } from './storage.js'
import { getWeekDates, dateLabel } from './dateHelpers.js'

// ── Capacity ───────────────────────────────────────────────────────────────
const TOTAL_MINUTES   = 15 * 60          // 7am–10pm = 900 min
const MAX_LOAD_PCT    = 0.80             // plan max 80%
const BUFFER_PER_TASK = 10              // 10 min buffer each task
export const MAX_REALISTIC = TOTAL_MINUTES * MAX_LOAD_PCT  // 720 min

export function calcCapacity(boxes) {
  const taskMins   = boxes.reduce((a, b) => a + b.minutes, 0)
  const bufferMins = boxes.length * BUFFER_PER_TASK
  const total      = taskMins + bufferMins
  const pct        = Math.round((total / TOTAL_MINUTES) * 100)
  const overBy     = total - MAX_REALISTIC
  const overflow   = overBy > 0

  // How many tasks to move to fix it
  const tasksToMove = overflow
    ? Math.ceil(overBy / 30)   // rough avg 30min per task
    : 0

  return { total, pct, overflow, overBy: Math.round(overBy), tasksToMove }
}

// ── Replan at 16:00 ────────────────────────────────────────────────────────
export function buildReplan(boxes, nowH) {
  const remaining   = (22 - nowH) * 60                        // minutes left today
  const realistic   = remaining * 0.8                          // 80% usable
  const pending     = boxes.filter(b => b.status !== 'completado')
    .sort((a, b) => {
      const priVal = { Alta: 0, Normal: 1, Baja: 2 }
      if (a.isMIT !== b.isMIT) return a.isMIT ? -1 : 1
      return priVal[a.priority] - priVal[b.priority]
    })

  let cumulative = 0
  const fits    = []
  const movable = []

  for (const t of pending) {
    const need = t.minutes + BUFFER_PER_TASK
    if (cumulative + need <= realistic) {
      fits.push(t)
      cumulative += need
    } else {
      movable.push(t)
    }
  }

  return { fits, movable, remaining: Math.round(remaining), realistic: Math.round(realistic) }
}

// ── Weekly summary ─────────────────────────────────────────────────────────
export function buildWeeklySummary() {
  const dates = getWeekDates()
  const rows  = []
  let totalMinsAll = 0
  let totalDoneAll = 0
  let totalMITsAll = 0
  let totalMITsDone = 0
  const catMins = new Array(CATS.length).fill(0)

  for (const date of dates) {
    const day   = loadDay(date)
    const boxes = day?.boxes || []
    const mits  = day?.mits  || []

    const done  = boxes.filter(b => b.status === 'completado')
    const mins  = done.reduce((a, b) => a + b.minutes, 0)
    const pct   = boxes.length ? Math.round((done.length / boxes.length) * 100) : 0
    const mitD  = mits.filter(m => boxes.find(b => b.id === m.id && b.status === 'completado')).length

    totalMinsAll += mins
    totalDoneAll += done.length
    totalMITsAll += mits.length
    totalMITsDone += mitD
    done.forEach(b => { catMins[b.category] = (catMins[b.category] || 0) + b.minutes })

    rows.push({ date, label: dateLabel(date), boxes: boxes.length, done: done.length, mins, pct, mits: mits.length, mitDone: mitD })
  }

  const bestDay      = rows.reduce((a, b) => b.pct > a.pct ? b : a, rows[0])
  const dominantCat  = catMins.indexOf(Math.max(...catMins))
  const mitPct       = totalMITsAll ? Math.round((totalMITsDone / totalMITsAll) * 100) : 0

  // Simple recommendation based on patterns
  let recommendation = ''
  if (mitPct < 50)       recommendation = 'Tus MITs tienen bajo cumplimiento. Reduce a 1–2 MITs por día para enfocarte mejor.'
  else if (mitPct >= 90) recommendation = '¡Excelente cumplimiento de MITs! Considera añadir una tarea de mejora continua diaria.'
  else if (totalMinsAll / 7 > 300) recommendation = 'Promedio alto de minutos enfocados. Asegúrate de incluir descanso real en tu día.'
  else if (totalMinsAll / 7 < 60)  recommendation = 'Pocos minutos registrados esta semana. ¿Empezaste a usar la app recientemente?'
  else recommendation = `Tu categoría dominante es ${CATS[dominantCat]?.label}. ¿Hay otras áreas que necesitan atención?`

  return { rows, totalMins: totalMinsAll, totalDone: totalDoneAll, mitPct, bestDay, dominantCat, recommendation }
}
