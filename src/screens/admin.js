import { sb } from '../lib/supabase.js'
import { esc, ago, toast } from '../lib/utils.js'
import { ROUND_LAUNCH, ROUND_END, BASE_URL } from '../lib/config.js'
import { Auth } from '../lib/auth.js'

// ══ STATE ═════════════════════════════════════════════════════
let D = { pyramids: [], members: [], waitlist: [], applications: [], messages: [] }
let activeSection = 'overview'
let searchQuery   = ''
let activityLog   = []
let refreshTimer  = null
let countdownTimer = null

// ══ RENDER ════════════════════════════════════════════════════
export function renderAdminScreen() {
  return `
  <div id="screen-admin" class="screen active">

    <!-- ── SIDEBAR ── -->
    <aside class="adm-side">
      <div class="adm-brand">
        <div class="adm-brand-icon">𓂀</div>
        <div>
          <div class="adm-brand-title">ADMIN</div>
          <div class="adm-brand-sub">YESITSPONZI</div>
        </div>
      </div>

      <div class="adm-round-mini" id="adm-round-mini">
        <div class="arm-label">Round I</div>
        <div class="arm-timer" id="arm-timer">—</div>
        <div class="arm-status" id="arm-status">—</div>
      </div>

      <nav class="adm-nav">
        <div class="adm-nav-group">TABLEAU DE BORD</div>
        <div class="adm-nav-item on" onclick="admNav('overview',this)">
          <span class="adm-ni-icon">⊞</span><span>Vue d'ensemble</span>
        </div>
        <div class="adm-nav-item" onclick="admNav('round',this)">
          <span class="adm-ni-icon">⏱</span><span>Contrôle du round</span>
        </div>

        <div class="adm-nav-group">DONNÉES</div>
        <div class="adm-nav-item" onclick="admNav('pyramids',this)">
          <span class="adm-ni-icon">🔺</span><span>Pyramides</span>
          <span class="adm-nb" id="nb-pyr">0</span>
        </div>
        <div class="adm-nav-item" onclick="admNav('members',this)">
          <span class="adm-ni-icon">👥</span><span>Membres</span>
          <span class="adm-nb" id="nb-mbr">0</span>
        </div>
        <div class="adm-nav-item" onclick="admNav('applications',this)">
          <span class="adm-ni-icon">📨</span><span>Candidatures</span>
          <span class="adm-nb adm-nb--hot" id="nb-apps">0</span>
        </div>
        <div class="adm-nav-item" onclick="admNav('messages',this)">
          <span class="adm-ni-icon">💬</span><span>Messages</span>
          <span class="adm-nb" id="nb-msgs">0</span>
        </div>
        <div class="adm-nav-item" onclick="admNav('waitlist',this)">
          <span class="adm-ni-icon">📬</span><span>Waitlist</span>
          <span class="adm-nb" id="nb-wl">0</span>
        </div>

        <div class="adm-nav-group">SYSTÈME</div>
        <div class="adm-nav-item" onclick="admNav('activity',this)">
          <span class="adm-ni-icon">📋</span><span>Journal</span>
          <span class="adm-nb adm-nb--live" id="nb-log">0</span>
        </div>
        <div class="adm-nav-item" onclick="admNav('settings',this)">
          <span class="adm-ni-icon">⚙️</span><span>Paramètres</span>
        </div>
      </nav>

      <div class="adm-side-foot">
        <div class="adm-last-sync" id="adm-last-sync">—</div>
        <button class="adm-logout" id="admin-logout">Déconnexion</button>
      </div>
    </aside>

    <!-- ── MAIN ── -->
    <main class="adm-main">

      <!-- TOPBAR -->
      <div class="adm-topbar">
        <div class="adm-search-wrap">
          <span class="adm-search-icon">⌕</span>
          <input class="adm-search" id="adm-search" placeholder="Rechercher pyramide, membre, email..." oninput="admSearch(this.value)">
          <button class="adm-search-clear" id="adm-search-clear" onclick="admClearSearch()" style="display:none">✕</button>
        </div>
        <button class="adm-topbar-btn" onclick="admReload(true)">↻ Actualiser</button>
        <button class="adm-topbar-btn adm-topbar-btn--gold" onclick="admExportData()">⬇ Export</button>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  1. VUE D'ENSEMBLE                        -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec active" id="adms-overview">
        <div class="adm-sec-title">Vue d'ensemble</div>

        <div class="adm-kpis" id="adm-kpis"></div>

        <div class="adm-row-2">
          <div class="adm-card">
            <div class="adm-card-title">🔺 Classement pyramides</div>
            <div id="ov-bar-chart"></div>
          </div>
          <div class="adm-card">
            <div class="adm-card-title">🥧 Part de membres</div>
            <div id="ov-dist-chart"></div>
          </div>
        </div>

        <div class="adm-card" id="ov-leader-card"></div>

        <div class="adm-card">
          <div class="adm-card-title">⚡ Activité récente (session)</div>
          <div id="ov-recent-log"></div>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  2. CONTRÔLE DU ROUND                     -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-round">
        <div class="adm-sec-title">Contrôle du Round</div>

        <div class="adm-round-hero" id="adm-round-hero"></div>

        <div class="adm-row-2" style="margin-bottom:1rem">
          <div class="adm-card">
            <div class="adm-card-title">📅 Dates</div>
            <div class="adm-card-body">
              <div class="adm-kv"><span>Lancement</span><strong id="rv-launch">—</strong></div>
              <div class="adm-kv"><span>Fin</span><strong id="rv-end">—</strong></div>
              <div class="adm-kv"><span>Durée</span><strong>72 heures</strong></div>
              <p class="adm-note">Modifie <code>VITE_ROUND_LAUNCH</code> et <code>VITE_ROUND_END</code> sur Cloudflare Pages puis redéploie.</p>
            </div>
          </div>
          <div class="adm-card">
            <div class="adm-card-title">⚡ Actions rapides</div>
            <div class="adm-card-body adm-actions-list">
              <button class="adm-action-btn adm-action-btn--gold"   onclick="admAnnounceWinner()">👑 Générer annonce winner</button>
              <button class="adm-action-btn"                        onclick="admCopyStats()">📋 Copier les stats</button>
              <button class="adm-action-btn"                        onclick="admExportData()">⬇ Export JSON complet</button>
              <button class="adm-action-btn adm-action-btn--danger" onclick="admResetRound()">🗑 Reset round (tout supprimer)</button>
            </div>
          </div>
        </div>

        <div class="adm-card">
          <div class="adm-card-title">🏆 Pyramide en tête — aperçu winner</div>
          <div id="round-winner-preview"></div>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  3. PYRAMIDES                              -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-pyramids">
        <div class="adm-sec-hdr">
          <div class="adm-sec-title">Pyramides <span class="adm-count-badge" id="cnt-pyr">0</span></div>
          <div class="adm-sec-hdr-right">
            <select class="adm-sel" id="pyr-sort" onchange="renderPyramids()">
              <option value="members">↓ Membres</option>
              <option value="date">↓ Date</option>
              <option value="name">A→Z Nom</option>
            </select>
          </div>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr>
              <th>#</th><th>Pyramide</th><th>Créateur</th>
              <th>Membres</th><th>Niveaux</th><th>Lien</th><th>Créée</th><th>Actions</th>
            </tr></thead>
            <tbody id="tbl-pyr"></tbody>
          </table>
        </div>
        <!-- Inline members panel -->
        <div id="pyr-detail-panel" class="adm-detail-panel" style="display:none">
          <div class="adm-detail-hdr">
            <div class="adm-detail-title" id="pyr-detail-title">Membres de —</div>
            <button class="adm-detail-close" onclick="closePyrDetail()">✕</button>
          </div>
          <div id="pyr-detail-body"></div>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  4. MEMBRES                                -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-members">
        <div class="adm-sec-hdr">
          <div class="adm-sec-title">Membres <span class="adm-count-badge" id="cnt-mbr">0</span></div>
          <div class="adm-sec-hdr-right">
            <select class="adm-sel" id="mbr-status" onchange="renderMembers()">
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="left">Partis</option>
            </select>
            <select class="adm-sel" id="mbr-pyr" onchange="renderMembers()">
              <option value="all">Toutes pyramides</option>
            </select>
          </div>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr>
              <th>Membre</th><th>Pyramide</th><th>Niv.</th>
              <th>Promo</th><th>Lien</th><th>Statut</th><th>Rejoint</th><th>Actions</th>
            </tr></thead>
            <tbody id="tbl-mbr"></tbody>
          </table>
        </div>
        <div class="adm-pagination" id="mbr-pagination"></div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  5. CANDIDATURES                           -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-applications">
        <div class="adm-sec-hdr">
          <div class="adm-sec-title">Candidatures <span class="adm-count-badge" id="cnt-apps">0</span></div>
          <div class="adm-sec-hdr-right">
            <select class="adm-sel" id="apps-status" onchange="renderApplications()">
              <option value="all">Tous</option>
              <option value="pending">⏳ En attente</option>
              <option value="accepted">✅ Acceptées</option>
              <option value="refused">❌ Refusées</option>
            </select>
          </div>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr>
              <th>Candidat</th><th>Vers</th><th>Depuis</th>
              <th>Message</th><th>Statut</th><th>Date</th><th>Actions</th>
            </tr></thead>
            <tbody id="tbl-apps"></tbody>
          </table>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  6. MESSAGES                               -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-messages">
        <div class="adm-sec-hdr">
          <div class="adm-sec-title">Messages chat <span class="adm-count-badge" id="cnt-msgs">0</span></div>
          <div class="adm-sec-hdr-right">
            <select class="adm-sel" id="msgs-pyr" onchange="renderMessages()">
              <option value="all">Toutes pyramides</option>
            </select>
            <button class="adm-action-btn adm-action-btn--danger" onclick="admNukeMessages()">🗑 Tout supprimer</button>
          </div>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr>
              <th>Auteur</th><th>Pyramide</th><th>Message</th><th>Date</th><th>Action</th>
            </tr></thead>
            <tbody id="tbl-msgs"></tbody>
          </table>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  7. WAITLIST                               -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-waitlist">
        <div class="adm-sec-hdr">
          <div class="adm-sec-title">Waitlist <span class="adm-count-badge" id="cnt-wl">0</span></div>
          <div class="adm-sec-hdr-right">
            <button class="adm-action-btn" onclick="admExportWL()">⬇ CSV</button>
            <button class="adm-action-btn adm-action-btn--danger" onclick="admNukeWL()">🗑 Tout supprimer</button>
          </div>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Email</th><th>Inscrit</th><th>Action</th></tr></thead>
            <tbody id="tbl-wl"></tbody>
          </table>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  8. JOURNAL                                -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-activity">
        <div class="adm-sec-hdr">
          <div class="adm-sec-title">Journal d'activité <span class="adm-count-badge" id="cnt-log">0</span></div>
          <button class="adm-action-btn" onclick="clearLog()">Effacer</button>
        </div>
        <div class="adm-activity-feed" id="adm-activity-feed">
          <div class="adm-empty-msg">Aucune activité enregistrée dans cette session.</div>
        </div>
      </div>

      <!-- ────────────────────────────────────────── -->
      <!--  9. PARAMÈTRES                             -->
      <!-- ────────────────────────────────────────── -->
      <div class="adm-sec" id="adms-settings">
        <div class="adm-sec-title">Paramètres</div>
        <div class="adm-settings-grid">

          <div class="adm-card">
            <div class="adm-card-title">⚙️ Configuration du round</div>
            <div class="adm-card-body">
              <div class="adm-field-row">
                <label>Max enfants par nœud</label>
                <input class="adm-input-sm" type="number" id="cfg-max-children"
                       value="3" min="1" max="10"
                       onchange="saveCfg('max_children', this.value)">
              </div>
              <div class="adm-field-row">
                <label>Waitlist active</label>
                <label class="adm-toggle">
                  <input type="checkbox" id="cfg-waitlist" checked onchange="saveCfg('waitlist_active', this.checked)">
                  <span class="adm-toggle-rail"></span>
                </label>
              </div>
              <div class="adm-field-row">
                <label>Réarrangement auto</label>
                <label class="adm-toggle">
                  <input type="checkbox" id="cfg-rearrange" checked onchange="saveCfg('auto_rearrange', this.checked)">
                  <span class="adm-toggle-rail"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="adm-card">
            <div class="adm-card-title">🔧 Variables d'environnement</div>
            <div class="adm-card-body">
              <div class="adm-env-list">
                <div class="adm-env-item"><code>VITE_SUPABASE_URL</code><span class="adm-ev-ok">✓ définie</span></div>
                <div class="adm-env-item"><code>VITE_SUPABASE_ANON_KEY</code><span class="adm-ev-ok">✓ définie</span></div>
                <div class="adm-env-item"><code>VITE_ROUND_LAUNCH</code><span id="ev-launch" class="adm-ev-ok">✓</span></div>
                <div class="adm-env-item"><code>VITE_ROUND_END</code><span id="ev-end" class="adm-ev-ok">✓</span></div>
                <div class="adm-env-item"><code>VITE_ADMIN_EMAIL</code><span class="adm-ev-ok">✓ définie</span></div>
              </div>
            </div>
          </div>

          <div class="adm-card adm-card--danger">
            <div class="adm-card-title">💣 Danger Zone</div>
            <div class="adm-card-body adm-actions-list">
              <button class="adm-action-btn adm-action-btn--danger" onclick="admNukeWL()">Supprimer toute la waitlist</button>
              <button class="adm-action-btn adm-action-btn--danger" onclick="admNukeMessages()">Supprimer tous les messages</button>
              <button class="adm-action-btn adm-action-btn--danger" onclick="admNukeApps()">Supprimer toutes les candidatures</button>
              <button class="adm-action-btn adm-action-btn--nuke"   onclick="admNukeAll()">☢️ RESET COMPLET</button>
            </div>
          </div>

        </div>
      </div>

    </main>
  </div>

  <!-- ── MOVE MEMBER MODAL ── -->
  <div id="move-modal" class="adm-modal">
    <div class="adm-modal-box">
      <div class="adm-modal-hdr">
        <div class="adm-modal-title">Déplacer le membre</div>
        <button class="adm-modal-close" onclick="closeMoveModal()">✕</button>
      </div>
      <div class="adm-modal-body">
        <div class="adm-field-row">
          <label>Membre</label>
          <div class="adm-modal-info" id="move-member-name">—</div>
        </div>
        <div class="adm-field-row">
          <label>Pyramide cible</label>
          <select class="adm-sel" id="move-target-pyr" style="width:100%"></select>
        </div>
        <p class="adm-note">Le membre sera déplacé sans réarrangement de sa pyramide source. Utilise "Retirer (smart)" pour un déplacement propre.</p>
      </div>
      <div class="adm-modal-foot">
        <button class="adm-action-btn" onclick="closeMoveModal()">Annuler</button>
        <button class="adm-action-btn adm-action-btn--gold" id="move-confirm-btn">Déplacer →</button>
      </div>
    </div>
  </div>

  <!-- ── PYRAMID DETAIL MODAL ── -->
  <div id="pyr-modal" class="adm-modal">
    <div class="adm-modal-box adm-modal-box--wide">
      <div class="adm-modal-hdr">
        <div class="adm-modal-title" id="pyr-modal-title">Détail pyramide</div>
        <button class="adm-modal-close" onclick="closePyrModal()">✕</button>
      </div>
      <div class="adm-modal-body" id="pyr-modal-body"></div>
    </div>
  </div>
  `
}

// ══ INIT ══════════════════════════════════════════════════════
export async function initAdminScreen(onLogout) {
  document.getElementById('admin-logout').addEventListener('click', async () => {
    clearInterval(refreshTimer)
    clearInterval(countdownTimer)
    await Auth.signOut()
    onLogout()
  })

  // Expose all globals
  const fns = {
    admNav, admSearch, admClearSearch, admReload,
    renderPyramids, renderMembers, renderApplications, renderMessages,
    admDeletePyramid, admDeleteMember, admKickMember, admMoveMember, openMoveModal, closeMoveModal,
    admDeleteApp, admAcceptApp, admRefuseApp,
    admDeleteMsg,
    admDeleteWL, admNukeWL, admExportWL,
    admNukeMessages, admNukeApps, admNukeAll, admResetRound,
    admAnnounceWinner, admCopyStats, admExportData,
    closePyrDetail, openPyrModal, closePyrModal,
    clearLog, saveCfg,
    activityLog, // expose reference for onclick
  }
  Object.entries(fns).forEach(([k, v]) => { window[k] = v })
  window.clearLog = () => { activityLog = []; renderLog() }

  // Load config from localStorage
  const mc = localStorage.getItem('yip_setting_max_children')
  if (mc) document.getElementById('cfg-max-children').value = mc
  const wl = localStorage.getItem('yip_setting_waitlist_active')
  if (wl === 'false') document.getElementById('cfg-waitlist').checked = false

  // Env badge
  document.getElementById('ev-launch').textContent = ROUND_LAUNCH ? `✓ ${ROUND_LAUNCH.toLocaleDateString('fr-FR')}` : '⚠ manquante'
  document.getElementById('ev-end').textContent    = ROUND_END    ? `✓ ${ROUND_END.toLocaleDateString('fr-FR')}`    : '⚠ manquante'

  await admReload()

  // Auto-refresh every 30s
  refreshTimer = setInterval(() => admReload(), 30000)

  // Live countdown
  countdownTimer = setInterval(updateCountdown, 1000)
  updateCountdown()

  // Realtime
  sb.channel('admin-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pyramids' },     p => { log('pyramide', p); admReload() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members' },      p => { log('membre', p);   admReload() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, p => { log('candidature',p); admReload() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },     p => { log('message', p);  admReload() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' },     p => { log('waitlist', p); admReload() })
    .subscribe()
}

// ══ COUNTDOWN ════════════════════════════════════════════════
function updateCountdown() {
  const now = Date.now()
  const el  = document.getElementById('arm-timer')
  const st  = document.getElementById('arm-status')
  if (!el) return

  if (now < ROUND_LAUNCH) {
    const diff = ROUND_LAUNCH - now
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000)
    el.textContent = `${pad(h)}h ${pad(m)}m ${pad(s)}s`
    if (st) st.textContent = '⏳ Avant lancement'
  } else if (now < ROUND_END) {
    const diff = ROUND_END - now
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000)
    el.textContent = `${pad(h)}h ${pad(m)}m ${pad(s)}s`
    el.style.color = h < 6 ? '#F08060' : ''
    if (st) st.textContent = '🔴 EN COURS'
  } else {
    el.textContent = 'Terminé'
    if (st) st.textContent = '✅ Round I fini'
  }
}
const pad = n => String(Math.max(0,n)).padStart(2,'0')

// ══ LOAD ══════════════════════════════════════════════════════
async function admReload(showToast = false) {
  const [pR, mR, wR, aR, msgR] = await Promise.all([
    sb.from('pyramids').select('*').order('created_at', { ascending: false }),
    sb.from('members').select('*').order('joined_at',   { ascending: false }),
    sb.from('waitlist').select('*').order('created_at', { ascending: false }),
    sb.from('applications').select('*').order('created_at', { ascending: false }),
    sb.from('messages').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  D.pyramids     = pR.data  || []
  D.members      = mR.data  || []
  D.waitlist     = wR.data  || []
  D.applications = aR.data  || []
  D.messages     = msgR.data || []

  // Populate pyramid selects
  const pyrOpts = D.pyramids.map(p => `<option value="${p.id}">${esc(p.name||p.pseudo)} (${mc()[p.id]||0})</option>`).join('')
  ;['mbr-pyr','msgs-pyr'].forEach(id => {
    const s = document.getElementById(id)
    if (s) s.innerHTML = `<option value="all">Toutes pyramides</option>${pyrOpts}`
  })
  const moveTarget = document.getElementById('move-target-pyr')
  if (moveTarget) moveTarget.innerHTML = pyrOpts

  // Badges
  const active  = D.members.filter(m => m.status === 'active').length
  const pending = D.applications.filter(a => a.status === 'pending').length
  setBadge('nb-pyr',  D.pyramids.length)
  setBadge('nb-mbr',  active)
  setBadge('nb-apps', pending, pending > 0)
  setBadge('nb-msgs', D.messages.length)
  setBadge('nb-wl',   D.waitlist.length)
  setBadge('nb-log',  activityLog.length)

  const sync = document.getElementById('adm-last-sync')
  if (sync) sync.textContent = new Date().toLocaleTimeString('fr-FR')

  renderOverview()
  renderRound()
  renderPyramids()
  renderMembers()
  renderApplications()
  renderMessages()
  renderWaitlist()
  renderLog()

  if (showToast) toast('✓ Données actualisées')
}

const mc = () => {
  const counts = {}
  D.members.filter(m => m.status === 'active').forEach(m => {
    counts[m.pyramid_id] = (counts[m.pyramid_id] || 0) + 1
  })
  return counts
}

function setBadge(id, val, hot = false) {
  const el = document.getElementById(id)
  if (!el) return
  el.textContent = val
  el.style.display = val > 0 ? 'inline-flex' : 'none'
  el.classList.toggle('adm-nb--hot', hot)
}

// ══ NAVIGATION ════════════════════════════════════════════════
function admNav(section, el) {
  activeSection = section
  document.querySelectorAll('.adm-sec').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('on'))
  document.getElementById('adms-' + section)?.classList.add('active')
  el?.classList.add('on')
}

// ══ SEARCH ════════════════════════════════════════════════════
function admSearch(q) {
  searchQuery = q.toLowerCase()
  document.getElementById('adm-search-clear').style.display = q ? 'flex' : 'none'
  renderPyramids(); renderMembers(); renderWaitlist(); renderMessages()
}
function admClearSearch() {
  document.getElementById('adm-search').value = ''
  admSearch('')
}

// ══ RENDER OVERVIEW ═══════════════════════════════════════════
function renderOverview() {
  const counts = mc()
  const sorted  = [...D.pyramids].sort((a,b) => (counts[b.id]||0) - (counts[a.id]||0))
  const leader  = sorted[0]
  const active  = D.members.filter(m => m.status === 'active').length
  const left    = D.members.filter(m => m.status === 'left').length
  const pending = D.applications.filter(a => a.status === 'pending').length
  const now = Date.now()
  const hl = Math.max(0, Math.floor((ROUND_END - now) / 3600000))

  // KPIs
  const kEl = document.getElementById('adm-kpis')
  if (kEl) kEl.innerHTML = [
    { n: D.pyramids.length,  l: 'Pyramides',        t: 'au total',        cls: '' },
    { n: active,             l: 'Membres actifs',   t: `${left} partis`,  cls: '' },
    { n: D.waitlist.length,  l: 'Waitlist',         t: 'inscrits',        cls: '' },
    { n: counts[leader?.id]||0, l: 'Max membres',   t: esc(leader?.name||'—').slice(0,14), cls: 'adm-kpi--gold' },
    { n: pending,            l: 'Candidatures',     t: 'en attente',      cls: pending>0?'adm-kpi--hot':'' },
    { n: `${hl}h`,           l: 'Restantes',        t: now<ROUND_LAUNCH?'pas lancé':now>ROUND_END?'terminé':'en cours', cls: 'adm-kpi--time' },
  ].map(k => `<div class="adm-kpi ${k.cls}">
    <div class="adm-kpi-n">${k.n}</div>
    <div class="adm-kpi-l">${k.l}</div>
    <div class="adm-kpi-t">${k.t}</div>
  </div>`).join('')

  // Bar chart
  const bEl = document.getElementById('ov-bar-chart')
  if (bEl) {
    const max = Math.max(...sorted.map(p => counts[p.id]||0), 1)
    bEl.innerHTML = sorted.slice(0, 8).map((p, i) => {
      const cnt = counts[p.id] || 0
      const pct = Math.round(cnt / max * 100)
      return `<div class="adm-bar-row">
        <div class="adm-bar-lbl">${i===0?'👑':'#'+(i+1)} <span>${esc((p.name||p.pseudo).slice(0,14))}</span></div>
        <div class="adm-bar-track"><div class="adm-bar-fill${i===0?' top':''}" style="width:${Math.max(pct,2)}%"></div></div>
        <div class="adm-bar-val">${cnt}</div>
      </div>`
    }).join('') || '<div class="adm-empty-msg">Aucune pyramide.</div>'
  }

  // Dist chart
  const dEl = document.getElementById('ov-dist-chart')
  if (dEl && sorted.length) {
    const total = active || 1
    dEl.innerHTML = sorted.slice(0, 7).map(p => {
      const cnt = counts[p.id] || 0
      const pct = Math.round(cnt / total * 100)
      return `<div class="adm-dist-row">
        <div class="adm-dist-lbl">${esc((p.name||p.pseudo).slice(0,16))}</div>
        <div class="adm-dist-bar"><div class="adm-dist-fill" style="width:${Math.max(pct,1)}%"></div></div>
        <div class="adm-dist-pct">${pct}%</div>
      </div>`
    }).join('')
  }

  // Leader card
  const lEl = document.getElementById('ov-leader-card')
  if (lEl) {
    if (leader) {
      const cnt = counts[leader.id] || 0
      const lvl = Math.max(1, Math.ceil(Math.log2(cnt+2)))
      lEl.innerHTML = `
        <div class="adm-leader">
          <span class="adm-leader-crown">👑 LEADER</span>
          <span class="adm-leader-emoji">${leader.emoji||'🔺'}</span>
          <div class="adm-leader-info">
            <div class="adm-leader-name">${esc(leader.name||leader.pseudo)}</div>
            <div class="adm-leader-meta">${cnt} membres · ${lvl} niveaux · par ${esc(leader.pseudo)}</div>
            ${leader.promo?`<div class="adm-leader-promo">${esc(leader.promo)}</div>`:''}
            ${leader.link?`<a class="adm-leader-link" href="${esc(leader.link)}" target="_blank">${esc(leader.link)}</a>`:''}
          </div>
          <div class="adm-leader-actions">
            <button class="adm-btn-sm adm-btn-sm--gold" onclick="admAnnounceWinner()">👑 Couronner</button>
            <button class="adm-btn-sm" onclick="openPyrModal('${leader.id}')">Voir détail →</button>
          </div>
        </div>`
    } else {
      lEl.innerHTML = '<div class="adm-empty-msg">Aucune pyramide encore.</div>'
    }
  }

  // Recent log preview
  const rEl = document.getElementById('ov-recent-log')
  if (rEl) {
    rEl.innerHTML = activityLog.slice(0,8).map(l =>
      `<div class="adm-log-row">
        <span class="alr-time">${l.time}</span>
        <span class="alr-tag alr-tag--${l.cat}">${l.cat}</span>
        <span class="alr-msg">${esc(l.msg)}</span>
      </div>`
    ).join('') || '<div class="adm-empty-msg">Aucune activité dans cette session.</div>'
  }
}

// ══ RENDER ROUND ══════════════════════════════════════════════
function renderRound() {
  const now = Date.now()
  const fmt = d => d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
  const status = now < ROUND_LAUNCH ? 'pre' : now < ROUND_END ? 'live' : 'done'

  const hero = document.getElementById('adm-round-hero')
  if (hero) hero.innerHTML = `
    <div class="adm-round-status adm-round-status--${status}">
      <div class="ars-dot"></div>
      <div class="ars-body">
        <div class="ars-label">${status==='pre'?'⏳ Pas encore lancé':status==='live'?'🔴 Round en cours':'✅ Round terminé'}</div>
        ${status==='live'?`<div class="ars-sub">Fin dans ${Math.floor((ROUND_END-now)/3600000)}h ${Math.floor(((ROUND_END-now)%3600000)/60000)}m</div>`:''}
      </div>
      <div class="ars-pct">${D.pyramids.length} pyramides · ${D.members.filter(m=>m.status==='active').length} membres actifs</div>
    </div>`

  const lEl = document.getElementById('rv-launch')
  const eEl = document.getElementById('rv-end')
  if (lEl) lEl.textContent = fmt(ROUND_LAUNCH)
  if (eEl) eEl.textContent = fmt(ROUND_END)

  // Winner preview
  const counts = mc()
  const sorted = [...D.pyramids].sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0))
  const w = sorted[0]
  const wpEl = document.getElementById('round-winner-preview')
  if (wpEl) {
    wpEl.innerHTML = w ? `
      <div class="adm-winner-preview">
        <span class="awp-emoji">${w.emoji||'🔺'}</span>
        <div class="awp-info">
          <div class="awp-name">${esc(w.name||w.pseudo)}</div>
          <div class="awp-meta">${counts[w.id]||0} membres · créé par ${esc(w.pseudo)} · ${ago(w.created_at)}</div>
          ${w.promo?`<div class="awp-promo">"${esc(w.promo)}"</div>`:''}
          ${w.link?`<a class="awp-link" href="${esc(w.link)}" target="_blank">${esc(w.link)}</a>`:''}
        </div>
        <div class="awp-btns">
          <button class="adm-btn-sm adm-btn-sm--gold" onclick="admAnnounceWinner()">👑 Générer annonce</button>
          <button class="adm-btn-sm" onclick="openPyrModal('${w.id}')">Voir pyramide</button>
          <button class="adm-btn-sm adm-btn-sm--danger" onclick="admDeletePyramid('${w.id}')">✕ Supprimer</button>
        </div>
      </div>` : '<div class="adm-empty-msg">Aucune pyramide.</div>'
  }
}

// ══ RENDER PYRAMIDS ═══════════════════════════════════════════
function renderPyramids() {
  const counts = mc()
  const sortBy = document.getElementById('pyr-sort')?.value || 'members'
  let data = [...D.pyramids]

  if (searchQuery) data = data.filter(p =>
    [p.name,p.pseudo,p.promo].some(v => (v||'').toLowerCase().includes(searchQuery))
  )
  data.sort((a,b) => {
    if (sortBy==='members') return (counts[b.id]||0) - (counts[a.id]||0)
    if (sortBy==='date')    return new Date(b.created_at) - new Date(a.created_at)
    if (sortBy==='name')    return (a.name||a.pseudo||'').localeCompare(b.name||b.pseudo||'')
    return 0
  })

  document.getElementById('cnt-pyr').textContent = data.length
  document.getElementById('tbl-pyr').innerHTML = data.map((p, i) => {
    const cnt = counts[p.id] || 0
    const lvl = Math.max(1, Math.ceil(Math.log2(cnt+2)))
    const isLeader = i === 0 && sortBy === 'members'
    return `<tr class="${isLeader?'tbl-row--leader':''}">
      <td><span class="adm-rank">${isLeader?'👑':'#'+(i+1)}</span></td>
      <td>
        <div class="tbl-main">${p.emoji||'🔺'} <strong>${esc(p.name||'—')}</strong></div>
        ${p.promo?`<div class="tbl-sub">${esc(p.promo.slice(0,50))}</div>`:''}
      </td>
      <td class="tbl-dim">${esc(p.pseudo||'—')}</td>
      <td><span class="tbl-bold ${cnt>0?'tbl-gold':''}">${cnt}</span></td>
      <td class="tbl-dim">${lvl}</td>
      <td>${p.link?`<a class="adm-lnk" href="${esc(p.link)}" target="_blank">→ lien</a>`:'—'}</td>
      <td class="tbl-dim">${ago(p.created_at)}</td>
      <td>
        <div class="tbl-actions">
          <button class="adm-btn-sm" onclick="openPyrModal('${p.id}')" title="Voir les membres">👁</button>
          <button class="adm-btn-sm" onclick="admCopyPyrLink('${p.id}')" title="Copier le lien de parrainage">🔗</button>
          <button class="adm-btn-sm adm-btn-sm--danger" onclick="admDeletePyramid('${p.id}')" title="Supprimer la pyramide">✕</button>
        </div>
      </td>
    </tr>`
  }).join('') || '<tr><td colspan="8" class="tbl-empty">Aucune pyramide.</td></tr>'
}

// ══ PYRAMID DETAIL MODAL ══════════════════════════════════════
function openPyrModal(pyrId) {
  const pyr = D.pyramids.find(p => p.id === pyrId)
  if (!pyr) return
  const counts = mc()
  const members = D.members.filter(m => m.pyramid_id === pyrId && m.status === 'active')
  document.getElementById('pyr-modal-title').textContent = `${pyr.emoji||'🔺'} ${pyr.name||pyr.pseudo}`
  document.getElementById('pyr-modal-body').innerHTML = `
    <div class="pyr-modal-stats">
      <div class="pms-item"><span>Créateur</span><strong>${esc(pyr.pseudo)}</strong></div>
      <div class="pms-item"><span>Membres</span><strong>${counts[pyrId]||0}</strong></div>
      <div class="pms-item"><span>Créée</span><strong>${ago(pyr.created_at)}</strong></div>
      ${pyr.promo?`<div class="pms-item"><span>Promo</span><strong>${esc(pyr.promo)}</strong></div>`:''}
      ${pyr.link?`<div class="pms-item"><span>Lien</span><a class="adm-lnk" href="${esc(pyr.link)}" target="_blank">${esc(pyr.link)}</a></div>`:''}
    </div>
    <div class="pyr-modal-members-title">Membres (${members.length})</div>
    ${members.length ? `<table class="adm-table">
      <thead><tr><th>Pseudo</th><th>Promo</th><th>Niveau</th><th>Rejoint</th><th>Actions</th></tr></thead>
      <tbody>${members.map(m => `<tr>
        <td><div class="tbl-main">${m.emoji||'👤'} <strong>${esc(m.pseudo)}</strong></div></td>
        <td class="tbl-dim">${esc(m.promo||'—')}</td>
        <td class="tbl-dim">N${(m.depth||0)+1}</td>
        <td class="tbl-dim">${ago(m.joined_at)}</td>
        <td><div class="tbl-actions">
          <button class="adm-btn-sm" onclick="openMoveModal('${m.id}')">↗ Déplacer</button>
          <button class="adm-btn-sm adm-btn-sm--danger" onclick="admKickMember('${m.id}')">⊗ Retirer</button>
        </div></td>
      </tr>`).join('')}</tbody>
    </table>` : '<div class="adm-empty-msg">Aucun membre.</div>'}
  `
  document.getElementById('pyr-modal').classList.add('open')
}
function closePyrModal() { document.getElementById('pyr-modal').classList.remove('open') }
function closePyrDetail()  { document.getElementById('pyr-detail-panel').style.display = 'none' }

// ══ RENDER MEMBERS ════════════════════════════════════════════
let mbrPage = 0
const MBR_PAGE_SIZE = 25

function renderMembers() {
  mbrPage = 0
  renderMembersPage()
}

function renderMembersPage() {
  const statusF = document.getElementById('mbr-status')?.value || 'all'
  const pyrF    = document.getElementById('mbr-pyr')?.value    || 'all'

  let data = [...D.members]
  if (statusF !== 'all') data = data.filter(m => m.status === statusF)
  if (pyrF !== 'all')    data = data.filter(m => m.pyramid_id === pyrF)
  if (searchQuery) data = data.filter(m =>
    [m.pseudo,m.promo].some(v => (v||'').toLowerCase().includes(searchQuery))
  )

  document.getElementById('cnt-mbr').textContent = data.length
  const page   = data.slice(mbrPage * MBR_PAGE_SIZE, (mbrPage + 1) * MBR_PAGE_SIZE)
  const pages  = Math.ceil(data.length / MBR_PAGE_SIZE)

  document.getElementById('tbl-mbr').innerHTML = page.map(m => {
    const pyr = D.pyramids.find(p => p.id === m.pyramid_id)
    return `<tr>
      <td><div class="tbl-main">${m.emoji||'👤'} <strong>${esc(m.pseudo||'—')}</strong></div></td>
      <td>
        <div class="tbl-main">${pyr?.emoji||'🔺'} ${esc((pyr?.name||pyr?.pseudo||'—').slice(0,20))}</div>
      </td>
      <td class="tbl-dim">N${(m.depth||0)+1}</td>
      <td class="tbl-dim">${esc((m.promo||'—').slice(0,30))}</td>
      <td>${m.link?`<a class="adm-lnk" href="${esc(m.link)}" target="_blank">→</a>`:'—'}</td>
      <td><span class="adm-status adm-status--${m.status==='active'?'ok':'off'}">${m.status}</span></td>
      <td class="tbl-dim">${ago(m.joined_at)}</td>
      <td><div class="tbl-actions">
        <button class="adm-btn-sm" onclick="openMoveModal('${m.id}')" title="Déplacer">↗</button>
        <button class="adm-btn-sm adm-btn-sm--danger" onclick="admKickMember('${m.id}')" title="Retirer avec réarrangement">⊗</button>
        <button class="adm-btn-sm adm-btn-sm--danger" onclick="admDeleteMember('${m.id}')" title="Supprimer direct">✕</button>
      </div></td>
    </tr>`
  }).join('') || '<tr><td colspan="8" class="tbl-empty">Aucun membre.</td></tr>'

  // Pagination
  const pg = document.getElementById('mbr-pagination')
  if (pg) pg.innerHTML = pages > 1 ? `
    <button class="adm-pg-btn" ${mbrPage===0?'disabled':''} onclick="mbrPage--;renderMembersPage()">← Préc.</button>
    <span class="adm-pg-info">Page ${mbrPage+1} / ${pages} (${data.length} membres)</span>
    <button class="adm-pg-btn" ${mbrPage>=pages-1?'disabled':''} onclick="mbrPage++;renderMembersPage()">Suiv. →</button>
  ` : `<span class="adm-pg-info">${data.length} membre${data.length!==1?'s':''}</span>`
}
window.mbrPage = 0 // expose for inline onclick

// ══ MOVE MEMBER MODAL ════════════════════════════════════════
let moveMemberId = null

function openMoveModal(memberId) {
  moveMemberId = memberId
  const m = D.members.find(x => x.id === memberId)
  if (!m) return
  const pyr = D.pyramids.find(p => p.id === m.pyramid_id)
  document.getElementById('move-member-name').textContent =
    `${m.emoji||'👤'} ${m.pseudo} (actuellement dans : ${pyr?.name||pyr?.pseudo||'—'})`
  // Populate target pyramid select (exclude current)
  const sel = document.getElementById('move-target-pyr')
  sel.innerHTML = D.pyramids
    .filter(p => p.id !== m.pyramid_id)
    .map(p => `<option value="${p.id}">${p.emoji||'🔺'} ${esc(p.name||p.pseudo)} (${mc()[p.id]||0} mbr)</option>`)
    .join('')
  document.getElementById('move-confirm-btn').onclick = () => execMoveMember()
  document.getElementById('move-modal').classList.add('open')
}

async function execMoveMember() {
  if (!moveMemberId) return
  const targetId = document.getElementById('move-target-pyr').value
  if (!targetId) { toast('Sélectionne une pyramide cible'); return }
  await sb.from('members').update({ pyramid_id: targetId, parent_id: null, depth: 99 }).eq('id', moveMemberId)
  toast('Membre déplacé')
  closeMoveModal()
  await admReload()
}

function closeMoveModal() {
  document.getElementById('move-modal').classList.remove('open')
  moveMemberId = null
}

function admMoveMember(id) { openMoveModal(id) }

// ══ RENDER APPLICATIONS ═══════════════════════════════════════
function renderApplications() {
  const filter = document.getElementById('apps-status')?.value || 'all'
  let data = [...D.applications]
  if (filter !== 'all') data = data.filter(a => a.status === filter)

  document.getElementById('cnt-apps').textContent = data.length
  const sColor = { pending:'adm-status--warn', accepted:'adm-status--ok', refused:'adm-status--off' }
  const sLabel = { pending:'⏳ attente', accepted:'✅ acceptée', refused:'❌ refusée' }

  document.getElementById('tbl-apps').innerHTML = data.map(a => {
    const tPyr = D.pyramids.find(p => p.id === a.target_pyramid)
    const fPyr = D.pyramids.find(p => p.id === a.from_pyramid)
    return `<tr>
      <td class="tbl-dim">${esc(a.applicant_id?.slice(0,8)||'—')}…</td>
      <td><div class="tbl-main">${tPyr?.emoji||'🔺'} <strong>${esc(tPyr?.name||tPyr?.pseudo||'—')}</strong></div></td>
      <td class="tbl-dim">${fPyr ? esc(fPyr.name||fPyr.pseudo||'—') : '(sans pyramide)'}</td>
      <td class="tbl-dim">${esc((a.message||'—').slice(0,60))}</td>
      <td><span class="adm-status ${sColor[a.status]||''}">${sLabel[a.status]||a.status}</span></td>
      <td class="tbl-dim">${ago(a.created_at)}</td>
      <td><div class="tbl-actions">
        ${a.status==='pending'?`
          <button class="adm-btn-sm adm-btn-sm--gold"   onclick="admAcceptApp('${a.id}')">✓ Accepter</button>
          <button class="adm-btn-sm adm-btn-sm--danger" onclick="admRefuseApp('${a.id}')">✕ Refuser</button>
        `:''}
        <button class="adm-btn-sm adm-btn-sm--danger" onclick="admDeleteApp('${a.id}')">🗑</button>
      </div></td>
    </tr>`
  }).join('') || '<tr><td colspan="7" class="tbl-empty">Aucune candidature.</td></tr>'
}

// ══ RENDER MESSAGES ═══════════════════════════════════════════
function renderMessages() {
  const pyrF = document.getElementById('msgs-pyr')?.value || 'all'
  let data = [...D.messages]
  if (pyrF !== 'all') data = data.filter(m => m.pyramid_id === pyrF)
  if (searchQuery) data = data.filter(m =>
    [m.pseudo,m.body].some(v => (v||'').toLowerCase().includes(searchQuery))
  )

  document.getElementById('cnt-msgs').textContent = data.length
  document.getElementById('tbl-msgs').innerHTML = data.map(msg => {
    const pyr = D.pyramids.find(p => p.id === msg.pyramid_id)
    return `<tr>
      <td><strong class="tbl-gold">${esc(msg.pseudo||'—')}</strong></td>
      <td class="tbl-dim">${pyr?.emoji||'💬'} ${esc(pyr?.name||pyr?.pseudo||'—')}</td>
      <td class="tbl-msg-body">${esc(msg.body||'—')}</td>
      <td class="tbl-dim">${ago(msg.created_at)}</td>
      <td><button class="adm-btn-sm adm-btn-sm--danger" onclick="admDeleteMsg('${msg.id}')">✕</button></td>
    </tr>`
  }).join('') || '<tr><td colspan="5" class="tbl-empty">Aucun message.</td></tr>'
}

// ══ RENDER WAITLIST ═══════════════════════════════════════════
function renderWaitlist() {
  let data = [...D.waitlist]
  if (searchQuery) data = data.filter(w => w.email.toLowerCase().includes(searchQuery))
  document.getElementById('cnt-wl').textContent = data.length
  document.getElementById('tbl-wl').innerHTML = data.map(w => `<tr>
    <td>${esc(w.email)}</td>
    <td class="tbl-dim">${ago(w.created_at)}</td>
    <td><button class="adm-btn-sm adm-btn-sm--danger" onclick="admDeleteWL('${w.id}')">✕</button></td>
  </tr>`).join('') || '<tr><td colspan="3" class="tbl-empty">Waitlist vide.</td></tr>'
}

// ══ RENDER LOG ════════════════════════════════════════════════
function renderLog() {
  setBadge('nb-log', activityLog.length)
  const el = document.getElementById('adm-activity-feed')
  if (!el) return
  el.innerHTML = activityLog.length
    ? activityLog.map(l => `<div class="adm-log-row">
        <span class="alr-time">${l.time}</span>
        <span class="alr-tag alr-tag--${l.cat}">${l.cat}</span>
        <span class="alr-evt alr-evt--${l.event}">${l.event}</span>
        <span class="alr-msg">${esc(l.msg)}</span>
      </div>`).join('')
    : '<div class="adm-empty-msg">Aucune activité dans cette session.</div>'
}

function log(cat, payload) {
  const evtMap = { INSERT:'nouveau', UPDATE:'modifié', DELETE:'supprimé' }
  const data = payload.new || payload.old || {}
  activityLog.unshift({
    time:  new Date().toLocaleTimeString('fr-FR'),
    cat,
    event: evtMap[payload.eventType] || payload.eventType || '?',
    msg:   [data.name, data.pseudo, data.email, data.body].filter(Boolean).join(' · ').slice(0,80) || JSON.stringify(data).slice(0,60),
  })
  if (activityLog.length > 200) activityLog.length = 200
  renderLog()
  setBadge('nb-log', activityLog.length)
}

// ══ CRUD ACTIONS ══════════════════════════════════════════════
async function admDeletePyramid(id) {
  if (!confirm('Supprimer cette pyramide et tous ses membres ?')) return
  const { error } = await sb.from('pyramids').delete().eq('id', id)
  if (error) { toast('Erreur: ' + error.message); return }
  toast('Pyramide supprimée')
  closePyrModal()
  await admReload()
}

async function admDeleteMember(id) {
  if (!confirm('Supprimer ce membre directement (sans réarrangement) ?')) return
  await sb.from('members').delete().eq('id', id)
  toast('Membre supprimé')
  await admReload()
}

async function admKickMember(id) {
  const m = D.members.find(x => x.id === id)
  if (!m?.user_id) {
    // Fallback: no user_id → delete directly
    if (!confirm(`Retirer ${m?.pseudo||'ce membre'} ? (Pas de user_id — suppression directe)`)) return
    await sb.from('members').update({ status: 'left' }).eq('id', id)
    toast('Membre retiré')
    await admReload(); return
  }
  if (!confirm(`Retirer ${m.pseudo} avec réarrangement intelligent ?`)) return
  const { data, error } = await sb.rpc('leave_pyramid', { p_user_id: m.user_id, p_pyramid_id: m.pyramid_id })
  if (error) { toast('RPC error: ' + error.message); return }
  toast(`${m.pseudo} retiré — pyramide réarrangée ✓`)
  await admReload()
}

async function admDeleteApp(id) {
  await sb.from('applications').delete().eq('id', id)
  toast('Candidature supprimée')
  await admReload()
}

async function admAcceptApp(id) {
  const app = D.applications.find(a => a.id === id)
  if (!app) return
  await sb.from('applications').update({ status: 'accepted' }).eq('id', id)
  if (app.from_pyramid && app.applicant_id) {
    await sb.rpc('leave_pyramid', { p_user_id: app.applicant_id, p_pyramid_id: app.from_pyramid })
  }
  if (app.applicant_id && app.target_pyramid) {
    await sb.rpc('join_pyramid', { p_user_id: app.applicant_id, p_pyramid_id: app.target_pyramid, p_pseudo: 'Initié', p_emoji: '👤' })
  }
  toast('Candidature acceptée ✓')
  await admReload()
}

async function admRefuseApp(id) {
  await sb.from('applications').update({ status: 'refused' }).eq('id', id)
  toast('Candidature refusée')
  await admReload()
}

async function admDeleteMsg(id) {
  await sb.from('messages').delete().eq('id', id)
  toast('Message supprimé')
  await admReload()
}

async function admDeleteWL(id) {
  await sb.from('waitlist').delete().eq('id', id)
  toast('Email supprimé')
  await admReload()
}

function admCopyPyrLink(pyrId) {
  const url = `${BASE_URL}?ref=${pyrId}`
  navigator.clipboard?.writeText(url).then(() => toast('Lien copié'))
}

// ══ ROUND ACTIONS ═════════════════════════════════════════════
function admAnnounceWinner() {
  const counts = mc()
  const sorted = [...D.pyramids].sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0))
  const w = sorted[0]
  if (!w) { toast('Aucune pyramide'); return }
  const cnt = counts[w.id] || 0
  const lvl = Math.max(1, Math.ceil(Math.log2(cnt+2)))
  const msg = [
    `👑 YESITSPONZI — ROUND 1 WINNER`,
    ``,
    `${w.emoji||'🔺'} ${w.name||w.pseudo}`,
    `par ${w.pseudo}`,
    ``,
    `📊 ${cnt} membres · ${lvl} niveaux`,
    w.promo ? `💬 "${w.promo}"` : '',
    w.link  ? `🔗 ${w.link}` : '',
    ``,
    `🏆 La pyramide gagnante prend tout le site.`,
    `⏰ ${new Date().toLocaleString('fr-FR')}`,
  ].filter(l => l !== null).join('\n')
  navigator.clipboard?.writeText(msg).then(() => toast('Annonce winner copiée 👑'))
}

async function admResetRound() {
  if (!confirm('⚠️ RESET COMPLET DU ROUND ?\nToutes les pyramides et tous les membres seront supprimés.')) return
  if (!confirm('DERNIÈRE CONFIRMATION — irréversible.')) return
  await sb.from('pyramids').delete().neq('id','00000000-0000-0000-0000-000000000000')
  toast('Round reset — toutes les pyramides supprimées')
  await admReload()
}

function admCopyStats() {
  const counts = mc()
  const sorted = [...D.pyramids].sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0))
  const lines = [
    `📊 STATS YESITSPONZI — ${new Date().toLocaleString('fr-FR')}`,
    `Pyramides : ${D.pyramids.length}`,
    `Membres actifs : ${D.members.filter(m=>m.status==='active').length}`,
    `Candidatures en attente : ${D.applications.filter(a=>a.status==='pending').length}`,
    `Waitlist : ${D.waitlist.length}`,
    ``,
    `🏆 CLASSEMENT :`,
    ...sorted.map((p,i) => `#${i+1} ${p.emoji||'🔺'} ${p.name||p.pseudo} — ${counts[p.id]||0} membres`),
  ]
  navigator.clipboard?.writeText(lines.join('\n')).then(() => toast('Stats copiées'))
}

function admExportData() {
  const data = {
    exported_at: new Date().toISOString(),
    round: { launch: ROUND_LAUNCH, end: ROUND_END },
    pyramids: D.pyramids, members: D.members,
    applications: D.applications, waitlist: D.waitlist,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `yesitsponzi_${Date.now()}.json` })
  a.click(); toast('Export téléchargé')
}

function admExportWL() {
  const csv = 'email,created_at\n' + D.waitlist.map(w => `"${w.email}","${w.created_at}"`).join('\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: 'waitlist.csv' })
  a.click(); toast('CSV téléchargé')
}

// ══ NUKE ACTIONS ══════════════════════════════════════════════
async function admNukeWL() {
  if (!confirm('Supprimer toute la waitlist ?')) return
  await sb.from('waitlist').delete().neq('id','00000000-0000-0000-0000-000000000000')
  toast('Waitlist effacée')
  await admReload()
}

async function admNukeMessages() {
  if (!confirm('Supprimer TOUS les messages de chat ?')) return
  await sb.from('messages').delete().neq('id','00000000-0000-0000-0000-000000000000')
  toast('Messages supprimés')
  await admReload()
}

async function admNukeApps() {
  if (!confirm('Supprimer toutes les candidatures ?')) return
  await sb.from('applications').delete().neq('id','00000000-0000-0000-0000-000000000000')
  toast('Candidatures supprimées')
  await admReload()
}

async function admNukeAll() {
  if (!confirm('☢️ RESET COMPLET ?\n\nPyramides + membres + candidatures + messages.\n\nIRRÉVERSIBLE.')) return
  if (!confirm('DERNIÈRE CONFIRMATION.')) return
  await Promise.all([
    sb.from('pyramids').delete().neq('id','00000000-0000-0000-0000-000000000000'),
    sb.from('messages').delete().neq('id','00000000-0000-0000-0000-000000000000'),
    sb.from('applications').delete().neq('id','00000000-0000-0000-0000-000000000000'),
  ])
  toast('☢️ Reset complet effectué')
  await admReload()
}

function saveCfg(key, value) {
  localStorage.setItem('yip_setting_' + key, value)
  toast(`✓ ${key} sauvegardé`)
}
