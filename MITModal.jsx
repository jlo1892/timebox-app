import { CATS } from '../data/categories.js'
import { fmtHour, todayStr, dateLabel } from './dateHelpers.js'

export function buildExportHTML(boxes, mits, aiSummary, date) {
  const label  = dateLabel(date)
  const done   = boxes.filter(b => b.status === 'completado')
  const mitIds = mits.map(m => m.id)
  const pct    = boxes.length ? Math.round(done.length / boxes.length * 100) : 0

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Timebox ${label}</title>
<style>body{font-family:Arial,sans-serif;max-width:750px;margin:0 auto;padding:32px;color:#1a1a2e;font-size:11pt;line-height:1.6}
h1{font-size:20pt;color:#B45309;border-bottom:3px solid #F59E0B;padding-bottom:8px;margin:0 0 8px}
h2{font-size:13pt;color:#1e3a5f;margin:20px 0 8px;border-left:4px solid #F59E0B;padding-left:10px}
table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:10pt}
th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left}
td{padding:7px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
tr:nth-child(even) td{background:#f9fafb}
.done{color:#059669;font-weight:bold}.pend{color:#D97706}
.mit{background:#fffbeb;border-left:4px solid #F59E0B;padding:10px 14px;margin:5px 0;border-radius:4px}
.ai{background:#f0fdf4;border-left:4px solid #16a34a;padding:14px;color:#14532d;border-radius:4px}
.stat{display:inline-block;padding:5px 12px;background:#f3f4f6;border-radius:6px;margin:2px 4px 2px 0}
footer{margin-top:30px;padding-top:10px;border-top:1px solid #eee;font-size:9pt;color:#9ca3af;text-align:center}
</style></head><body>
<h1>📦 Timebox – ${label}</h1>
<p style="color:#6b7280;font-size:10pt;margin-bottom:12px">${todayStr()}</p>
<p><span class="stat">✅ <b>${done.length}</b> completadas</span><span class="stat">📋 <b>${boxes.length}</b> total</span><span class="stat">⏱ <b>${done.reduce((a, b) => a + b.minutes, 0)} min</b></span><span class="stat">🎯 <b>${pct}%</b></span></p>
${mits.length ? `<h2>⭐ MITs del Día</h2>${mits.map((m, i) => { const b = boxes.find(x => x.id === m.id); const d = b?.status === 'completado'; return `<div class="mit"><b>${i + 1}. ${m.task}</b><span class="${d ? 'done' : 'pend'}" style="float:right">${d ? '✅ Completada' : '⏳ Pendiente'}</span><br><span style="font-size:9pt;color:#9ca3af">⏱ ${m.minutes} min</span></div>` }).join('')}` : ''}
<h2>📋 Tareas</h2>
<table><tr><th>Tarea</th><th>Hora</th><th>Categoría</th><th>Tiempo</th><th>Estado</th><th>Nota</th></tr>
${boxes.sort((a, b) => (a.startHour ?? 99) - (b.startHour ?? 99)).map(b => `<tr${mitIds.includes(b.id) ? ' style="background:#fffbeb"' : ''}><td><b>${b.task}</b>${mitIds.includes(b.id) ? ' ⭐' : ''}</td><td style="white-space:nowrap">${b.startHour != null ? fmtHour(b.startHour) : '—'}</td><td>${CATS[b.category].icon} ${CATS[b.category].label}</td><td>${b.minutes}m</td><td class="${b.status === 'completado' ? 'done' : 'pend'}">${b.status === 'completado' ? '✅ Listo' : '⏳ ' + b.status}</td><td style="font-size:9pt;color:#6b7280">${b.note || '—'}</td></tr>`).join('')}
</table>
${aiSummary ? `<h2>🤖 Análisis IA</h2><div class="ai">${aiSummary.replace(/\n/g, '<br>')}</div>` : ''}
<footer>Timebox App · ${new Date().toLocaleString('es-ES')}</footer>
</body></html>`
}

export function triggerDownload(html, filename) {
  try {
    const uri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
    const a = document.createElement('a')
    a.href = uri
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return 'ok'
  } catch {
    try {
      const w = window.open('', '_blank')
      w.document.write(html)
      w.document.close()
      return 'tab'
    } catch { return 'err' }
  }
}
