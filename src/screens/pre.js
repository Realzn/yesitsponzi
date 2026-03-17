import { Waitlist } from '../lib/supabase.js'
import { toast } from '../lib/utils.js'
import { formatCountdown, startTimer } from '../components/timer.js'
import { renderWarRoom, initWarRoom } from '../components/war-room.js'

export function renderPreScreen() {
  return `
    <div id="screen-pre" class="screen active">

      <div class="hero">
        <div class="hero-eyebrow">Round 1 — lancement dans</div>
        <div id="pre-countdown"></div>
        <div class="hero-title">YES<em>ITS</em><br>PONZI</div>
        <div class="hero-sub">
          Crée ta pyramide. Partage le lien. Recrute.<br>
          Celui avec le plus de membres prend <strong>tout le site</strong>.<br>
          Oui on sait ce que c'est. C'est le jeu.
        </div>

        <div class="wl-wrap">
          <div class="wl-box">
            <div class="wl-head">— sois notifié au lancement —</div>
            <div class="wl-flex">
              <input class="wl-input" id="wl-email" type="email" placeholder="ton@email.com">
              <button class="wl-btn" id="wl-btn">ME PRÉVENIR →</button>
            </div>
            <div class="wl-done" id="wl-done">✓ &nbsp;Noté. On te ping au lancement.</div>
            <div class="wl-count-line" id="wl-cnt">chargement...</div>
          </div>
        </div>
      </div>

      ${renderWarRoom()}

      <div class="rules-wrap">
        <div class="rules-h">Les règles.<br><span>Simples. Brutales.</span></div>
        <div class="rules-intro">Pas de bullshit. Voilà exactement comment ça marche.</div>
        ${rule(1, "T'inscris. Tu reçois un lien unique.", "Dès que tu crées ta pyramide, tu as un lien de parrainage personnel. <strong>C'est ton seul outil.</strong>")}
        ${rule(2, "Chaque personne via ton lien = +1 membre.", "Leurs recrues comptent aussi. En cascade. <strong>Infinie.</strong> Plus ta pyramide est profonde, plus tu es fort.")}
        ${rule(3, "Tu vois pas les autres pyramides. Juste le classement.", "T'as ton dashboard perso. Tu vois tes membres, ton rang, l'écart avec le leader. <strong>Rien d'autre.</strong>")}
        ${rule(4, "72H. Timer visible.", "Le round dure exactement <strong>72 heures.</strong> Quand ça ralentit, le timer accélère.")}
        ${rule(5, "Le winner prend TOUT LE SITE.", "La pyramide avec le plus de membres gagne. <strong>Son nom. Son projet. Ses réseaux.</strong> Affichés à tous. Chaque membre = un bloc. Cliquable.")}
        ${rule(6, "Hall of fame. Pour toujours.", "Les anciens winners restent sur le site. <strong>Immortalisés.</strong> Nouveau round. Nouvelle guerre.")}
      </div>

      <div class="honesty">
        <div class="h-inner">
          <div class="h-icon">⚠️</div>
          <div>
            <div class="h-tag">Soyons honnêtes</div>
            <div class="h-body">
              C'est <strong>une pyramide de recrutement.</strong> On l'assume. On l'affiche. C'est le nom du site.<br>
              Les premiers ont un avantage sur les derniers. <strong>C'est le jeu.</strong><br>
              Zéro argent en jeu. Que de la visibilité. <strong>Que de la fierté.</strong><br>
              T'es libre de jouer. T'es libre de partir. <strong>On force personne.</strong>
            </div>
          </div>
        </div>
      </div>

      <footer class="site-footer">
        <span>YESITSPONZI © 2026</span>
        <span>ZÉRO ARGENT. 100% FIERTÉ.</span>
        <span>ROUND 1 À VENIR</span>
      </footer>
    </div>
  `
}

function rule(n, title, desc) {
  return `
    <div class="rule">
      <div class="rn">0${n}</div>
      <div>
        <div class="rt">${title}</div>
        <div class="rd">${desc}</div>
      </div>
    </div>
  `
}

export function initPreScreen() {
  startTimer((phase, parts) => {
    if (phase === 'pre' && parts) {
      const el = document.getElementById('pre-countdown')
      if (el) el.innerHTML = formatCountdown(parts)
    }
  })

  document.getElementById('wl-btn')?.addEventListener('click', submitWaitlist)
  document.getElementById('wl-email')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitWaitlist()
  })

  loadWLCount()
  initWarRoom()
}

async function submitWaitlist() {
  const email = document.getElementById('wl-email')?.value.trim()
  if (!email || !email.includes('@')) return toast('Email valide svp !')
  const { error } = await Waitlist.add(email)
  if (error?.code === '23505') return toast("T'es déjà sur la liste !")
  if (error) return toast('Erreur, réessaie.')
  document.getElementById('wl-done').style.display = 'block'
  document.querySelector('.wl-flex').style.display = 'none'
  loadWLCount()
}

async function loadWLCount() {
  const { count } = await Waitlist.count()
  const el = document.getElementById('wl-cnt')
  if (el) el.innerHTML = `<span>${count || 0}</span> déjà sur la liste`
}
