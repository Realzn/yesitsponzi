import { Waitlist } from '../lib/supabase.js'
import { toast } from '../lib/utils.js'
import { formatCountdown, startTimer } from '../components/timer.js'
import { renderWarRoom, initWarRoom } from '../components/war-room.js'

export function renderPreScreen() {
  return `
    <div id="screen-pre" class="screen active">

      <!-- HERO PYRAMID -->
      <div class="hero">

        <!-- Hieroglyph strip top -->
        <div class="hiero-strip">
          <div class="hiero-inner">
            𓂀 𓃭 𓅓 𓆣 𓄿 𓆑 𓃀 𓅱 𓏏 𓄿 𓂋 𓏏 𓈖
            𓂀 𓃭 𓅓 𓆣 𓄿 𓆑 𓃀 𓅱 𓏏 𓄿 𓂋 𓏏 𓈖
            𓂀 𓃭 𓅓 𓆣 𓄿 𓆑 𓃀 𓅱 𓏏 𓄿 𓂋 𓏏 𓈖
          </div>
        </div>

        <!-- SVG Pyramid -->
        <div class="hero-pyramid-wrap">
          <svg class="hero-pyramid-svg" viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stop-color="#FFD060" stop-opacity=".9"/>
                <stop offset="40%"  stop-color="#C5A03F" stop-opacity=".7"/>
                <stop offset="100%" stop-color="#8A6018" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="pyrGlow" cx="50%" cy="100%" r="60%">
                <stop offset="0%"   stop-color="#BF8F30" stop-opacity=".3"/>
                <stop offset="100%" stop-color="#0E0B07" stop-opacity="0"/>
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="strongGlow">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="pyrFace" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%"   stop-color="#5C4E38"/>
                <stop offset="50%"  stop-color="#2E2618"/>
                <stop offset="100%" stop-color="#1A1610"/>
              </linearGradient>
              <linearGradient id="pyrLeft" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stop-color="#3A3020"/>
                <stop offset="100%" stop-color="#1A1610"/>
              </linearGradient>
              <linearGradient id="pyrRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#2E2618"/>
                <stop offset="100%" stop-color="#141208"/>
              </linearGradient>
            </defs>

            <!-- Glow base -->
            <ellipse cx="250" cy="390" rx="200" ry="30" fill="url(#pyrGlow)"/>

            <!-- Pyramid faces -->
            <!-- Left face -->
            <polygon points="250,30 50,380 250,380" fill="url(#pyrLeft)" stroke="#5C4E38" stroke-width=".5"/>
            <!-- Right face -->
            <polygon points="250,30 450,380 250,380" fill="url(#pyrRight)" stroke="#3A3020" stroke-width=".5"/>
            <!-- Front face (center) -->
            <polygon points="250,30 50,380 450,380" fill="url(#pyrFace)" stroke="#6B5A3A" stroke-width="1"/>

            <!-- Edge gold lines -->
            <line x1="250" y1="30" x2="50"  y2="380" stroke="#8A6018" stroke-width="1.5" opacity=".8" filter="url(#glow)"/>
            <line x1="250" y1="30" x2="450" y2="380" stroke="#8A6018" stroke-width="1.5" opacity=".8" filter="url(#glow)"/>
            <line x1="50"  y1="380" x2="450" y2="380" stroke="#6B5A3A" stroke-width="1" opacity=".6"/>

            <!-- Hieroglyph engravings (subtle lines) -->
            <g opacity=".15" stroke="#C5A03F" stroke-width=".8" fill="none">
              <line x1="200" y1="120" x2="300" y2="120"/>
              <line x1="180" y1="160" x2="320" y2="160"/>
              <line x1="160" y1="200" x2="340" y2="200"/>
              <line x1="140" y1="240" x2="360" y2="240"/>
              <line x1="120" y1="280" x2="380" y2="280"/>
              <line x1="100" y1="320" x2="400" y2="320"/>
            </g>

            <!-- Triangle frame -->
            <polygon points="250,70 140,270 360,270" fill="none" stroke="#C5A03F" stroke-width="1.5" opacity=".5" filter="url(#glow)"/>

            <!-- Eye glow -->
            <circle cx="250" cy="180" r="55" fill="url(#eyeGlow)" opacity=".6"/>

            <!-- Eye shape -->
            <path d="M200 180 Q250 145 300 180 Q250 215 200 180Z" fill="#1A1610" stroke="#D9C077" stroke-width="1.5" filter="url(#glow)"/>
            <!-- Iris -->
            <circle cx="250" cy="180" r="18" fill="#0E0B07" stroke="#C5A03F" stroke-width="1.5" filter="url(#glow)"/>
            <!-- Pupil -->
            <circle cx="250" cy="180" r="9" fill="#FFD060" filter="url(#strongGlow)"/>
            <!-- Pupil core -->
            <circle cx="250" cy="180" r="4" fill="#FFF8E0" filter="url(#strongGlow)"/>

            <!-- Eye rays -->
            <g stroke="#C5A03F" stroke-width=".8" opacity=".4" filter="url(#glow)">
              <line x1="250" y1="158" x2="250" y2="130"/>
              <line x1="270" y1="163" x2="285" y2="138"/>
              <line x1="275" y1="180" x2="302" y2="180"/>
              <line x1="270" y1="197" x2="285" y2="222"/>
              <line x1="250" y1="202" x2="250" y2="230"/>
              <line x1="230" y1="197" x2="215" y2="222"/>
              <line x1="225" y1="180" x2="198" y2="180"/>
              <line x1="230" y1="163" x2="215" y2="138"/>
            </g>

            <!-- Corner symbols -->
            <text x="80"  y="100" fill="#7A5C18" font-size="20" opacity=".6" filter="url(#glow)">𓂀</text>
            <text x="400" y="100" fill="#7A5C18" font-size="20" opacity=".6" filter="url(#glow)">𓃭</text>
            <text x="60"  y="360" fill="#5C4A18" font-size="16" opacity=".4">𓆣</text>
            <text x="415" y="360" fill="#5C4A18" font-size="16" opacity=".4">𓅓</text>
          </svg>
        </div>

        <!-- Title -->
        <div class="hero-title">YES<em>ITS</em>PONZI</div>

        <!-- CTA -->
        <button class="btn-seuil" id="btn-seuil">
          <span class="btn-seuil-icon">𓂀</span>
          AFFRANCHIR LE SEUIL
          <span class="btn-seuil-icon">𓂀</span>
        </button>

        <!-- Stone tablet cards -->
        <div class="tablet-row">
          <div class="tablet-card">
            <span class="tablet-icon">🔺</span>
            <div class="tablet-title">Archives</div>
            <div class="tablet-desc">Chaque pyramide bâtie est gravée dans la pierre. Immortelle. Consultable pour toujours.</div>
          </div>
          <div class="tablet-card">
            <span class="tablet-icon">𓆣</span>
            <div class="tablet-title">Réseau</div>
            <div class="tablet-desc">Recrute. Chaque initié via ton lien renforce ta pyramide. En cascade. Sans limite.</div>
          </div>
          <div class="tablet-card">
            <span class="tablet-icon">𓂀</span>
            <div class="tablet-title">Sécurité</div>
            <div class="tablet-desc">Zéro argent en jeu. Oui c'est un ponzi. On l'affiche. C'est le concept. C'est le jeu.</div>
          </div>
        </div>

      </div>

      <!-- COUNTDOWN -->
      <div class="cd-section">
        <div class="cd-eyebrow">Round I — lancement dans</div>
        <div class="cd-grid">
          <div class="cd-b"><div class="cd-n" id="pre-d">00</div><div class="cd-l">jours</div></div>
          <div class="cd-col">:</div>
          <div class="cd-b"><div class="cd-n" id="pre-h">00</div><div class="cd-l">heures</div></div>
          <div class="cd-col">:</div>
          <div class="cd-b"><div class="cd-n" id="pre-m">00</div><div class="cd-l">min</div></div>
          <div class="cd-col">:</div>
          <div class="cd-b"><div class="cd-n" id="pre-s">00</div><div class="cd-l">sec</div></div>
        </div>
      </div>

      <!-- WAITLIST -->
      <div class="wl-wrap">
        <div class="wl-box">
          <div class="wl-head">𓂀 — être notifié au lancement — 𓂀</div>
          <div class="wl-flex">
            <input class="wl-input" id="wl-email" type="email" placeholder="ton@email.com">
            <button class="wl-btn" id="wl-btn">INSCRIRE →</button>
          </div>
          <div class="wl-done" id="wl-done">𓂀  Gravé. Tu seras prévenu au lancement.</div>
          <div class="wl-count-line" id="wl-cnt">chargement...</div>
        </div>
      </div>

      ${renderWarRoom()}

      <!-- RULES -->
      <div class="rules-wrap">
        <div class="rules-h">Les lois.<br><span>Gravées dans la pierre.</span></div>
        <div class="rules-intro">Pas d'ambiguïté. Pas de promesse cachée. Voilà ce que tu signes en entrant.</div>
        ${rule(1, "Tu t'inscris. Tu reçois un lien unique.", "Dès que tu crées ta pyramide, tu as un lien de parrainage. <strong>C'est ton seul outil.</strong>")}
        ${rule(2, "Chaque initié via ton lien = +1 membre.", "Leurs recrues comptent aussi. En cascade. <strong>Infinie.</strong>")}
        ${rule(3, "Tu vois pas les autres pyramides. Juste ton rang.", "T'as ton dashboard : tes membres, ta position, l'écart. <strong>Rien d'autre.</strong>")}
        ${rule(4, "72H. Timer visible.", "Le round dure exactement <strong>72 heures.</strong>")}
        ${rule(5, "Le winner prend TOUT LE SITE.", "<strong>Son nom. Son projet. Ses réseaux.</strong> Affichés à tous les visiteurs. Pour toujours.")}
        ${rule(6, "Hall of fame éternel.", "Les anciens winners restent gravés. <strong>Pour toujours.</strong>")}
      </div>

      <!-- HONESTY -->
      <div class="honesty">
        <div class="h-inner">
          <div class="h-icon">⚠️</div>
          <div>
            <div class="h-tag">! Avertissement — Soyons honnêtes</div>
            <div class="h-body">
              C'est <strong>une pyramide de recrutement.</strong> On l'assume totalement. C'est dans le nom.<br>
              Les premiers ont un avantage sur les derniers. <strong>C'est la mécanique.</strong><br>
              Zéro argent en jeu. Que de la visibilité. <strong>Que de la fierté d'avoir bâti la plus grande pyramide.</strong><br>
              T'es libre d'entrer. T'es libre de sortir. <strong>Personne force personne.</strong>
            </div>
          </div>
        </div>
      </div>

      <footer class="site-footer">
        <span>𓂀 YESITSPONZI © 2026</span>
        <span>ZÉRO ARGENT · 100% FIERTÉ</span>
        <span>ROUND I À VENIR</span>
      </footer>
    </div>
  `
}

function rule(n, title, desc) {
  return `<div class="rule">
    <div class="rn">0${n}</div>
    <div><div class="rt">${title}</div><div class="rd">${desc}</div></div>
  </div>`
}

export function initPreScreen() {
  startTimer((phase, parts) => {
    if (phase === 'pre' && parts) {
      const e = id => document.getElementById(id)
      const pad = n => String(Math.max(0,n)).padStart(2,'0')
      if (e('pre-d')) e('pre-d').textContent = pad(parts.days)
      if (e('pre-h')) e('pre-h').textContent = pad(parts.hours)
      if (e('pre-m')) e('pre-m').textContent = pad(parts.mins)
      if (e('pre-s')) e('pre-s').textContent = pad(parts.secs)
    }
  })
  document.getElementById('wl-btn')?.addEventListener('click', submitWL)
  document.getElementById('wl-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitWL() })
  document.getElementById('btn-seuil')?.addEventListener('click', () => {
    document.querySelector('.cd-section')?.scrollIntoView({ behavior: 'smooth' })
  })
  loadWLCount()
  initWarRoom()
}

async function submitWL() {
  const email = document.getElementById('wl-email')?.value.trim()
  if (!email || !email.includes('@')) return toast('Email valide svp !')
  const { error } = await Waitlist.add(email)
  if (error?.code === '23505') return toast("T'es déjà inscrit !")
  if (error) return toast('Erreur, réessaie.')
  document.getElementById('wl-done').style.display = 'block'
  document.querySelector('.wl-flex').style.display = 'none'
  loadWLCount()
}

async function loadWLCount() {
  const { count } = await Waitlist.count()
  const el = document.getElementById('wl-cnt')
  if (el) el.innerHTML = `<span>${count || 0}</span> initiés sur la liste`
}
