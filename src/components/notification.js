let _timer = null

export function showNotif(label, text, duration = 4500) {
  let el = document.getElementById('notif')
  if (!el) return
  document.getElementById('notif-label').textContent = label
  document.getElementById('notif-text').textContent  = text
  el.classList.add('show')
  clearTimeout(_timer)
  _timer = setTimeout(() => el.classList.remove('show'), duration)
}

export function renderNotif() {
  return `
    <div id="notif">
      <div id="notif-label" class="notif-label">🔺 nouveau membre</div>
      <div id="notif-text" class="notif-text">—</div>
    </div>
  `
}
