import { sb } from '../lib/supabase.js'
import { store } from '../lib/store.js'
import { esc, ago, toast } from '../lib/utils.js'
import { ROUND_LAUNCH, ROUND_END } from '../lib/config.js'

export function renderAdminScreen() {
  return `
    <div id="screen-admin" class="screen active">
      <div class="admin-header">
        <div class="admin-title">⚙️ ADMIN PANEL</div>
        <div class="admin-sub">Contrôle total. Round, pyramides, membres.</div>
        <button class="admin-logout" id="admin-logout">Déconnexion</button>
      </div>

      <!-- KPIs -->
      <div class="admin-kpis" id="admin-kpis"></div>

      <!-- Round control -->
      <div class="admin-section">
        <div class="admin-section-title">⏱ CONTRÔLE DU ROUND</div>
        <div class="admin-round-info">
          <div class="ari-item">
            <div class="ari-label">Lancement</div>
            <div class="ari-val" id="ar-launch">—</div>
          </div>
          <div class="ari-item">
            <div class="ari-label">Fin</div>
            <div class="ari-val" id="ar-end">—</div>
          </div>
          <div class="ari-item">
            <div class="ari-label">Statut</div>
            <div class="ari-val" id="ar-status">—</div>
          </div>
        </div>
        <div class="admin-note">
          Pour changer les dates → modifie les variables Cloudflare
          <code>VITE_ROUND_LAUNCH</code> et <code>VITE_ROUND_END</code> puis redéploie.
        </div>
      </div>

      <!-- Pyramids table -->
      <div class="admin-section">
        <div class="admin-section-title">🔺 PYRAMIDES (<span id="pyr-count">0</span>)</div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="admin-pyr-table">
            <thead>
              <tr>
                <th>#</th><th>Nom</th><th>Créateur</th>
                <th>Membres</th><th>Lien</th><th>Créée</th><th>Action</th>
              </tr>
            </thead>
            <tbody id="admin-pyr-body"></tbody>
          </table>
        </div>
      </div>

      <!-- Members table -->
      <div class="admin-section">
        <div class="admin-section-title">👥 MEMBRES (<span id="mbr-count">0</span>)</div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="admin-mbr-table">
            <thead>
              <tr>
                <th>Pseudo</th><th>Pyramide</th><th>Promo</th><th>Lien</th><th>Rejoint</th><th>Action</th>
              </tr>
            </thead>
            <tbody id="admin-mbr-body"></tbody>
          </table>
        </div>
      </div>

      <!-- Waitlist -->
      <div class="admin-section">
        <div class="admin-section-title">📬 WAITLIST (<span id="wl-admin-count">0</span>)</div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Email</th><th>Inscrit</th></tr></thead>
            <tbody id="admin-wl-body"></tbody>
          </table>
        </div>
      </div>

    </div>
  `
}

export async function initAdminScreen(onLogout) {
  document.getElementById('admin-logout').addEventListener('click', async () => {
    const { Auth } = await import('../lib/auth.js')
    await Auth.signOut()
    onLogout()
  })

  // Round info
  const fmt = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  document.getElementById('ar-launch').textContent = fmt(ROUND_LAUNCH)
  document.getElementById('ar-end').textContent    = fmt(ROUND_END)
  const now = Date.now()
  document.getElementById('ar-status').textContent =
    now < ROUND_LAUNCH ? '⏳ Pas encore lancé' :
    now < ROUND_END    ? '🔴 EN COURS' : '✅ Terminé'

  await loadAdminData()
}

async function loadAdminData() {
  const [pyrRes, mbrRes, wlRes] = await Promise.all([
    sb.from('pyramids').select('*').order('created_at', { ascending: false }),
    sb.from('members').select('*').order('joined_at',   { ascending: false }),
    sb.from('waitlist').select('*').order('created_at', { ascending: false }),
  ])

  const pyramids = pyrRes.data || []
  const members  = mbrRes.data || []
  const waitlist = wlRes.data  || []

  // Counts
  const memberCounts = {}
  members.forEach(m => { memberCounts[m.pyramid_id] = (memberCounts[m.pyramid_id] || 0) + 1 })

  // KPIs
  document.getElementById('admin-kpis').innerHTML = `
    <div class="kpi"><div class="kpi-n">${pyramids.length}</div><div class="kpi-l">Pyramides</div></div>
    <div class="kpi"><div class="kpi-n">${members.length}</div><div class="kpi-l">Membres total</div></div>
    <div class="kpi"><div class="kpi-n">${waitlist.length}</div><div class="kpi-l">Waitlist</div></div>
    <div class="kpi"><div class="kpi-n">${Math.max(...pyramids.map(p => memberCounts[p.id] || 0), 0)}</div><div class="kpi-l">Max membres</div></div>
  `

  // Pyramids
  document.getElementById('pyr-count').textContent = pyramids.length
  const sorted = [...pyramids].sort((a, b) => (memberCounts[b.id] || 0) - (memberCounts[a.id] || 0))
  document.getElementById('admin-pyr-body').innerHTML = sorted.map((p, i) => `
    <tr>
      <td>#${i + 1}</td>
      <td><strong>${esc(p.name)}</strong><br><small>${esc(p.promo || '')}</small></td>
      <td>${esc(p.pseudo)}</td>
      <td><strong>${memberCounts[p.id] || 0}</strong></td>
      <td>${p.link ? `<a href="${esc(p.link)}" target="_blank">→</a>` : '—'}</td>
      <td>${ago(p.created_at)}</td>
      <td><button class="admin-del-btn" onclick="adminDeletePyramid('${p.id}')">Suppr.</button></td>
    </tr>
  `).join('')

  // Members
  document.getElementById('mbr-count').textContent = members.length
  document.getElementById('admin-mbr-body').innerHTML = members.map(m => {
    const pyr = pyramids.find(p => p.id === m.pyramid_id)
    return `
      <tr>
        <td>${esc(m.pseudo)}</td>
        <td>${esc(pyr?.name || '—')}</td>
        <td>${esc(m.promo || '—')}</td>
        <td>${m.link ? `<a href="${esc(m.link)}" target="_blank">→</a>` : '—'}</td>
        <td>${ago(m.joined_at)}</td>
        <td><button class="admin-del-btn" onclick="adminDeleteMember('${m.id}')">Suppr.</button></td>
      </tr>
    `
  }).join('')

  // Waitlist
  document.getElementById('wl-admin-count').textContent = waitlist.length
  document.getElementById('admin-wl-body').innerHTML = waitlist.map(w => `
    <tr>
      <td>${esc(w.email)}</td>
      <td>${ago(w.created_at)}</td>
    </tr>
  `).join('')
}

// Global delete handlers
window.adminDeletePyramid = async (id) => {
  if (!confirm('Supprimer cette pyramide et tous ses membres ?')) return
  await sb.from('pyramids').delete().eq('id', id)
  toast('Pyramide supprimée')
  await loadAdminData()
}
window.adminDeleteMember = async (id) => {
  if (!confirm('Supprimer ce membre ?')) return
  await sb.from('members').delete().eq('id', id)
  toast('Membre supprimé')
  await loadAdminData()
}
