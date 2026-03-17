import { sb, Pyramids, Members, subscribeAll } from './lib/supabase.js'
import { store } from './lib/store.js'
import { ROUND_LAUNCH, ROUND_END, LS_PID } from './lib/config.js'
import { setBadge } from './components/header.js'
import { renderTicker } from './components/ticker.js'
import { renderNotif } from './components/notification.js'
import { renderPreScreen,    initPreScreen    } from './screens/pre.js'
import { renderLiveScreen,   initLiveScreen   } from './screens/live.js'
import { renderDashboard,    initDashboard    } from './screens/dashboard.js'
import { renderWinnerScreen, initWinnerScreen } from './screens/winner.js'

async function bootstrap() {
  const app = document.getElementById('app')

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

  document.getElementById('logo').addEventListener('click', detectScreen)

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

  const savedPid = localStorage.getItem(LS_PID)
  if (savedPid) {
    const p = store.state.pyramids.find(x => x.id === savedPid)
    if (p) store.setMyPyramid(p)
  }

  subscribeAll({
    onPyramid: p   => store.addPyramid(p),
    onMember:  m   => store.addMember(m),
    onMessage: msg => store.addMessage(msg),
  })

  detectScreen()
}

function detectScreen() {
  const now     = Date.now()
  const screens = document.getElementById('screens')

  if (now < ROUND_LAUNCH.getTime()) {
    setBadge('pre')
    screens.innerHTML = renderPreScreen()
    initPreScreen()
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
      store.setMyPyramid(pyramid)
      screens.innerHTML = renderDashboard()
      initDashboard()
    })
  }
}

bootstrap().catch(err => {
  console.error('[YESITSPONZI]', err)
  document.getElementById('app').innerHTML =
    `<div style="padding:2rem;font-family:monospace;color:#ff2020">Erreur: ${err.message}</div>`
})
