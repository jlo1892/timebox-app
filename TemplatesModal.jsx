export const TODAY = new Date().toISOString().slice(0, 10)

export const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export const fmtHour = (h) => {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh > 12 ? hh - 12 : hh || 12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`
}

export const todayStr = () =>
  new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

export const dateLabel = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

export const nowHour = () => new Date().getHours() + new Date().getMinutes() / 60

export const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días ☀️' : h < 18 ? 'Buenas tardes 🌤' : 'Buenas noches 🌙'
}

export const getWeekDates = () => {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}
