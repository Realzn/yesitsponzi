import { Pyramids, Members } from '../lib/supabase.js'
import { store } from '../lib/store.js'
import { toast, pad } from '../lib/utils.js'
import { startTimer, urgencyMessage } from '../components/timer.js'
import { EMOJIS, LS_PID, BASE_URL } from '../lib/config.js'
import { renderWarRoom, initWarRoom } from '../components/war-room.js'

let selEmoji = '🔺'

export function renderLiveScreen() {
  return `
    <div id="screen-live" class="screen active">

      <div class="live-top">
        <div class="leader-panel">
          <div class="panel-label">🏆 pyramide en tête</div>
          <div class="leader-name" id="ldr-name">—</div>
          <div class="leader-cnt" id="ldr-cnt"><strong>0</strong> membres</div>
          <div class="progress-bar"><div class="progress-fill" id="ldr-bar" style="width:0%"></div></div>
        </div>
        <div class="timer-panel">
          <div class="panel-label">⏱ fin du round dans</div>
          <div class="timer-digits">
            <div class="td-block"><div class="td-n" id="t-h">00</div><div class="td-l">h</div></div>
            <div class="td-sep">:</div>
            <div class="td-block"><div class="td-n" id="t-m">00</div><div class="td-l">m</div></div>
            <div class="td-sep">:</div>
            <div class="td-block"><div class="td-n" id="t-s">00</div><div class="td-l">s</div></div>
          </div>
          <div class="urgency" id="urgency"></div>
        </div>
      </div>

      <div class="create-wrap">
        <div class="create-h">Crée ta pyramide.</div>
        <div class="create-sub">
          Remplis ça. Partage le lien. <strong>Recrute.</strong><br>
          Si tu gagnes, cette page t'appartient.
        </div>
        <div class="form-card">
          <div class="fc-head">— ton profil —</div>
          <div class="field">
            <label>Pseudo</label>
            <input id="f-pseudo" type="text" placeholder="TonNom" maxlength="30">
          </div>
          <div class="field">
            <label>Ton emoji</label>
            <div class="emoji-row" id="emoji-row">
              ${EMOJIS.map((e, i) => `<div class="ep${i === 0 ? ' sel' : ''}" data-e="${e}">${e}</div>`).join('')}
            </div>
          </div>
          <div class="field">
            <label>Nom de ta pyramide</label>
            <input id="f-name" type="text" placeholder="ex: REALZN SQUAD" maxlength="40">
          </div>
          <div class="field">
            <label>Ce que tu veux promouvoir si tu gagnes</label>
            <textarea id="f-promo" placeholder="Ma musique, mon Instagram, mon projet..." maxlength="160"></textarea>
          </div>
          <div class="field">
            <label>Ton lien</label>
            <input id="f-link" type="url" placeholder="https://instagram.com/...">
          </div>
          <button class="cta-btn" id="create-btn">LANCER MA PYRAMIDE 🔺</button>
        </div>
      </div>

      ${renderWarRoom()}

      <footer class="site-footer">
        <span>YESITSPONZI © 2026</span>
        <span>ROUND 1 LIVE</span>
        <span>ZÉRO ARGENT. 100% FIERTÉ.</span>
      </footer>
    </div>
  `
}

export function initLiveScreen(onPyramidCreated) {
  // Live timer
  startTimer((phase, parts) => {
    if (phase !== 'live' || !parts) return
    const el = id => document.getElementById(id)
    if (el('t-h')) el('t-h').textContent = pad(parts.hours)
    if (el('t-m')) el('t-m').textContent = pad(parts.mins)
    if (el('t-s')) el('t-s').textContent = pad(parts.secs)
    if (el('hdr-timer')) el('hdr-timer').textContent = `FIN ${pad(parts.hours)}h${pad(parts.mins)}m${pad(parts.secs)}s`
    if (el('urgency')) el('urgency').textContent = urgencyMessage(parts)
  })

  // Leader panel
  store.on('members:update', updateLeaderPanel)
  store.on('pyramids:update', updateLeaderPanel)
  updateLeaderPanel()

  // Emoji picker
  document.querySelectorAll('.ep').forEach(el => {
    el.addEventListener('click', function () {
      document.querySelectorAll('.ep').forEach(x => x.classList.remove('sel'))
      this.classList.add('sel')
      selEmoji = this.dataset.e
    })
  })

  // Create button
  document.getElementById('create-btn')?.addEventListener('click', () => createPyramid(onPyramidCreated))

  // War room
  initWarRoom()

  // Referral param
  handleRefJoin()
}

function updateLeaderPanel() {
  const leader = store.getLeader()
  if (!leader) return
  const cnt = store.state.memberCounts[leader.id] || 0
  const n = document.getElementById('ldr-name')
  const c = document.getElementById('ldr-cnt')
  const b = document.getElementById('ldr-bar')
  if (n) n.textContent = leader.name || leader.pseudo || '—'
  if (c) c.innerHTML = `<strong>${cnt}</strong> membres`
  if (b) b.style.width = Math.min(100, cnt * 4) + '%'
}

async function createPyramid(onCreated) {
  const pseudo = document.getElementById('f-pseudo')?.value.trim()
  const name   = document.getElementById('f-name')?.value.trim()
  const promo  = document.getElementById('f-promo')?.value.trim()
  const link   = document.getElementById('f-link')?.value.trim()

  if (!pseudo || !name) return toast('Pseudo + nom requis !')

  const btn = document.getElementById('create-btn')
  btn.disabled = true
  btn.textContent = 'création...'

  const { data, error } = await Pyramids.create({ pseudo, name, promo, link, emoji: selEmoji })

  if (error) {
    btn.disabled = false
    btn.textContent = 'LANCER MA PYRAMIDE 🔺'
    return toast('Erreur: ' + error.message)
  }

  localStorage.setItem(LS_PID, data.id)
  store.addPyramid(data)
  store.setMyPyramid(data)
  onCreated(data)
}

function handleRefJoin() {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (!ref) return

  setTimeout(() => {
    const pyramid = store.state.pyramids.find(p => p.id === ref)
    if (!pyramid) return

    const pseudo = prompt(`🔺 Tu es invité à rejoindre "${pyramid.name}"\n\nEntre ton pseudo :`)
    if (!pseudo?.trim()) return

    const promo = prompt('Ce que tu veux promouvoir (optionnel) :') || ''
    const link  = prompt('Ton lien Instagram/site (optionnel) :') || ''

    Members.create({ pyramid_id: ref, pseudo: pseudo.trim(), promo, link, emoji: '👤' })
      .then(({ error }) => {
        if (error) return toast('Erreur: ' + error.message)
        toast('🔺 T\'es dans la pyramide !')
        window.history.replaceState({}, '', BASE_URL)
      })
  }, 800)
}
