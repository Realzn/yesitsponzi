import { sb, Pyramids, Members, Messages, subscribeAll } from './lib/supabase.js'
import { store } from './lib/store.js'
import { ROUND_LAUNCH, ROUND_END, LS_PID } from './lib/config.js'
import { setBadge } from './components/header.js'
import { renderTicker } from './components/ticker.js'
import { renderNotif } from './components/notification.js'
import { renderPreScreen,   initPreScreen   } from './screens/pre.js'
import { renderLiveScreen,  initLiveScreen  } from './screens/live.js'
import { renderDashboard,   initDashboard   } from './screens/dashboard.js'
import { renderWinnerScreen, initWinnerScreen } from './screens/winner.js'

// ── Bootstrap ─────────────────────────────────────────────────
async function bootstrap() {
  const app = document.getElementById('app')

  // 1. Inject static shell
  app.innerHTML = `
    ${renderTicker()}
    <header id="site-header">
      <div class="logo" id="logo">YES<em>ITS</em>PONZI</div>
      <div class="hdr-right">
        <div class="badge badge-pre" id="hdr-badge">⬤ &nbsp;PRE-LAUNCH</div>
        <div id="hdr-timer"></div>
      </div>
    </header>
    <div id="screens"></div>
    ${renderNotif()}
    <div id="toast"></div>
  `

  document.getElementById('logo').addEventListener('click', goHome)

  // 2. Load all data
  const [pyrRes, memRes, allMsgRes] = await Promise.all([
    Pyramids.getAll(),
    Members.getAll(),
    sb.from('messages').select('*').order('created_at', { ascending: true }),
  ])

  store.setAll({
    pyramids: pyrRes.data  || [],
    members:  memRes.data  || [],
    messages: allMsgRes.data || [],
  })

  // 3. Restore session
  const savedPid = localStorage.getItem(LS_PID)
  if (savedPid) {
    const p = store.state.pyramids.find(x => x.id === savedPid)
    if (p) store.setMyPyramid(p)
  }

  // 4. Subscribe realtime
  subscribeAll({
    onPyramid: (p) => store.addPyramid(p),
    onMember:  (m) => store.addMember(m),
    onMessage: (msg) => store.addMessage(msg),
  })

  // 5. Detect and render the right screen
  detectScreen()
}

// ── Screen detection ─────────────────────────────────────────
function detectScreen() {
  const now = Date.now()
  const screens = document.getElementById('screens')

  if (now < ROUND_LAUNCH) {
    setBadge('pre')
    screens.innerHTML = renderPreScreen()
    initPreScreen()
    return
  }

  if (now > ROUND_END) {
    setBadge('done')
    screens.innerHTML = renderWinnerScreen()
    initWinnerScreen()
    return
  }

  // Round is live
  setBadge('live')

  if (store.state.myPyramid) {
    // User has a pyramid — show dashboard
    screens.innerHTML = renderDashboard()
    initDashboard()
  } else {
    // New user — show create form
    screens.innerHTML = renderLiveScreen()
    initLiveScreen((pyramid) => {
      // After creating, switch to dashboard
      store.setMyPyramid(pyramid)
      screens.innerHTML = renderDashboard()
      initDashboard()
    })
  }
}

function goHome() {
  detectScreen()
}

// ── Go ────────────────────────────────────────────────────────
bootstrap().catch(err => {
  console.error('[YESITSPONZI] Fatal error:', err)
  document.getElementById('app').innerHTML = `
    <div style="padding:2rem;font-family:monospace;color:#ff2020">
      Erreur de connexion. Vérifie tes variables Supabase dans .env
    </div>
  `
})
