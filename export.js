const IDX_KEY     = 'timebox:index'
const BACKLOG_KEY = 'timebox:backlog'
const dayKey      = (d) => `timebox:day:${d}`
const mitKey      = (d) => `timebox:mit:${d}`
const replanKey   = (d) => `timebox:replan:${d}`

// ── Index ──────────────────────────────────────────────────────────────────
export function getIndex() {
  try { return JSON.parse(localStorage.getItem(IDX_KEY) || '[]') } catch { return [] }
}

function addToIndex(date) {
  const idx = getIndex()
  if (!idx.includes(date)) {
    idx.push(date)
    idx.sort().reverse()
    localStorage.setItem(IDX_KEY, JSON.stringify(idx))
  }
}

// ── Day ────────────────────────────────────────────────────────────────────
export function loadDay(date) {
  try {
    const v = localStorage.getItem(dayKey(date))
    return v ? JSON.parse(v) : null
  } catch { return null }
}

export function saveDay(date, data) {
  try {
    localStorage.setItem(dayKey(date), JSON.stringify(data))
    addToIndex(date)
  } catch (e) { console.error('Storage full?', e) }
}

// ── MIT flag ───────────────────────────────────────────────────────────────
export function isMITDone(date) { return !!localStorage.getItem(mitKey(date)) }
export function markMITDone(date) { localStorage.setItem(mitKey(date), '1') }

// ── Replan flag ────────────────────────────────────────────────────────────
export function isReplanShown(date) { return !!localStorage.getItem(replanKey(date)) }
export function markReplanShown(date) { localStorage.setItem(replanKey(date), '1') }

// ── Backlog ────────────────────────────────────────────────────────────────
export function loadBacklog() {
  try { return JSON.parse(localStorage.getItem(BACKLOG_KEY) || '[]') } catch { return [] }
}

export function saveBacklog(tasks) {
  try { localStorage.setItem(BACKLOG_KEY, JSON.stringify(tasks)) } catch {}
}
