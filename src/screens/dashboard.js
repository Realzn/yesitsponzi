import { Messages } from '../lib/supabase.js'
import { store } from '../lib/store.js'
import { esc, ago, copy, shareX, shareWhatsApp, toast, pad } from '../lib/utils.js'
import { BASE_URL } from '../lib/config.js'
import { startTimer, urgencyMessage } from '../components/timer.js'
import { showNotif } from '../components/notification.js'

let activeTab = 'members'
let unreadChat = 0
let unreadMembers = 0

export function renderDashboard() {
  return `
    <div id="screen-dashboard" class="screen active">
      <div class="dash-side">
        <div class="ds-profile">
          <div class="ds-ava" id="ds-ava">🔺</div>
          <div class="ds-pname" id="ds-pname">—</div>
          <div class="ds-ppromo" id="ds-ppromo">—</div>
          <div class="ds-big" id="ds-cnt">0</div>
          <div class="ds-big-l">membres</div>
          <div class="ds-new-badge" id="ds-new" style="display:none">+1 nouveau membre !</div>
        </div>

        <nav class="dash-nav">
          <div class="dn-item on" data-tab="members">
            👥 &nbsp;Membres
            <span class="dn-badge" id="badge-members" style="display:none">0</span>
          </div>
          <div class="dn-item" data-tab="chat">
            💬 &nbsp;Chat
            <span class="dn-badge" id="badge-chat" style="display:none">0</span>
          </div>
          <div class="dn-item" data-tab="stats">📊 &nbsp;Classement</div>
        </nav>

        <div class="dash-ref">
          <div class="dr-label">ton lien de recrutement</div>
          <div class="dr-box" id="dr-box">chargement...</div>
          <div class="dr-btns">
            <div class="drb" id="btn-copy">Copier</div>
            <div class="drb" id="btn-x">X/Twitter</div>
            <div class="drb" id="btn-wa">WhatsApp</div>
          </div>
        </div>
      </div>

      <div class="dash-main">
        <!-- Members tab -->
        <div class="dtab on" id="tab-members">
          <div class="members-area">
            <div class="ma-head">
              <div class="ma-title">membres de ta pyramide</div>
              <div class="ma-cnt" id="ma-cnt">0 membre</div>
            </div>
            <div id="members-inner">
              <div class="no-members">
                T'as 0 membres.<br>
                Envoie ton lien. <strong>Maintenant.</strong><br>
                <span style="color:#1a1a1a">Le timer tourne pas pour toi.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat tab -->
        <div class="dtab" id="tab-chat">
          <div class="chat-wrap">
            <div class="chat-feed" id="chat-feed">
              <div class="chat-empty">Personne a encore parlé. Lance la conv.</div>
            </div>
            <div class="chat-bar">
              <input class="chat-in" id="chat-in" placeholder="Parle à ta pyramide..." maxlength="280">
              <button class="chat-go" id="chat-send">→</button>
            </div>
          </div>
        </div>

        <!-- Stats tab -->
        <div class="dtab" id="tab-stats">
          <div class="stats-area">
            <div class="stat-card">
              <div class="sc-label">ta position</div>
              <div class="sc-val" id="sc-rank">#—</div>
              <div class="sc-sub" id="sc-gap">—</div>
            </div>
            <div class="stat-card">
              <div class="sc-label">pyramide en tête</div>
              <div class="sc-val" id="sc-leader">—</div>
              <div class="sc-sub" id="sc-leader-sub">—</div>
            </div>
            <div class="stat-card">
              <div class="sc-label">top classement</div>
              <div id="sc-lb"></div>
              <p class="caveat">Tu vois les rangs. Pas les noms des autres. Recrute à l'aveugle.</p>
            </div>
            <!-- Live timer in dashboard -->
            <div class="stat-card">
              <div class="sc-label">⏱ fin du round</div>
              <div class="sc-val danger" id="dash-timer">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initDashboard() {
  const p = store.state.myPyramid
  if (!p) return

  // Populate static profile
  document.getElementById('ds-ava').textContent   = p.emoji || '🔺'
  document.getElementById('ds-pname').textContent = p.name || p.pseudo
  document.getElementById('ds-ppromo').textContent = p.promo || ''

  const refUrl = `${BASE_URL}?ref=${p.id}`
  document.getElementById('dr-box').textContent = refUrl

  // Share buttons
  document.getElementById('btn-copy').addEventListener('click', async () => {
    await copy(refUrl)
    toast('Lien copié 🔺')
  })
  document.getElementById('btn-x').addEventListener('click', () =>
    shareX('Rejoins ma pyramide sur YESITSPONZI 🔺 Le winner prend tout le site. #yesitsponzi', refUrl)
  )
  document.getElementById('btn-wa').addEventListener('click', () =>
    shareWhatsApp(`🔺 Rejoins ma pyramide sur YESITSPONZI — le site appartient à celui qui recrute le plus. Clique : ${refUrl}`)
  )

  // Tab nav
  document.querySelectorAll('.dn-item').forEach(el => {
    el.addEventListener('click', function () {
      switchTab(this.dataset.tab)
    })
  })

  // Chat
  document.getElementById('chat-send').addEventListener('click', sendMsg)
  document.getElementById('chat-in').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMsg()
  })

  // Store events
  store.on('members:update', () => { refreshDashboard(); })
  store.on('my:newmember', (m) => {
    showNotif('🔺 nouveau membre', `${m.emoji || '👤'} ${m.pseudo} vient de rejoindre ta pyramide !`)
    flashNewMember()
    if (activeTab !== 'members') {
      unreadMembers++
      const b = document.getElementById('badge-members')
      b.textContent = unreadMembers; b.style.display = 'inline-block'
    }
  })
  store.on('messages:update', (msg) => {
    if (msg.pyramid_id !== store.state.myPyramidId) return
    renderChat()
    if (activeTab !== 'chat') {
      unreadChat++
      const b = document.getElementById('badge-chat')
      b.textContent = unreadChat; b.style.display = 'inline-block'
    }
  })

  // Timer
  startTimer((phase, parts) => {
    if (phase === 'live' && parts) {
      document.getElementById('dash-timer').textContent =
        `${pad(parts.hours)}h ${pad(parts.mins)}m ${pad(parts.secs)}s`
    }
  })

  // Initial render
  refreshDashboard()
  renderChat()
}

function switchTab(name) {
  activeTab = name
  document.querySelectorAll('.dtab').forEach(t => t.classList.remove('on'))
  document.querySelectorAll('.dn-item').forEach(t => t.classList.remove('on'))
  document.getElementById('tab-' + name).classList.add('on')
  document.querySelector(`[data-tab="${name}"]`).classList.add('on')

  if (name === 'members') {
    unreadMembers = 0
    const b = document.getElementById('badge-members')
    b.textContent = '0'; b.style.display = 'none'
  }
  if (name === 'chat') {
    unreadChat = 0
    const b = document.getElementById('badge-chat')
    b.textContent = '0'; b.style.display = 'none'
    renderChat()
  }
  if (name === 'stats') renderStats()
}

function refreshDashboard() {
  const cnt = store.state.memberCounts[store.state.myPyramidId] || 0
  document.getElementById('ds-cnt').textContent = cnt
  document.getElementById('ma-cnt').textContent = cnt + ' membre' + (cnt !== 1 ? 's' : '')
  renderMemberList()
  if (activeTab === 'stats') renderStats()
}

function flashNewMember() {
  const el = document.getElementById('ds-new')
  el.style.display = 'block'
  setTimeout(() => { el.style.display = 'none' }, 3500)
}

function renderMemberList() {
  const members = store.getMyMembers()
  const el = document.getElementById('members-inner')
  if (!members.length) {
    el.innerHTML = '<div class="no-members">T\'as 0 membres.<br>Envoie ton lien. <strong>Maintenant.</strong></div>'
    return
  }
  el.innerHTML = members.map(m => `
    <div class="member-row">
      <div class="mr-ava">${m.emoji || '👤'}</div>
      <div>
        <div class="mr-name">${esc(m.pseudo)}</div>
        ${m.promo ? `<div class="mr-promo">${esc(m.promo)}</div>` : ''}
        ${m.link ? `<div class="mr-link"><a href="${esc(m.link)}" target="_blank" rel="noopener">${esc(m.link)}</a></div>` : ''}
      </div>
      <div class="mr-when">${ago(m.joined_at)}</div>
    </div>
  `).join('')
}

function renderChat() {
  const msgs = store.getMyMessages()
  const el = document.getElementById('chat-feed')
  if (!msgs.length) {
    el.innerHTML = '<div class="chat-empty">Personne a encore parlé. Lance la conv.</div>'
    return
  }
  const wasBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 80
  el.innerHTML = msgs.map(m => {
    const mine = store.state.myPyramid?.pseudo === m.pseudo
    return `
      <div class="chat-bubble ${mine ? 'mine' : ''}">
        <div class="cb-meta"><strong>${esc(m.pseudo)}</strong> · ${ago(m.created_at)}</div>
        <div class="cb-body">${esc(m.body)}</div>
      </div>
    `
  }).join('')
  if (wasBottom) el.scrollTop = el.scrollHeight
}

async function sendMsg() {
  const inp = document.getElementById('chat-in')
  const body = inp.value.trim()
  if (!body || !store.state.myPyramidId || !store.state.myPyramid) return
  inp.value = ''
  const { error } = await Messages.create({
    pyramid_id: store.state.myPyramidId,
    pseudo: store.state.myPyramid.pseudo,
    body,
  })
  if (error) toast('Erreur envoi')
}

function renderStats() {
  const sorted = store.getSorted()
  const idx = sorted.findIndex(p => p.id === store.state.myPyramidId)
  const pos = idx + 1
  const cnt = store.state.memberCounts[store.state.myPyramidId] || 0
  const isFirst = idx === 0
  const gap = !isFirst ? ((store.state.memberCounts[sorted[idx - 1]?.id] || 0) - cnt) : 0

  document.getElementById('sc-rank').textContent = '#' + pos
  document.getElementById('sc-rank').className = 'sc-val' + (isFirst ? '' : ' danger')
  document.getElementById('sc-gap').textContent = isFirst
    ? 'Tu mènes. Lâche pas un seul membre.'
    : `Il manque ${gap} membre${gap !== 1 ? 's' : ''} pour prendre la tête.`

  const leader = store.getLeader()
  if (leader) {
    document.getElementById('sc-leader').textContent = (store.state.memberCounts[leader.id] || 0) + ' membres'
    document.getElementById('sc-leader-sub').innerHTML = leader.id === store.state.myPyramidId
      ? '<strong>C\'est toi.</strong>'
      : "C'est pas toi. Encore."
  }

  document.getElementById('sc-lb').innerHTML = sorted.slice(0, 10).map((p, i) => {
    const isme = p.id === store.state.myPyramidId
    return `
      <div class="lb-row">
        <div class="lb-pos">${i === 0 ? '👑' : '#' + (i + 1)}</div>
        <div class="lb-name ${isme ? 'me' : ''}">${isme ? '▶ TOI' : 'PYRAMIDE ' + (i + 1)}</div>
        <div class="lb-cnt ${isme ? 'me' : ''}">${store.state.memberCounts[p.id] || 0} mbr</div>
      </div>
    `
  }).join('')
}
