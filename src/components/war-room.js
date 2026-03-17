import { store } from '../lib/store.js'
import { esc, copy, toast } from '../lib/utils.js'
import { BASE_URL, ROUND_END } from '../lib/config.js'

// ── Messages viraux par réseau ─────────────────────────────
function getMessages(net, refUrl, topName, topCount, totalPyramids, totalMembers, hoursLeft) {
  const reward = `Le gagnant prend TOUT LE SITE — son nom, ses réseaux, ses produits affichés à tous les visiteurs pour toujours.`
  const urgency = hoursLeft < 6 ? `⏰ IL RESTE MOINS DE ${hoursLeft}H.` : `⏳ ${hoursLeft}h restantes.`
  const stats = `${totalPyramids} pyramides en guerre. ${totalMembers} personnes déjà dedans.`

  const msgs = {
    x: `🚨 UNE PYRAMIDE DE PONZI LÉGALE EST EN TRAIN DE SE FORMER EN DIRECT

La pyramide "${topName}" vient de dépasser ${topCount} membres.
${stats}

${urgency} La plus grande pyramide PREND TOUT LE SITE.

${reward}

👉 ${refUrl}

#yesitsponzi #ponzi #viral`,

    facebook: `⚠️ ATTENTION — Une pyramide de Ponzi 100% légale et transparente est en cours.

On vous cache pas ce que c'est. C'est écrit en gros sur le site.
La pyramide "${topName}" a déjà ${topCount} membres.
${stats}

LE GAGNANT : son nom en grand sur la homepage. Ses réseaux promus. Ses produits/services visibles de tous les visiteurs.

${urgency}

Rejoins ou crée ta propre pyramide → ${refUrl}`,

    reddit: `**[YESITSPONZI] Une pyramide de Ponzi légale et transparente est live — ${totalMembers} participants en ${hoursLeft}h**

Oui c'est un Ponzi. C'est écrit en gros sur le site. Tout le monde sait.

**Comment ça marche :**
- Tu crées ta pyramide, tu reçois un lien unique
- Chaque personne via ton lien = +1 membre
- Timer 72h — celui avec le plus de membres gagne

**La récompense :**
Le site entier appartient au winner. Son nom. Ses réseaux. Ses produits/services. Affichés à tous les visiteurs. Pour toujours.

**Situation actuelle :**
- Pyramide en tête : "${topName}" (${topCount} membres)
- ${stats}
- ${urgency}

→ ${refUrl}`,

    linkedin: `Je partage quelque chose d'inhabituel aujourd'hui.

Un site appelé YESITSPONZI vient de lancer un concept que je n'avais jamais vu : une pyramide de recrutement 100% assumée et transparente.

Pas d'arnaque cachée. Le nom du site dit tout.

La mécanique est simple : créer une pyramide, partager un lien, recruter. Celui avec le plus de membres à la fin du round gagne la totalité du site pour promouvoir ce qu'il veut — ses projets, ses services, sa marque.

La pyramide "${topName}" a déjà atteint ${topCount} membres.
${stats} ${urgency}

C'est une étude de cas marketing en temps réel.

→ ${refUrl}

#marketing #viral #growth #ponzi`,

    whatsapp: `🚨 YESITSPONZI — une pyramide de Ponzi légale est en cours

La pyramide "${topName}" : ${topCount} membres
${stats}

LE WINNER PREND TOUT LE SITE — son nom, ses réseaux, ses produits affichés à tous les visiteurs.

${urgency}

👉 ${refUrl}`,

    discord: `@everyone 🚨

**YESITSPONZI est en feu**

Une pyramide de Ponzi légale et transparente — oui c'est littéralement le nom du site.

**Pyramide en tête :** ${topName} (${topCount} membres)
**Total :** ${stats}
**${urgency}**

**Récompense winner :** tout le site lui appartient. Son nom en homepage. Ses liens promus. Ses produits/services visibles de tous.

Crée ta pyramide ou rejoins → ${refUrl}`,
  }
  return msgs[net] || msgs.x
}

// ── Open URLs ──────────────────────────────────────────────
function getOpenUrl(net, msg, refUrl) {
  const e = encodeURIComponent
  switch (net) {
    case 'x':         return `https://twitter.com/intent/tweet?text=${e(msg)}`
    case 'facebook':  return `https://www.facebook.com/sharer/sharer.php?u=${e(refUrl)}&quote=${e(msg.slice(0,250))}`
    case 'reddit':    return `https://www.reddit.com/submit?url=${e(refUrl)}&title=${e(msg.slice(0,300))}`
    case 'linkedin':  return `https://www.linkedin.com/sharing/share-offsite/?url=${e(refUrl)}`
    case 'whatsapp':  return `https://wa.me/?text=${e(msg)}`
    case 'discord':   return null // copy only
    default:          return null
  }
}

// ── Helpers ────────────────────────────────────────────────
function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max) + '…' : (str || '—')
}

function getStats() {
  const sorted       = store.getSorted()
  const counts       = store.state.memberCounts
  const totalMembers = store.state.members.length
  const top          = sorted[0]
  const topCount     = top ? (counts[top.id] || 0) : 0
  const topName      = top ? (top.name || top.pseudo || '—') : '—'
  const topLevels    = Math.max(1, Math.ceil(Math.log2(topCount + 2)))
  const hoursLeft    = Math.max(1, Math.floor((ROUND_END - Date.now()) / 3600000))
  const refUrl       = store.state.myPyramidId
    ? `${BASE_URL}?ref=${store.state.myPyramidId}`
    : BASE_URL
  return { sorted, counts, totalMembers, top, topCount, topName, topLevels, hoursLeft, refUrl }
}

// ── Render ─────────────────────────────────────────────────
export function renderWarRoom() {
  return `
    <div id="war-room">
      <div class="wr-header">
        <div class="wr-eyebrow">📡 WAR ROOM</div>
        <div class="wr-title">Toutes les pyramides. <span>En direct.</span></div>
        <div class="wr-sub">Données live. Celle qui domine est en train de gagner.<br>La tienne est là-dedans — ou elle devrait l'être.</div>
      </div>

      <div class="wr-body">

        <!-- LEFT : chart -->
        <div class="wr-chart-col">
          <div class="wr-col-label">TAILLE DES PYRAMIDES</div>
          <div id="wr-chart"></div>
          <div class="wr-chart-foot">
            <span id="wr-npyr">0 pyramides</span>
            <span class="wr-sep">◆</span>
            <span id="wr-nmbr">0 membres</span>
          </div>
        </div>

        <!-- RIGHT : alert -->
        <div class="wr-alert-col">
          <div class="wr-alert-box" id="wr-alert-box">
            <div class="wr-alert-icon">⚠️</div>
            <div class="wr-alert-tag">PYRAMIDE DOMINANTE</div>
            <div class="wr-alert-name" id="wa-name">—</div>
            <div class="wr-alert-stats">
              <div class="wr-astat"><span id="wa-members">0</span><small>membres</small></div>
              <div class="wr-astat"><span id="wa-levels">0</span><small>niveaux</small></div>
            </div>
            <div class="wr-alert-bar"><div class="wr-alert-fill" id="wa-fill" style="width:0%"></div></div>
            <div class="wr-alert-msg" id="wa-msg">—</div>
          </div>
        </div>

      </div>

      <!-- SHARE SECTION -->
      <div class="wr-share">
        <div class="wr-share-head">
          <div class="wr-share-title">🚨 PARTAGE. MAINTENANT.</div>
          <div class="wr-share-sub">
            Choisis un réseau. Le message est prêt — alarmant, hype, reward incluse.<br>
            Copie et publie. Ton rang dépend du nombre de gens qui cliquent.
          </div>
        </div>

        <div class="wr-nets" id="wr-nets">
          <div class="wr-net on" data-net="x">𝕏 Twitter</div>
          <div class="wr-net" data-net="facebook">Facebook</div>
          <div class="wr-net" data-net="reddit">Reddit</div>
          <div class="wr-net" data-net="linkedin">LinkedIn</div>
          <div class="wr-net" data-net="whatsapp">WhatsApp</div>
          <div class="wr-net" data-net="discord">Discord</div>
        </div>

        <div class="wr-msg-wrap">
          <div class="wr-msg-box" id="wr-msg-box">—</div>
          <div class="wr-msg-btns">
            <button class="wr-btn-copy" id="wr-btn-copy">📋 COPIER</button>
            <button class="wr-btn-open" id="wr-btn-open">→ PUBLIER MAINTENANT</button>
          </div>
        </div>

        <div class="wr-note">
          Le lien dans le message = ton lien de parrainage si tu as une pyramide, sinon le lien général.
        </div>
      </div>
    </div>
  `
}

export function initWarRoom() {
  let activeNet = 'x'

  const refresh = () => {
    refreshChart()
    refreshAlert()
    refreshMessage(activeNet)
  }

  // Tab clicks
  document.querySelectorAll('.wr-net').forEach(el => {
    el.addEventListener('click', function () {
      document.querySelectorAll('.wr-net').forEach(x => x.classList.remove('on'))
      this.classList.add('on')
      activeNet = this.dataset.net
      refreshMessage(activeNet)
    })
  })

  // Copy
  document.getElementById('wr-btn-copy').addEventListener('click', () => {
    const msg = document.getElementById('wr-msg-box').textContent
    copy(msg).then(() => toast('Message copié 🔺'))
  })

  // Open
  document.getElementById('wr-btn-open').addEventListener('click', () => {
    const { topCount, topName, hoursLeft, refUrl, totalMembers, sorted } = getStats()
    const msg = getMessages(activeNet, refUrl, topName, topCount, sorted.length, totalMembers, hoursLeft)
    const url = getOpenUrl(activeNet, msg, refUrl)
    if (url) window.open(url, '_blank')
    else { copy(msg).then(() => toast('Copié ! (Discord = colle manuellement)')) }
  })

  // Listen store
  store.on('members:update', refresh)
  store.on('pyramids:update', refresh)

  refresh()
}

function refreshChart() {
  const { sorted, counts, totalMembers } = getStats()
  const maxCount = counts[sorted[0]?.id] || 1
  const chart = document.getElementById('wr-chart')
  if (!chart) return

  document.getElementById('wr-npyr').textContent = sorted.length + ' pyramide' + (sorted.length !== 1 ? 's' : '')
  document.getElementById('wr-nmbr').textContent = totalMembers + ' membre' + (totalMembers !== 1 ? 's' : '')

  if (!sorted.length) {
    chart.innerHTML = '<div class="wr-empty">Aucune pyramide encore. Sois le premier.</div>'
    return
  }

  chart.innerHTML = sorted.map((p, i) => {
    const cnt    = counts[p.id] || 0
    const pct    = Math.max(3, Math.round((cnt / maxCount) * 100))
    const isMe   = p.id === store.state.myPyramidId
    const isTop  = i === 0
    const levels = Math.max(1, Math.ceil(Math.log2(cnt + 2)))
    return `
      <div class="wr-bar-row">
        <div class="wr-bar-lbl ${isMe ? 'me' : ''} ${isTop ? 'top' : ''}">
          ${isTop ? '👑' : '#' + (i + 1)}
          <span>${esc(truncate(p.name || p.pseudo, 13))}</span>
          ${isMe ? '<em>TOI</em>' : ''}
        </div>
        <div class="wr-bar-track">
          <div class="wr-bar-fill ${isTop ? 'top' : ''} ${isMe ? 'mine' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="wr-bar-meta">
          <span>${cnt}</span>
          <small>N${levels}</small>
        </div>
      </div>
    `
  }).join('')
}

function refreshAlert() {
  const { top, topCount, topName, topLevels, hoursLeft, sorted } = getStats()
  if (!top) return

  const isMe    = top.id === store.state.myPyramidId
  const maxEver = 50
  const pct     = Math.min(100, Math.round((topCount / maxEver) * 100))

  document.getElementById('wa-name').textContent    = truncate(topName, 20)
  document.getElementById('wa-members').textContent = topCount
  document.getElementById('wa-levels').textContent  = topLevels
  document.getElementById('wa-fill').style.width    = pct + '%'

  const gap = sorted.length > 1 ? (topCount - (store.state.memberCounts[sorted[1]?.id] || 0)) : topCount
  let msg = ''
  if (isMe)            msg = '🔥 C\'est toi. Tiens bon.'
  else if (hoursLeft < 3) msg = `🚨 MOINS DE ${hoursLeft}H. Elle va gagner.`
  else if (gap > 10)   msg = `Elle a ${gap} membres d'avance. Recrute vite.`
  else if (gap <= 5)   msg = `⚡ Seulement ${gap} membres d'écart. Tout peut changer.`
  else                 msg = `${hoursLeft}h restantes. Elle domine.`

  document.getElementById('wa-msg').textContent = msg

  // Flash alert red if close to end
  const box = document.getElementById('wr-alert-box')
  if (box) box.classList.toggle('danger', hoursLeft < 6)
}

function refreshMessage(net) {
  const { top, topCount, topName, hoursLeft, refUrl, totalMembers, sorted } = getStats()
  const msg = getMessages(net, refUrl, topName, topCount, sorted.length, totalMembers, hoursLeft)
  const el = document.getElementById('wr-msg-box')
  if (el) el.textContent = msg

  const openBtn = document.getElementById('wr-btn-open')
  if (!openBtn) return
  if (net === 'discord') {
    openBtn.textContent = '📋 COPIER (colle sur Discord)'
  } else {
    openBtn.textContent = '→ PUBLIER MAINTENANT'
  }
}
