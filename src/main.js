import { sb, Pyramids, Members, subscribeAll, Profiles, Applications } from './lib/supabase.js'
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

async function bootstrap() {
  const app = document.getElementById('app')
  app.innerHTML = `
    ${renderTicker()}
    <header id="site-header">
      <div class="logo" id="logo">YES<em>ITS</em>PONZI</div>
      <div class="hdr-right">
        <div class="badge badge-pre" id="hdr-badge">⬤ CHARGEMENT</div>
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
  initAuthModal(async () => {
    const { data: { user } } = await sb.auth.getUser()
    currentUser = user
    if (currentUser) await loadProfile()
    refreshAuthButton()
    route()
  })

  // Auth state
  Auth.onAuthChange(async (_event, session) => {
    currentUser = session?.user || null
    if (currentUser) await loadProfile()
    refreshAuthButton()
    route()
  })

  currentUser = await getCurrentUser()
  if (currentUser) await loadProfile()
  refreshAuthButton()

  // Load all data
  const [pyrRes, memRes, allMsgRes, allAppRes] = await Promise.all([
    Pyramids.getAll(),
    Members.getAll(),
    sb.from('messages').select('*, profiles(pseudo,avatar)').order('created_at', { ascending: true }),
    sb.from('applications').select('*, profiles!applicant_id(pseudo,avatar,promo,link), pyramids!target_pyramid(id,name,emoji)').order('created_at', { ascending: false }),
  ])

  store.setAll({
    pyramids:  pyrRes.data    || [],
    members:   memRes.data    || [],
    messages:  allMsgRes.data || [],
  })
  store.state.applications = allAppRes.data || []

  // Restore session
  const savedPid = localStorage.getItem(LS_PID)
  if (savedPid) {
    const p = store.state.pyramids.find(x => x.id === savedPid)
    if (p) store.setMyPyramid(p)
  }

  // If logged in, try to find their pyramid
  if (currentUser && !store.state.myPyramidId) {
    const m = store.state.members.find(x => x.user_id === currentUser.id && x.status === 'active')
    if (m) {
      const p = store.state.pyramids.find(x => x.id === m.pyramid_id)
      if (p) { store.setMyPyramid(p); localStorage.setItem(LS_PID, p.id) }
      store.setMyMembership(m)
    }
  }

  // Realtime
  subscribeAll({
    onPyramid:     p          => store.addPyramid(p),
    onMember:      (m, type)  => store.addMember(m, type),
    onMessage:     msg        => store.addMessage(msg),
    onApplication: (app, type) => store.addApplication(app, type),
  })

  route()
  injectDust()
}

async function loadProfile() {
  if (!currentUser) return
  const { data } = await Profiles.get(currentUser.id)
  if (data) store.setMyProfile(data)
}

function refreshAuthButton() {
  const el = document.getElementById('hdr-auth')
  if (!el) return
  if (currentUser) {
    const pseudo = store.state.myProfile?.pseudo || currentUser.user_metadata?.pseudo || currentUser.email?.split('@')[0]
    el.innerHTML = `
      <div class="hdr-user">
        <span class="hdr-pseudo">${pseudo}</span>
        ${isAdmin(currentUser) ? '<span class="hdr-admin-tag">ADMIN</span>' : ''}
        <button class="hdr-logout" onclick="doLogout()">Déco</button>
      </div>
    `
    window.doLogout = async () => {
      await Auth.signOut()
      localStorage.removeItem(LS_PID)
      store.state.myPyramid = null; store.state.myPyramidId = null
      store.state.myProfile = null; store.state.myMembership = null
      currentUser = null; refreshAuthButton(); route()
    }
  } else {
    el.innerHTML = `<button class="hdr-login-btn" onclick="openAuthModal('signin')">CONNEXION</button>`
    window.openAuthModal = openAuthModal
  }
}

function route() {
  const now     = Date.now()
  const screens = document.getElementById('screens')
  if (!screens) return

  store.clearListeners()

  if (currentUser && isAdmin(currentUser)) {
    setBadge('live')
    screens.innerHTML = renderAdminScreen()
    initAdminScreen(() => { currentUser = null; refreshAuthButton(); route() })
    return
  }

  if (now < ROUND_LAUNCH.getTime()) {
    setBadge('pre')
    screens.innerHTML = renderPreScreen()
    initPreScreen(() => openAuthModal('signup'))
    return
  }

  if (now > ROUND_END.getTime()) {
    setBadge('done')
    screens.innerHTML = renderWinnerScreen()
    initWinnerScreen()
    return
  }

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

function injectDust() {
  const field = document.createElement('div')
  field.className = 'dust-field'
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div')
    p.className = 'dust-particle'
    p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()>.7?3:2}px;height:${Math.random()>.7?3:2}px;animation-duration:${9+Math.random()*14}s;animation-delay:${Math.random()*10}s;opacity:0`
    field.appendChild(p)
  }
  document.body.appendChild(field)
}

bootstrap().catch(err => {
  console.error('[YESITSPONZI]', err)
  document.getElementById('app').innerHTML =
    `<div style="padding:2rem;font-family:monospace;color:#C04030;background:#030303">Erreur: ${err.message}</div>`
})
