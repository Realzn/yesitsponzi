import { esc } from '../lib/utils.js'

/**
 * Renders the winner pyramid.
 * allBlocks[0] = creator, rest = members in join order.
 */
export function renderPyramidViz(allBlocks, onBlockClick) {
  const container = document.getElementById('pyr-viz')
  if (!container) return
  container.innerHTML = ''

  const MAX_ROWS = 7
  const screenW = Math.min(window.innerWidth * 0.92, 900)
  let bi = 0

  for (let row = 0; row < MAX_ROWS; row++) {
    const size  = Math.pow(2, row)
    const bSize = Math.max(24, Math.min(72, Math.floor((screenW) / size) - 5))
    const fontSize = Math.max(10, Math.floor(bSize * 0.42))

    const rowDiv = document.createElement('div')
    rowDiv.className = 'pyr-row'

    for (let col = 0; col < size; col++) {
      const div = document.createElement('div')
      div.className = 'pyr-block'
      div.style.cssText = `width:${bSize}px;height:${bSize}px;font-size:${fontSize}px`

      const block = allBlocks[bi]
      if (block) {
        div.classList.add(bi === 0 ? 'creator' : 'filled')
        div.textContent = block.emoji || (bi === 0 ? '👑' : '👤')
        div.title = block.pseudo || ''
        const b = block
        const r = row
        div.addEventListener('click', () => onBlockClick(b, r))
        bi++
      } else {
        div.classList.add('empty')
        div.textContent = '·'
      }
      rowDiv.appendChild(div)
    }

    container.appendChild(rowDiv)
    // Stop rendering empty rows after all blocks placed + min 3 rows
    if (bi >= allBlocks.length && row >= 2) break
  }

  return bi // blocks placed
}

export function renderMemberPopup(block, row) {
  document.getElementById('mp-ava').textContent   = block.emoji || '👤'
  document.getElementById('mp-lvl').textContent   = `NIVEAU ${row + 1}${row === 0 ? ' — 👑 CRÉATEUR' : ''}`
  document.getElementById('mp-pseudo').textContent = block.pseudo || '—'
  document.getElementById('mp-promo').textContent  = block.promo  || 'Rien à promouvoir. Respect quand même.'

  const lkEl = document.getElementById('mp-link')
  lkEl.innerHTML = block.link
    ? `<a href="${esc(block.link)}" target="_blank" rel="noopener">${esc(block.link)}</a>`
    : ''

  const ts = block.joined_at || block.created_at
  document.getElementById('mp-when').textContent = ts
    ? 'Rejoint ' + new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''

  document.getElementById('mpopup').classList.add('open')
}
