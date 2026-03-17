import { Pyramids, Members } from '../lib/supabase.js'
import { store } from '../lib/store.js'
import { toast, pad } from '../lib/utils.js'
import { startTimer, urgencyMessage } from '../components/timer.js'
import { EMOJIS, LS_PID, BASE_URL } from '../lib/config.js'

let selEmoji = '🔺'

export function renderLiveScreen() {
  return `
    <div id="screen-live" class="screen">

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
    </div>
  `
}

export function initLiveScreen(onPyramidCreated) {
  // Live timer
  startTimer((phase, parts) => {
    if (phase !== 'live' || !parts) return
    const el = (id) => document.getElementById(id)
    el('t-h').textContent = pad(parts.hours)
    el('t-m').textContent = pad(parts.mins)
    el('t-s').textContent = pad(parts.secs)
    el('hdr-timer').textContent = `FIN ${pad(parts.hours)}h${pad(parts.mins)}m${pad(parts.secs)}s`
    el('urgency').textContent = urgencyMessage(parts)
  })

  // Leader update
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

  // Check referral param
  handleRefJoin()
}

function updateLeaderPanel() {
  const leader = store.getLeader()
  if (!leader) return
  const cnt = store.state.memberCounts[leader.id] || 0
  document.getElementById('ldr-name').textContent = leader.name || leader.pseudo || '—'
  document.getElementById('ldr-cnt').innerHTML = `<strong>${cnt}</strong> membres`
  document.getElementById('ldr-bar').style.width = Math.min(100, cnt * 4) + '%'
}

async function createPyramid(onCreated) {
  const pseudo = document.getElementById('f-pseudo').value.trim()
  const name   = document.getElementById('f-name').value.trim()
  const promo  = document.getElementById('f-promo').value.trim()
  const link   = document.getElementById('f-link').value.trim()

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

// ── Referral join via ?ref=xxx ─────────────────────────────
function handleRefJoin() {
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref')
  if (!ref) return

  // Wait for store to be ready
  setTimeout(() => {
    const pyramid = store.state.pyramids.find(p => p.id === ref)
    if (!pyramid) return

    const pseudo = prompt(`🔺 Tu es invité à rejoindre "${pyramid.name}"\n\nEntre ton pseudo :`)
    if (!pseudo?.trim()) return

    const promo = prompt('Ce que tu veux promouvoir (optionnel) :') || ''
    const link  = prompt('Ton lien Instagram/site (optionnel) :') || ''

    joinPyramid(ref, pseudo.trim(), promo, link)
  }, 800)
}

async function joinPyramid(pid, pseudo, promo, link) {
  const { error } = await Members.create({ pyramid_id: pid, pseudo, promo, link, emoji: '👤' })
  if (error) return toast('Erreur: ' + error.message)
  toast('🔺 T\'es dans la pyramide !')
  window.history.replaceState({}, '', BASE_URL)
}
