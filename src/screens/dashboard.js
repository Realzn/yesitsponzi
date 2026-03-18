import { sb, Messages, Applications, Members, Pyramids } from '../lib/supabase.js'
import { store } from '../lib/store.js'
import { esc, ago, copy, shareX, shareWhatsApp, toast, pad } from '../lib/utils.js'
import { BASE_URL, ROUND_END } from '../lib/config.js'
import { startTimer } from '../components/timer.js'
import { showNotif } from '../components/notification.js'

let activeSection = 'overview'
let unreadChat = 0
let unreadApps = 0

export function renderDashboard() {
  const p = store.state.myPyramid
  if (!p) return ''
  const ref = `${BASE_URL}?ref=${p.id}`

  return `
  <div id="screen-dashboard" class="screen active">

    <!-- ── SIDEBAR ────────────────────────────────── -->
    <aside class="dash-side" id="dash-side">
      <div class="ds-profile">
        <div class="ds-avatar-ring" id="ds-ava-ring">
          <span id="ds-ava">${p.emoji || '🔺'}</span>
        </div>
        <div class="ds-status">STATUT : <em>INITIÉ</em></div>
        <div class="ds-pname" id="ds-pname">${esc(p.name || p.pseudo)}</div>
        <div class="ds-ppromo" id="ds-ppromo">${esc(p.promo || '')}</div>
        <div class="ds-big" id="ds-cnt">0</div>
        <div class="ds-big-l">membres</div>
        <div class="ds-new-badge" id="ds-new">+1 nouveau membre</div>
      </div>

      <nav class="dash-nav">
        <div class="dn-item on" data-section="overview"  onclick="dashNav('overview',this)">
          <span class="dn-icon">⊞</span> Vue d'ensemble
        </div>
        <div class="dn-item" data-section="pyramid"   onclick="dashNav('pyramid',this)">
          <span class="dn-icon">🔺</span> Ma Pyramide
        </div>
        <div class="dn-item" data-section="listboard" onclick="dashNav('listboard',this)">
          <span class="dn-icon">𓃭</span> Listboard
        </div>
        <div class="dn-item" data-section="applications" onclick="dashNav('applications',this)">
          <span class="dn-icon">📨</span> Candidatures
          <span class="dn-badge" id="badge-apps">0</span>
        </div>
        <div class="dn-item" data-section="chat"      onclick="dashNav('chat',this)">
          <span class="dn-icon">💬</span> Messages
          <span class="dn-badge" id="badge-chat">0</span>
        </div>
      </nav>

      <div class="dash-ref">
        <div class="dr-label">𓂀 lien de parrainage</div>
        <div class="dr-box" id="dr-box" onclick="copyRefLink()">${ref}</div>
        <div class="dr-btns">
          <button class="drb" onclick="copyRefLink()">Copier</button>
          <button class="drb" onclick="shareRefX()">X</button>
          <button class="drb" onclick="shareRefWA()">WA</button>
        </div>
      </div>
    </aside>

    <!-- ── MAIN ────────────────────────────────────── -->
    <main class="dash-main" id="dash-main">

      <!-- ── VUE D'ENSEMBLE ───────────────────────── -->
      <div class="dsec active" id="dsec-overview">
        <div class="dsec-header">
          <div class="dsec-title">Vue d'ensemble</div>
          <div class="dsec-timer" id="dsec-timer">—</div>
        </div>

        <div class="overview-kpis" id="overview-kpis">
          <div class="kpi-card" id="kpi-members">
            <div class="kpi-label">Membres totaux</div>
            <div class="kpi-val" id="kpi-v-members">0</div>
            <div class="kpi-sub">dans ta pyramide</div>
          </div>
          <div class="kpi-card" id="kpi-rank">
            <div class="kpi-label">Rang actuel</div>
            <div class="kpi-val" id="kpi-v-rank">#—</div>
            <div class="kpi-sub" id="kpi-v-rank-sub">sur ${store.getSorted().length} pyramides</div>
          </div>
          <div class="kpi-card kpi-card--time">
            <div class="kpi-label">Temps restant</div>
            <div class="kpi-val kpi-val--time" id="kpi-v-time">—</div>
            <div class="kpi-sub">avant la fin du round</div>
          </div>
        </div>

        <!-- Progress bar vs leader -->
        <div class="overview-progress-section">
          <div class="ops-label">Progression vs leader</div>
          <div class="ops-bar-wrap">
            <div class="ops-bar">
              <div class="ops-fill" id="ops-fill" style="width:0%"></div>
              <div class="ops-fill ops-fill--leader" id="ops-leader-fill" style="width:100%"></div>
            </div>
            <div class="ops-labels">
              <span id="ops-me-label">Toi : 0</span>
              <span id="ops-leader-label">Leader : 0</span>
            </div>
          </div>
        </div>

        <!-- Recent members -->
        <div class="overview-recent">
          <div class="or-title">Derniers membres rejoints</div>
          <div id="recent-members-list">
            <div class="no-members">Aucun membre encore. Partage ton lien.</div>
          </div>
        </div>
      </div>

      <!-- ── MA PYRAMIDE ──────────────────────────── -->
      <div class="dsec" id="dsec-pyramid">
        <div class="dsec-header">
          <div class="dsec-title">Ma Pyramide</div>
          <button class="dsec-action-btn" onclick="copyRefLink()">+ Inviter</button>
        </div>

        <div class="pyramid-tree-wrap" id="pyramid-tree-wrap">
          <div class="pyr-tree-empty">Chargement de ta pyramide...</div>
        </div>
      </div>

      <!-- ── LISTBOARD ────────────────────────────── -->
      <div class="dsec" id="dsec-listboard">
        <div class="dsec-header">
          <div class="dsec-title">Listboard</div>
          <div class="lb-view-toggle">
            <button class="lvt-btn on" id="lvt-ranking" onclick="toggleLBView('ranking',this)">Classement</button>
            <button class="lvt-btn"   id="lvt-directory" onclick="toggleLBView('directory',this)">Annuaire</button>
          </div>
        </div>

        <div id="lb-ranking-view">
          <div class="lb-table-head">
            <span>#</span><span>Pyramide</span><span>Membres</span><span>Niveaux</span><span>Action</span>
          </div>
          <div id="lb-ranking-rows"></div>
        </div>

        <div id="lb-directory-view" style="display:none">
          <div class="lb-dir-grid" id="lb-dir-grid"></div>
        </div>
      </div>

      <!-- ── CANDIDATURES ─────────────────────────── -->
      <div class="dsec" id="dsec-applications">
        <div class="dsec-header">
          <div class="dsec-title">Candidatures reçues</div>
          <div class="dsec-sub">Personnes qui veulent rejoindre ta pyramide</div>
        </div>
        <div id="applications-list">
          <div class="no-apps">Aucune candidature en attente.</div>
        </div>

        <!-- My sent applications -->
        <div class="dsec-header" style="margin-top:2rem">
          <div class="dsec-title">Mes candidatures envoyées</div>
        </div>
        <div id="my-applications-list">
          <div class="no-apps">Aucune candidature envoyée.</div>
        </div>
      </div>

      <!-- ── MESSAGES ─────────────────────────────── -->
      <div class="dsec" id="dsec-chat">
        <div class="dsec-header">
          <div class="dsec-title">Messages — ${esc(p.name || p.pseudo)}</div>
        </div>
        <div class="chat-wrap">
          <div class="chat-feed" id="chat-feed">
            <div class="chat-empty">Sois le premier à parler à ta pyramide.</div>
          </div>
          <div class="chat-bar">
            <input class="chat-in" id="chat-in" placeholder="Envoie un message à ta pyramide..." maxlength="280">
            <button class="chat-go" id="chat-send">→</button>
          </div>
        </div>
      </div>

    </main>
  </div>

  <!-- ── APPLICATION MODAL ─────────────────────── -->
  <div id="apply-modal">
    <div class="apply-box">
      <button class="apply-close" onclick="closeApplyModal()">✕</button>
      <div class="apply-title">Candidater</div>
      <div class="apply-target" id="apply-target-name">—</div>
      <div class="apply-field">
        <label>Ton message (optionnel)</label>
        <textarea id="apply-msg" placeholder="Pourquoi tu veux rejoindre cette pyramide..." maxlength="140"></textarea>
        <div class="apply-char"><span id="apply-char-count">0</span>/140</div>
      </div>
      <button class="btn-seuil" id="apply-send-btn">ENVOYER MA CANDIDATURE 𓂀</button>
    </div>
  </div>
  `
}

// ── Init ─────────────────────────────────────────────────────
export function initDashboard() {
  const p = store.state.myPyramid
  if (!p) return

  populateSidebar()

  // Timer
  startTimer((phase, parts) => {
    if (!parts) return
    const t = document.getElementById('dsec-timer')
    const k = document.getElementById('kpi-v-time')
    const str = `${pad(parts.hours)}h ${pad(parts.mins)}m ${pad(parts.secs)}s`
    if (t) t.textContent = 'Fin dans ' + str
    if (k) k.textContent = str
  })

  // Chat
  document.getElementById('chat-send')?.addEventListener('click', sendMsg)
  document.getElementById('chat-in')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg() })
  document.getElementById('apply-msg')?.addEventListener('input', function () {
    const c = document.getElementById('apply-char-count')
    if (c) c.textContent = this.value.length
  })

  // Store events
  store.on('members:update', () => { refreshOverview(); renderPyramidTree(); renderListboard() })
  store.on('my:newmember',   m  => { showNotif('🔺 Nouveau membre', `${m.emoji || '👤'} ${m.pseudo} vient de rejoindre !`); flashBadge() })
  store.on('messages:update', msg => {
    if (msg.pyramid_id !== store.state.myPyramidId) return
    renderChat()
    if (activeSection !== 'chat') { unreadChat++; updateBadge('badge-chat', unreadChat) }
  })
  store.on('applications:update', app => {
    if (app.target_pyramid !== store.state.myPyramidId) return
    renderApplications()
    if (activeSection !== 'applications') { unreadApps++; updateBadge('badge-apps', unreadApps) }
  })

  refreshOverview()
  renderChat()
  renderPyramidTree()
  renderListboard()
  renderApplications()

  // Close modals on backdrop click
  document.getElementById('apply-modal')?.addEventListener('click', e => {
    if (e.target.id === 'apply-modal') closeApplyModal()
  })

  // Expose globals
  window.dashNav          = dashNav
  window.toggleLBView     = toggleLBView
  window.openApplyModal   = openApplyModal
  window.closeApplyModal  = closeApplyModal
  window.acceptApp        = acceptApp
  window.refuseApp        = refuseApp
  window.copyRefLink      = () => { copy(`${BASE_URL}?ref=${store.state.myPyramidId}`).then(() => toast('Lien copié 🔺')) }
  window.shareRefX        = () => shareX(`Rejoins ma pyramide sur YESITSPONZI 🔺 Le winner prend tout le site. #yesitsponzi`, `${BASE_URL}?ref=${store.state.myPyramidId}`)
  window.shareRefWA       = () => shareWhatsApp(`🔺 Rejoins ma pyramide YESITSPONZI → ${BASE_URL}?ref=${store.state.myPyramidId}`)
  window.kickMember       = kickMember
}

// ── Nav ──────────────────────────────────────────────────────
function dashNav(section, el) {
  activeSection = section
  document.querySelectorAll('.dsec').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.dn-item').forEach(i => i.classList.remove('on'))
  document.getElementById('dsec-' + section)?.classList.add('active')
  el?.classList.add('on')
  if (section === 'chat')         { unreadChat = 0; updateBadge('badge-chat', 0); renderChat() }
  if (section === 'applications') { unreadApps = 0; updateBadge('badge-apps', 0); renderApplications() }
  if (section === 'pyramid')      renderPyramidTree()
  if (section === 'listboard')    renderListboard()
  if (section === 'overview')     refreshOverview()
}

function updateBadge(id, count) {
  const b = document.getElementById(id)
  if (!b) return
  b.textContent = count
  b.style.display = count > 0 ? 'inline-block' : 'none'
}

function flashBadge() {
  const el = document.getElementById('ds-new')
  if (!el) return
  el.style.display = 'block'
  setTimeout(() => { el.style.display = 'none' }, 3500)
}

// ── Sidebar ──────────────────────────────────────────────────
function populateSidebar() {
  const p = store.state.myPyramid
  if (!p) return
  const ava = document.getElementById('ds-ava')
  if (ava) ava.textContent = p.emoji || '🔺'
}

// ── Overview ─────────────────────────────────────────────────
function refreshOverview() {
  const cnt    = store.state.memberCounts[store.state.myPyramidId] || 0
  const rank   = store.getMyRank()
  const sorted = store.getSorted()
  const leader = store.getLeader()
  const leaderCnt = leader ? (store.state.memberCounts[leader.id] || 0) : 0

  document.getElementById('ds-cnt')?.setAttribute('data-val', cnt)
  document.getElementById('ds-cnt').textContent    = cnt
  document.getElementById('kpi-v-members').textContent = cnt
  document.getElementById('kpi-v-rank').textContent    = '#' + rank
  document.getElementById('kpi-v-rank-sub').textContent = `sur ${sorted.length} pyramide${sorted.length !== 1 ? 's' : ''}`

  // Progress bar
  const myPct = leaderCnt > 0 ? Math.min(100, Math.round(cnt / leaderCnt * 100)) : 100
  document.getElementById('ops-fill')?.style.setProperty('width', myPct + '%')
  document.getElementById('ops-me-label').textContent = `Toi : ${cnt}`
  document.getElementById('ops-leader-label').textContent = `Leader : ${leaderCnt}`

  // Recent members
  const recent = store.getMyMembers().slice(-8).reverse()
  const el = document.getElementById('recent-members-list')
  if (!el) return
  if (!recent.length) { el.innerHTML = '<div class="no-members">Aucun membre encore. Partage ton lien.</div>'; return }
  el.innerHTML = recent.map(m => `
    <div class="recent-member-row">
      <span class="rmr-ava">${m.emoji || '👤'}</span>
      <span class="rmr-name">${esc(m.pseudo)}</span>
      <span class="rmr-promo">${esc(m.promo || '')}</span>
      <span class="rmr-when">${ago(m.joined_at)}</span>
    </div>
  `).join('')
}

// ── Pyramid Tree ──────────────────────────────────────────────
async function renderPyramidTree() {
  const wrap = document.getElementById('pyramid-tree-wrap')
  if (!wrap) return

  const { data: nodes, error } = await Members.getTree(store.state.myPyramidId)
  if (error || !nodes?.length) {
    wrap.innerHTML = '<div class="pyr-tree-empty">Ta pyramide est vide. Partage ton lien pour recruter.</div>'
    return
  }

  // Build adjacency map
  const map = {}
  nodes.forEach(n => { map[n.id] = { ...n, children: [] } })
  const roots = []
  nodes.forEach(n => {
    if (!n.parent_id) roots.push(map[n.id])
    else if (map[n.parent_id]) map[n.parent_id].children.push(map[n.id])
  })

  wrap.innerHTML = `<div class="pyr-tree">${roots.map(r => renderNode(r, true)).join('')}</div>`
}

function renderNode(node, isRoot = false) {
  const hasKids = node.children?.length > 0
  const isMe = store.state.myPyramid && node.user_id && node.user_id === store.state.myProfile?.id
  const canKick = store.state.myPyramid && !isRoot && !isMe

  return `
    <div class="pyr-node ${isRoot ? 'root-node' : ''} ${isMe ? 'my-node' : ''}">
      <div class="pyr-node-card" title="Clic pour profil" onclick="showNodePopup('${node.id}')">
        <span class="pnc-emoji">${node.avatar || node.emoji || '👤'}</span>
        <span class="pnc-name">${esc(node.user_pseudo || node.pseudo || '—')}</span>
        ${node.depth !== undefined ? `<span class="pnc-level">N${node.depth + 1}</span>` : ''}
        ${canKick ? `<button class="pnc-kick" onclick="event.stopPropagation();kickMember('${node.id}')" title="Retirer">✕</button>` : ''}
      </div>
      ${hasKids ? `<div class="pyr-children">${node.children.map(c => renderNode(c)).join('')}</div>` : ''}
    </div>
  `
}

window.showNodePopup = (nodeId) => {
  // Could open a mini profile popup — simplified here
  toast('Profil du membre (à venir)')
}

async function kickMember(memberId) {
  if (!confirm('Retirer ce membre de ta pyramide ?')) return
  const m = store.state.members.find(x => x.id === memberId)
  if (!m?.user_id) { toast('Erreur'); return }
  const { data } = await Members.leaveRpc(m.user_id, store.state.myPyramidId)
  if (data?.ok) { toast('Membre retiré, pyramide réarrangée'); renderPyramidTree() }
  else toast('Erreur')
}

// ── Listboard ────────────────────────────────────────────────
function renderListboard() {
  renderLBRanking()
  renderLBDirectory()
}

function renderLBRanking() {
  const el = document.getElementById('lb-ranking-rows')
  if (!el) return
  const sorted = store.getSorted()
  if (!sorted.length) { el.innerHTML = '<div class="lb-empty">Aucune pyramide.</div>'; return }

  el.innerHTML = sorted.map((p, i) => {
    const cnt    = store.state.memberCounts[p.id] || 0
    const lvl    = Math.max(1, Math.ceil(Math.log2(cnt + 2)))
    const isMe   = p.id === store.state.myPyramidId
    const canApp = !isMe && !store.state.myMembership
    return `
      <div class="lb-rank-row ${isMe ? 'lb-rank-row--me' : ''}">
        <span class="lbr-pos">${i === 0 ? '👑' : '#' + (i+1)}</span>
        <span class="lbr-pyr">
          <span class="lbr-emoji">${p.emoji || '🔺'}</span>
          <span class="lbr-name">${esc(p.name || p.pseudo)}</span>
          ${isMe ? '<span class="lbr-you">TOI</span>' : ''}
        </span>
        <span class="lbr-cnt"><strong>${cnt}</strong></span>
        <span class="lbr-lvl">N${lvl}</span>
        <span class="lbr-action">
          ${isMe
            ? `<span class="lb-tag-me">MA PYRAMIDE</span>`
            : canApp
              ? `<button class="lb-apply-btn" onclick="openApplyModal('${p.id}','${esc(p.name || p.pseudo)}')">Candidater</button>`
              : `<button class="lb-view-btn" onclick="toast('Profil bientôt')">Voir</button>`
          }
        </span>
      </div>
    `
  }).join('')
}

function renderLBDirectory() {
  const el = document.getElementById('lb-dir-grid')
  if (!el) return
  const sorted = store.getSorted()
  if (!sorted.length) { el.innerHTML = '<div class="lb-empty">Aucune pyramide.</div>'; return }

  el.innerHTML = sorted.map((p, i) => {
    const cnt  = store.state.memberCounts[p.id] || 0
    const isMe = p.id === store.state.myPyramidId
    const canApp = !isMe && !store.state.myMembership
    return `
      <div class="lb-dir-card ${isMe ? 'lb-dir-card--me' : ''}">
        <div class="lbdc-rank">${i === 0 ? '👑' : '#' + (i+1)}</div>
        <div class="lbdc-emoji">${p.emoji || '🔺'}</div>
        <div class="lbdc-name">${esc(p.name || p.pseudo)}</div>
        <div class="lbdc-promo">${esc(p.promo || '')}</div>
        <div class="lbdc-stats"><strong>${cnt}</strong> membres</div>
        ${isMe
          ? `<div class="lb-tag-me">MA PYRAMIDE</div>`
          : canApp
            ? `<button class="lb-apply-btn" onclick="openApplyModal('${p.id}','${esc(p.name || p.pseudo)}')">Candidater →</button>`
            : `<button class="lb-view-btn" onclick="toast('Profil bientôt')">Voir →</button>`
        }
      </div>
    `
  }).join('')
}

function toggleLBView(view, el) {
  document.querySelectorAll('.lvt-btn').forEach(b => b.classList.remove('on'))
  el.classList.add('on')
  document.getElementById('lb-ranking-view').style.display   = view === 'ranking'   ? 'block' : 'none'
  document.getElementById('lb-directory-view').style.display = view === 'directory' ? 'block' : 'none'
}

// ── Apply Modal ──────────────────────────────────────────────
let applyTargetId = null

function openApplyModal(pyramidId, pyramidName) {
  applyTargetId = pyramidId
  document.getElementById('apply-target-name').textContent = pyramidName
  document.getElementById('apply-msg').value = ''
  document.getElementById('apply-char-count').textContent = '0'
  document.getElementById('apply-modal').classList.add('open')

  document.getElementById('apply-send-btn').onclick = async () => {
    const msg = document.getElementById('apply-msg').value.trim()
    const { error } = await Applications.create({
      applicant_id:   store.state.myProfile?.id || null,
      target_pyramid: applyTargetId,
      from_pyramid:   store.state.myPyramidId || null,
      message:        msg,
    })
    if (error) return toast('Erreur: ' + error.message)
    toast('Candidature envoyée 𓂀')
    closeApplyModal()
  }
}

function closeApplyModal() {
  document.getElementById('apply-modal')?.classList.remove('open')
  applyTargetId = null
}

// ── Applications ─────────────────────────────────────────────
async function renderApplications() {
  // Received (for my pyramid)
  const received = store.getPendingApps()
  const recEl = document.getElementById('applications-list')
  if (recEl) {
    if (!received.length) {
      recEl.innerHTML = '<div class="no-apps">Aucune candidature en attente.</div>'
    } else {
      recEl.innerHTML = received.map(app => `
        <div class="app-card" id="app-${app.id}">
          <div class="app-avatar">${app.profiles?.avatar || '👤'}</div>
          <div class="app-info">
            <div class="app-name">${esc(app.profiles?.pseudo || '—')}</div>
            <div class="app-msg">${esc(app.message || 'Aucun message')}</div>
            <div class="app-from">Pyramide actuelle : ${app.from_pyramid ? 'membre' : 'sans pyramide'}</div>
          </div>
          <div class="app-actions">
            <button class="app-accept" onclick="acceptApp('${app.id}')">ACCEPTER</button>
            <button class="app-refuse" onclick="refuseApp('${app.id}')">Refuser</button>
          </div>
        </div>
      `).join('')
    }
  }

  // Sent by me (fetch from DB)
  const uid = store.state.myProfile?.id
  if (!uid) return
  const { data: mine } = await Applications.getByApplicant(uid)
  const sentEl = document.getElementById('my-applications-list')
  if (!sentEl) return
  if (!mine?.length) { sentEl.innerHTML = '<div class="no-apps">Aucune candidature envoyée.</div>'; return }
  sentEl.innerHTML = mine.map(app => {
    const statusMap = { pending: '⏳ En attente', accepted: '✅ Acceptée', refused: '❌ Refusée' }
    return `
      <div class="app-card app-card--sent">
        <div class="app-avatar">${app.pyramids?.emoji || '🔺'}</div>
        <div class="app-info">
          <div class="app-name">${esc(app.pyramids?.name || '—')}</div>
          <div class="app-msg">${esc(app.message || 'Sans message')}</div>
        </div>
        <div class="app-status">${statusMap[app.status] || app.status}</div>
      </div>
    `
  }).join('')
}

async function acceptApp(appId) {
  const app = store.state.applications.find(a => a.id === appId)
  if (!app) {
    const { data } = await Applications.getForPyramid(store.state.myPyramidId)
    const fresh = data?.find(a => a.id === appId)
    if (!fresh) return toast('Candidature introuvable')
    await processAccept(appId, fresh)
  } else {
    await processAccept(appId, app)
  }
}

async function processAccept(appId, app) {
  const { data, error } = await Applications.accept(appId, app)
  if (error) return toast('Erreur: ' + error.message)
  toast('Candidature acceptée 𓂀')
  document.getElementById('app-' + appId)?.remove()
}

async function refuseApp(appId) {
  await Applications.refuse(appId)
  toast('Candidature refusée')
  document.getElementById('app-' + appId)?.remove()
}

// ── Chat ─────────────────────────────────────────────────────
function renderChat() {
  const msgs = store.getMyMessages()
  const el   = document.getElementById('chat-feed')
  if (!el) return
  if (!msgs.length) { el.innerHTML = '<div class="chat-empty">Sois le premier à parler à ta pyramide.</div>'; return }
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
  const inp  = document.getElementById('chat-in')
  const body = inp?.value.trim()
  if (!body || !store.state.myPyramidId || !store.state.myPyramid) return
  inp.value = ''
  const { error } = await Messages.create({ pyramid_id: store.state.myPyramidId, pseudo: store.state.myPyramid.pseudo, body })
  if (error) toast('Erreur envoi')
}
