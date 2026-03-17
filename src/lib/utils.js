// ── HTML escape ──────────────────────────────────────────────
export function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── Zero-pad number ──────────────────────────────────────────
export function pad(n) {
  return String(Math.max(0, n)).padStart(2, '0')
}

// ── Relative time ────────────────────────────────────────────
export function ago(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = (Date.now() - d) / 1000
  if (diff < 60)    return "à l'instant"
  if (diff < 3600)  return Math.floor(diff / 60) + 'min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return Math.floor(diff / 86400) + 'j'
}

// ── Clipboard ────────────────────────────────────────────────
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    return true
  }
}

// ── Share helpers ────────────────────────────────────────────
export function shareX(text, url) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
}

export function shareWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

// ── Toast ────────────────────────────────────────────────────
let toastTimer
export function toast(msg, duration = 2500) {
  let el = document.getElementById('toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), duration)
}

// ── Countdown delta ──────────────────────────────────────────
export function countdownParts(target) {
  const diff = Math.max(0, target - Date.now())
  return {
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000) / 60000),
    secs:  Math.floor((diff % 60000) / 1000),
    total: diff,
  }
}
