import { sb, Pyramids, Members, subscribeAll } from './lib/supabase.js'
import { store } from './lib/store.js'
import { ROUND_LAUNCH, ROUND_END, LS_PID } from './lib/config.js'
import { Auth, getCurrentUser, isAdmin } from './lib/auth.js'
import { setBadge } from './components/header.js'
import { renderTicker } from './components/ticker.js'
import { renderNotif } from './components/notification.js'
import { renderAuthModal, initAuthModal, openAuthModal } from './components/auth-modal.js'
import { renderPreScreen,    initPreScreen    } from './screens/pre.js'
import { renderLiveScreen,   initLiveScreen   } from './screens/live.js'
import { renderDashboard,    initDashboard    } from './screens/dashboard.js'
import { renderWinnerScreen, initWinnerScreen } from './screens/winner.js'
import { renderAdminScreen,  initAdminScreen  } from './screens/admin.js'

let currentUser = null

// ── Bootstrap ──────────────────────────────────────────────
async function bootstrap() {
  const app = document.getElementById('app')

  app.innerHTML = `
    ${renderTicker()}
    <header id="site-header">
      <div class="logo" id="logo">YES<em>ITS</em>PONZI</div>
      <div class="hdr-right">
        <div class="badge badge-pre" id="hdr-badge">⬤ &nbsp;CHARGEMENT</div>
        <div id="hdr-timer"></div>
        <div id="hdr-auth"></div>
      </div>
    </header>
    <div id="screens"></div>
    ${renderNotif()}
    ${renderAuthModal()}
    <div id="toast"></div>
  `

  document.getElementById('logo').addEventListener('click', () => route())

  // Auth modal
  initAuthModal(() => { refreshAuthButton(); route() })

  // Auth state listener
  Auth.onAuthChange((_event, session) => {
    currentUser = session?.user || null
    refreshAuthButton()
    route()
  })

  currentUser = await getCurrentUser()
  refreshAuthButton()

  // Load all data in parallel
  const [pyrRes, memRes, allMsgRes] = await Promise.all([
    Pyramids.getAll(),
    Members.getAll(),
    sb.from('messages').select('*').order('created_at', { ascending: true }),
  ])

  store.setAll({
    pyramids:  pyrRes.data    || [],
    members:   memRes.data    || [],
    messages:  allMsgRes.data || [],
  })

  // Restore session
  const savedPid = localStorage.getItem(LS_PID)
  if (savedPid) {
    const p = store.state.pyramids.find(x => x.id === savedPid)
    if (p) store.setMyPyramid(p)
  }

  // Realtime
  subscribeAll({
    onPyramid: p   => store.addPyramid(p),
    onMember:  m   => store.addMember(m),
    onMessage: msg => store.addMessage(msg),
  })

  route()
}

// ── Auth button ────────────────────────────────────────────
function refreshAuthButton() {
  const el = document.getElementById('hdr-auth')
  if (!el) return
  if (currentUser) {
    const pseudo = currentUser.user_metadata?.pseudo || currentUser.email?.split('@')[0] || 'moi'
    el.innerHTML = `
      <div class="hdr-user">
        <span class="hdr-pseudo">${pseudo}</span>
        ${isAdmin(currentUser) ? '<span class="hdr-admin-tag">ADMIN</span>' : ''}
        <button class="hdr-logout" id="hdr-logout">Déco</button>
      </div>
    `
    document.getElementById('hdr-logout')?.addEventListener('click', async () => {
      await Auth.signOut()
      localStorage.removeItem(LS_PID)
      store.state.myPyramid   = null
      store.state.myPyramidId = null
      currentUser = null
      refreshAuthButton()
      route()
    })
  } else {
    el.innerHTML = `<button class="hdr-login-btn" id="hdr-login">CONNEXION</button>`
    document.getElementById('hdr-login')?.addEventListener('click', () => openAuthModal('signin'))
  }
}

// ── Routing ────────────────────────────────────────────────
function route() {
  const now     = Date.now()
  const screens = document.getElementById('screens')
  if (!screens) return

  // Clear store listeners before injecting new screen
  store.clearListeners()

  // Admin
  if (currentUser && isAdmin(currentUser)) {
    setBadge('live')
    screens.innerHTML = renderAdminScreen()
    initAdminScreen(() => { currentUser = null; refreshAuthButton(); route() })
    return
  }

  // Pre-launch
  if (now < ROUND_LAUNCH.getTime()) {
    setBadge('pre')
    screens.innerHTML = renderPreScreen()
    initPreScreen()
    return
  }

  // Round finished → winner showcase
  if (now > ROUND_END.getTime()) {
    setBadge('done')
    screens.innerHTML = renderWinnerScreen()
    initWinnerScreen()
    return
  }

  // Live round
  setBadge('live')

  if (store.state.myPyramid) {
    screens.innerHTML = renderDashboard()
    initDashboard()
  } else {
    screens.innerHTML = renderLiveScreen()
    initLiveScreen(pyramid => {
      store.clearListeners()
      store.setMyPyramid(pyramid)
      screens.innerHTML = renderDashboard()
      initDashboard()
    })
  }
}

bootstrap().catch(err => {
  console.error('[YESITSPONZI]', err)
  document.getElementById('app').innerHTML =
    `<div style="padding:2rem;font-family:monospace;color:#ff2020;background:#000">
      <strong>Erreur JS :</strong> ${err.message}<br>
      <small>Vérifie la console (F12) pour plus de détails.</small>
    </div>`
})
