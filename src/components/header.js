export function renderHeader() {
  return `
    <header id="site-header">
      <div class="logo" id="logo">YES<em>ITS</em>PONZI</div>
      <div class="hdr-right">
        <div class="badge badge-pre" id="hdr-badge">⬤ &nbsp;PRE-LAUNCH</div>
        <div id="hdr-timer"></div>
      </div>
    </header>
  `
}

export function setBadge(type) {
  const el = document.getElementById('hdr-badge')
  if (!el) return
  if (type === 'pre')  { el.className = 'badge badge-pre';  el.textContent = '⬤  PRE-LAUNCH' }
  if (type === 'live') { el.className = 'badge badge-live'; el.textContent = '⬤  ROUND 1 LIVE' }
  if (type === 'done') { el.className = 'badge badge-done'; el.textContent = '⬤  ROUND 1 TERMINÉ' }
}
