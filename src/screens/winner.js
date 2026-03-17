import { esc, ago } from '../lib/utils.js'
import { store } from '../lib/store.js'

export function renderWinnerScreen() {
  return `
    <div id="screen-winner" class="screen">

      <!-- Floating crown header -->
      <div class="mural-header">
        <div class="mural-eyebrow">👑 ROUND 1 — PYRAMIDE GAGNANTE</div>
        <div class="mural-title" id="mh-name">—</div>
        <div class="mural-sub" id="mh-promo">—</div>
        <div class="mural-meta">
          <span id="mh-cnt">0 membres</span>
          <span class="mm-sep">◆</span>
          <a id="mh-link" href="#" target="_blank" rel="noopener" style="display:none">→ voir le projet</a>
          <span class="mm-sep" id="mh-link-sep" style="display:none">◆</span>
          <span id="mh-round">72H DE GUERRE</span>
        </div>
      </div>

      <!-- THE MURAL — full pyramid wall -->
      <div id="mural-wall">
        <div id="mural-pyramid"></div>
      </div>

      <!-- HOF -->
      <div class="hof-section">
        <div class="hof-h">HALL OF <span>FAME</span></div>
        <div class="hof-grid" id="hof-grid"></div>
      </div>

      <footer class="site-footer">
        <span>YESITSPONZI © 2026</span>
        <span>ROUND 2 BIENTÔT</span>
        <span>ZÉRO ARGENT. 100% FIERTÉ.</span>
      </footer>
    </div>

    <!-- Block profile modal -->
    <div id="mpopup">
      <div class="mp-box">
        <button class="mp-x" id="mp-close">✕</button>
        <div class="mp-level-tag" id="mp-lvl-tag">NIVEAU —</div>
        <div class="mp-ava" id="mp-ava">👤</div>
        <div class="mp-pseudo" id="mp-pseudo">—</div>
        <div class="mp-promo-text" id="mp-promo">—</div>
        <a class="mp-link-btn" id="mp-link" href="#" target="_blank" rel="noopener" style="display:none">VOIR LE PROJET →</a>
        <div class="mp-joined" id="mp-when">—</div>
      </div>
    </div>
  `
}

export function initWinnerScreen() {
  const sorted = store.getSorted()
  if (!sorted.length) return

  const winner  = sorted[0]
  const members = store.state.members.filter(m => m.pyramid_id === winner.id)
  const cnt     = store.state.memberCounts[winner.id] || 0

  // Header
  document.getElementById('mh-name').textContent = winner.name || winner.pseudo || '—'
  document.getElementById('mh-promo').textContent = winner.promo || ''
  document.getElementById('mh-cnt').textContent = cnt + ' membre' + (cnt !== 1 ? 's' : '')

  if (winner.link) {
    const lk = document.getElementById('mh-link')
    lk.href = winner.link
    lk.style.display = 'inline'
    document.getElementById('mh-link-sep').style.display = 'inline'
  }

  // Build allBlocks: creator first, then members
  const allBlocks = [
    { ...winner, isCreator: true, level: 0 },
    ...members.map((m, i) => ({ ...m, isCreator: false, level: Math.floor(Math.log2(i + 2)) + 1 }))
  ]

  buildMural(allBlocks)

  // Hall of fame
  document.getElementById('hof-grid').innerHTML = `
    <div class="hof-tag">Round 1 — <strong>${esc(winner.name || winner.pseudo)}</strong> — ${cnt} membres</div>
  `

  // Modal close
  const popup = document.getElementById('mpopup')
  document.getElementById('mp-close').addEventListener('click', () => popup.classList.remove('open'))
  popup.addEventListener('click', e => { if (e.target === popup) popup.classList.remove('open') })
}

function buildMural(allBlocks) {
  const container = document.getElementById('mural-pyramid')
  container.innerHTML = ''

  // Compute rows needed
  const total = allBlocks.length
  let rows = 1
  while (Math.pow(2, rows) - 1 < total) rows++
  rows = Math.min(rows + 1, 8) // max 8 rows = 255 blocks

  let blockIdx = 0

  for (let row = 0; row < rows; row++) {
    const rowSize  = Math.pow(2, row)
    const rowEl    = document.createElement('div')
    rowEl.className = 'mural-row'
    rowEl.dataset.row = row

    for (let col = 0; col < rowSize; col++) {
      const block = allBlocks[blockIdx] || null
      const cell  = buildCell(block, row, blockIdx)
      rowEl.appendChild(cell)
      if (block) blockIdx++
    }

    container.appendChild(rowEl)
  }
}

function buildCell(block, row, idx) {
  const cell = document.createElement('div')

  if (!block) {
    cell.className = 'mural-cell empty'
    return cell
  }

  cell.className = 'mural-cell filled' + (block.isCreator ? ' creator' : '')
  cell.dataset.row = row

  // Inner content
  cell.innerHTML = `
    <div class="mc-inner">
      <div class="mc-emoji">${block.emoji || (block.isCreator ? '👑' : '👤')}</div>
      <div class="mc-name">${esc(truncate(block.pseudo || '', row > 3 ? 6 : 12))}</div>
      ${row <= 2 && block.promo ? `<div class="mc-promo">${esc(truncate(block.promo, 40))}</div>` : ''}
      ${row <= 1 && block.link  ? `<div class="mc-link-hint">→ lien</div>` : ''}
    </div>
    <div class="mc-level">N${row + 1}</div>
  `

  cell.addEventListener('click', () => openPopup(block, row))
  return cell
}

function openPopup(block, row) {
  document.getElementById('mp-lvl-tag').textContent = `NIVEAU ${row + 1}${block.isCreator ? ' — 👑 CRÉATEUR' : ''}`
  document.getElementById('mp-ava').textContent     = block.emoji || (block.isCreator ? '👑' : '👤')
  document.getElementById('mp-pseudo').textContent  = block.pseudo || '—'
  document.getElementById('mp-promo').textContent   = block.promo || 'Rien à promouvoir. Respect quand même.'

  const lkEl = document.getElementById('mp-link')
  if (block.link) {
    lkEl.href = block.link
    lkEl.style.display = 'block'
    lkEl.textContent   = block.link.replace(/^https?:\/\//, '')
  } else {
    lkEl.style.display = 'none'
  }

  const ts = block.joined_at || block.created_at
  document.getElementById('mp-when').textContent = ts
    ? 'Rejoint ' + ago(ts)
    : ''

  document.getElementById('mpopup').classList.add('open')
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str
}
