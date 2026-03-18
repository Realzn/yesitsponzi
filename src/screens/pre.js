import { Waitlist } from '../lib/supabase.js'
import { toast } from '../lib/utils.js'
import { startTimer } from '../components/timer.js'
import { renderWarRoom, initWarRoom } from '../components/war-room.js'
import { store } from '../lib/store.js'
import { esc } from '../lib/utils.js'

export function renderPreScreen() {
  return `<div id="screen-pre" class="screen active">

    <!-- ── HERO ──────────────────────────────────── -->
    <section class="lp-hero" id="lp-hero">
      <div class="hiero-strip"><div class="hiero-inner">𓂀 𓃭 𓅓 𓆣 𓄿 𓆑 𓃀 𓅱 𓏏 𓂋 𓈖 𓂀 𓃭 𓅓 𓆣 𓄿 𓆑 𓃀 𓅱 𓏏 𓂋 𓈖 𓂀 𓃭 𓅓 𓆣 𓄿 𓆑 𓃀 𓅱 𓏏 𓂋 𓈖</div></div>

      <div class="lp-hero-inner">
        <div class="lp-pyramid-col">
          ${PYRAMID_SVG}
        </div>
        <div class="lp-hero-content">
          <div class="lp-eyebrow">𓂀 — Round I en cours —</div>
          <h1 class="lp-title">YES<em>ITS</em><br>PONZI</h1>
          <p class="lp-sub">Bâtis ta pyramide.<br>Recrute. Domine.<br>Le plus grand prend <strong>tout le site.</strong></p>

          <!-- Countdown -->
          <div class="lp-cd" id="lp-cd">
            <div class="lp-cd-block"><span class="lp-cd-n" id="lp-h">00</span><span class="lp-cd-l">HEURES</span></div>
            <div class="lp-cd-sep">:</div>
            <div class="lp-cd-block"><span class="lp-cd-n" id="lp-m">00</span><span class="lp-cd-l">MIN</span></div>
            <div class="lp-cd-sep">:</div>
            <div class="lp-cd-block"><span class="lp-cd-n" id="lp-s">00</span><span class="lp-cd-l">SEC</span></div>
          </div>

          <div class="lp-ctas">
            <button class="btn-seuil" id="btn-signup-hero">
              <span>𓂀</span> AFFRANCHIR LE SEUIL <span>𓂀</span>
            </button>
            <button class="btn-seuil btn-seuil--ghost" id="btn-scroll-how">
              COMMENT ÇA MARCHE ↓
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── SCROLLYTELLING ─────────────────────────── -->
    <section class="lp-scroll" id="lp-scroll">
      <div class="lp-scroll-sticky">
        <div class="lp-scroll-pyr" id="scroll-pyr">
          ${SCROLL_PYRAMID}
        </div>
      </div>
      <div class="lp-scroll-steps">
        <div class="lp-step" data-step="0">
          <div class="step-num">01</div>
          <h3 class="step-title">Tu crées ta pyramide</h3>
          <p class="step-body">Un nom, un emoji, ce que tu veux promouvoir. En 30 secondes, tu as un lien unique à partager. C'est ton seul outil.</p>
        </div>
        <div class="lp-step" data-step="1">
          <div class="step-num">02</div>
          <h3 class="step-title">Tu recrutes. En cascade.</h3>
          <p class="step-body">Chaque personne via ton lien = un bloc sous toi. Leurs recrues aussi. En cascade infinie. Plus tu recrutes tôt, plus tu es haut.</p>
        </div>
        <div class="lp-step" data-step="2">
          <div class="step-num">03</div>
          <h3 class="step-title">Le timer tombe. Tu gagnes.</h3>
          <p class="step-body">À la fin du compte à rebours, la pyramide avec le plus de membres gagne. Le winner prend tout le site pour promouvoir ce qu'il veut.</p>
        </div>
        <div class="lp-step" data-step="3">
          <div class="step-num">04</div>
          <h3 class="step-title">Ta pyramide est immortelle.</h3>
          <p class="step-body">Chaque membre = un bloc cliquable. Visible. Pour toujours. Même les perdants laissent une trace dans le hall of fame.</p>
        </div>
      </div>
    </section>

    <!-- ── BLUR REVEAL ────────────────────────────── -->
    <section class="lp-reward">
      <div class="lp-section-label">LA RÉCOMPENSE</div>
      <h2 class="lp-section-title">Ce que le winner obtient</h2>
      <p class="lp-section-sub">L'espace promotionnel central. Ton nom. Tes liens. Tes projets. Visibles de tous les visiteurs. Pour toujours.</p>

      <div class="reward-preview">
        <div class="reward-mockup" id="reward-mockup">
          <div class="rm-header">
            <div class="rm-title blurred" id="rm-name">🏆 PYRAMIDE GAGNANTE</div>
            <div class="rm-sub blurred">Champion du Round I</div>
          </div>
          <div class="rm-grid">
            <div class="rm-block blurred">
              <div class="rmb-emoji">🎵</div>
              <div class="rmb-name">Mon projet musical</div>
              <div class="rmb-link">soundcloud.com/***</div>
            </div>
            <div class="rm-block blurred">
              <div class="rmb-emoji">📱</div>
              <div class="rmb-name">Mon Instagram</div>
              <div class="rmb-link">instagram.com/***</div>
            </div>
            <div class="rm-block blurred">
              <div class="rmb-emoji">🚀</div>
              <div class="rmb-name">Mon projet SaaS</div>
              <div class="rmb-link">myapp.io/***</div>
            </div>
            <div class="rm-block blurred">
              <div class="rmb-emoji">🎨</div>
              <div class="rmb-name">Mon portfolio</div>
              <div class="rmb-link">behance.net/***</div>
            </div>
          </div>
          <div class="rm-overlay" id="rm-overlay">
            <button class="btn-reveal" id="btn-reveal">𓂀 LEVER LE VOILE</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── LISTBOARD PREVIEW ──────────────────────── -->
    <section class="lp-listboard">
      <div class="lp-section-label">LISTBOARD LIVE</div>
      <h2 class="lp-section-title">Les pyramides en guerre</h2>
      <p class="lp-section-sub">Les pyramides actives en ce moment. Rejoins une existante ou bâtis la tienne.</p>

      <div class="lb-preview-grid" id="lb-preview-grid">
        <div class="lb-preview-empty">Chargement des pyramides...</div>
      </div>

      <div class="lp-listboard-cta">
        <button class="btn-seuil" id="btn-see-all">VOIR TOUT LE LISTBOARD →</button>
      </div>
    </section>

    <!-- ── WAR ROOM ───────────────────────────────── -->
    ${renderWarRoom()}

    <!-- ── FAQ ───────────────────────────────────── -->
    <section class="lp-faq">
      <div class="lp-section-label">FAQ</div>
      <h2 class="lp-section-title">Questions directes.<br>Réponses honnêtes.</h2>
      <div class="faq-list" id="faq-list">
        ${FAQ.map((f, i) => `
          <div class="faq-item" data-i="${i}">
            <button class="faq-q" onclick="toggleFaq(${i})">
              <span>${f.q}</span>
              <span class="faq-icon">+</span>
            </button>
            <div class="faq-a" id="faq-a-${i}"><div class="faq-a-inner">${f.a}</div></div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ── FINAL CTA ──────────────────────────────── -->
    <section class="lp-final-cta">
      <div class="lp-fc-content">
        <div class="lp-fc-hiero">𓂀 𓃭 𓆣 𓅓 𓂀 𓃭 𓆣 𓅓</div>
        <h2 class="lp-fc-title">La pyramide se bâtit<br>pendant que tu lis ceci.</h2>
        <p class="lp-fc-sub">Les premiers inscrits ont déjà une longueur d'avance.</p>
        <button class="btn-seuil btn-seuil--large" id="btn-signup-final">
          <span>𓂀</span> CRÉER MA PYRAMIDE <span>𓂀</span>
        </button>
      </div>
    </section>

    <footer class="site-footer">
      <span>𓂀 YESITSPONZI © 2026</span>
      <span>ZÉRO ARGENT · 100% FIERTÉ</span>
      <span>ROUND I EN COURS</span>
    </footer>
  </div>`
}

export function initPreScreen(onSignupClick) {
  // Timer
  startTimer((phase, parts) => {
    const pad = n => String(Math.max(0,n)).padStart(2,'0')
    if (parts) {
      const h = document.getElementById('lp-h')
      const m = document.getElementById('lp-m')
      const s = document.getElementById('lp-s')
      if (h) h.textContent = pad(parts.hours + parts.days * 24)
      if (m) m.textContent = pad(parts.mins)
      if (s) s.textContent = pad(parts.secs)
    }
  })

  // Signup buttons
  ;['btn-signup-hero','btn-signup-final'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => onSignupClick?.())
  })

  // Scroll to how it works
  document.getElementById('btn-scroll-how')?.addEventListener('click', () => {
    document.getElementById('lp-scroll')?.scrollIntoView({ behavior: 'smooth' })
  })
  document.getElementById('btn-see-all')?.addEventListener('click', () => {
    document.getElementById('lp-scroll')?.scrollIntoView({ behavior: 'smooth' })
  })

  // Scrollytelling
  initScrollytelling()

  // Blur reveal
  document.getElementById('btn-reveal')?.addEventListener('click', () => {
    document.querySelectorAll('.blurred').forEach(el => el.classList.add('revealed'))
    const overlay = document.getElementById('rm-overlay')
    if (overlay) overlay.style.opacity = '0'
    setTimeout(() => { if (overlay) overlay.style.display = 'none' }, 500)
  })

  // Listboard preview
  renderListboardPreview()

  // War room
  initWarRoom()
}

function initScrollytelling() {
  const steps = document.querySelectorAll('.lp-step')
  if (!steps.length) return

  const pyr = document.getElementById('scroll-pyr')
  const levels = pyr?.querySelectorAll('.sp-level')

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const step = parseInt(entry.target.dataset.step)
      steps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === step))
      // Animate pyramid levels
      levels?.forEach((l, i) => {
        l.classList.toggle('lit', i <= step)
      })
    })
  }, { threshold: .5 })

  steps.forEach(s => observer.observe(s))
}

function renderListboardPreview() {
  const grid = document.getElementById('lb-preview-grid')
  if (!grid) return
  const sorted = store.getSorted().slice(0, 6)
  if (!sorted.length) {
    grid.innerHTML = '<div class="lb-preview-empty">Aucune pyramide encore. Sois le premier.</div>'
    return
  }
  grid.innerHTML = sorted.map((p, i) => {
    const cnt = store.state.memberCounts[p.id] || 0
    return `
      <div class="lb-preview-card">
        <div class="lbpc-rank">${i === 0 ? '👑' : '#' + (i+1)}</div>
        <div class="lbpc-emoji">${p.emoji || '🔺'}</div>
        <div class="lbpc-name">${esc(p.name || p.pseudo || '—')}</div>
        <div class="lbpc-stats"><strong>${cnt}</strong> membres</div>
        <div class="lbpc-blur-cta">Connecte-toi pour candidater →</div>
      </div>
    `
  }).join('')
}

function toggleFaq(i) {
  const answer = document.getElementById('faq-a-' + i)
  const item   = answer?.closest('.faq-item')
  if (!answer) return
  const isOpen = item?.classList.contains('open')
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'))
  document.querySelectorAll('.faq-a').forEach(el => el.style.maxHeight = '0')
  document.querySelectorAll('.faq-icon').forEach(el => el.textContent = '+')
  if (!isOpen) {
    item.classList.add('open')
    answer.style.maxHeight = answer.scrollHeight + 'px'
    item.querySelector('.faq-icon').textContent = '−'
  }
}
window.toggleFaq = toggleFaq

// ── DATA ────────────────────────────────────────────────────
const FAQ = [
  { q: "C'est vraiment légal ?", a: "Oui. Il n'y a aucun argent en jeu. La récompense est de la visibilité — pas de l'argent. Un système de parrainage avec récompense non-financière n'est pas une pyramide financière au sens juridique. On l'appelle ponzi par humour et par honnêteté sur la mécanique." },
  { q: "Qu'est-ce que le 'winner' obtient exactement ?", a: "Son nom en grand sur la homepage. Chaque bloc de sa pyramide devient cliquable — son profil, son lien, sa promo. Tous les visiteurs du site voient ça jusqu'au prochain round. C'est une vitrine promotionnelle réelle." },
  { q: "Combien de temps dure un round ?", a: "72 heures exactement. Après quoi le classement est figé, le winner est annoncé, et un nouveau round peut démarrer." },
  { q: "Puis-je rejoindre une pyramide sans en créer une ?", a: "Oui. Tu reçois un lien de parrainage d'un membre existant, tu cliques, tu rejoins sa pyramide. Tu peux aussi candidater via le Listboard pour rejoindre une pyramide qui t'intéresse." },
  { q: "Que se passe-t-il si un membre quitte ?", a: "Sa position se libère. Son premier recru direct prend automatiquement sa place. Les autres recrues se redistribuent sous le nouveau nœud. La structure ne s'effondre jamais." },
  { q: "Y a-t-il un avantage à être le premier ?", a: "Oui, clairement. Les premiers inscrits partent en tête du classement. C'est voulu — c'est la mécanique du jeu. On l'assume, on l'affiche." },
  { q: "Puis-je changer de pyramide en cours de route ?", a: "Oui, via le Listboard. Tu envoies une candidature à une autre pyramide. Si le créateur accepte, tu quittes automatiquement la tienne (avec réarrangement) et tu rejoins la nouvelle." },
]

// ── SVGs ────────────────────────────────────────────────────
const PYRAMID_SVG = `
  <svg class="hero-pyr-svg" viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="eyeG" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#FFD060" stop-opacity=".95"/>
        <stop offset="50%"  stop-color="#C5A03F" stop-opacity=".6"/>
        <stop offset="100%" stop-color="#8A6018" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="baseG" cx="50%" cy="100%" r="60%">
        <stop offset="0%"   stop-color="#BF8F30" stop-opacity=".25"/>
        <stop offset="100%" stop-color="#0E0B07" stop-opacity="0"/>
      </radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="sglow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="face" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%"   stop-color="#5C4E38"/><stop offset="100%" stop-color="#1A1610"/>
      </linearGradient>
      <linearGradient id="left" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stop-color="#3A3020"/><stop offset="100%" stop-color="#1A1610"/>
      </linearGradient>
      <linearGradient id="right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#2E2618"/><stop offset="100%" stop-color="#141208"/>
      </linearGradient>
    </defs>
    <ellipse cx="250" cy="395" rx="200" ry="28" fill="url(#baseG)"/>
    <polygon points="250,28 48,382 250,382"  fill="url(#left)"  stroke="#5C4E38" stroke-width=".5"/>
    <polygon points="250,28 452,382 250,382" fill="url(#right)" stroke="#3A3020" stroke-width=".5"/>
    <polygon points="250,28 48,382 452,382"  fill="url(#face)"  stroke="#6B5A3A" stroke-width="1"/>
    <line x1="250" y1="28" x2="48"  y2="382" stroke="#8A6018" stroke-width="2" opacity=".9" filter="url(#glow)"/>
    <line x1="250" y1="28" x2="452" y2="382" stroke="#8A6018" stroke-width="2" opacity=".9" filter="url(#glow)"/>
    <line x1="48"  y1="382" x2="452" y2="382" stroke="#6B5A3A" stroke-width="1" opacity=".6"/>
    <g opacity=".12" stroke="#C5A03F" stroke-width=".7" fill="none">
      <line x1="200" y1="120" x2="300" y2="120"/>
      <line x1="178" y1="165" x2="322" y2="165"/>
      <line x1="155" y1="210" x2="345" y2="210"/>
      <line x1="132" y1="255" x2="368" y2="255"/>
      <line x1="109" y1="300" x2="391" y2="300"/>
      <line x1="86"  y1="345" x2="414" y2="345"/>
    </g>
    <polygon points="250,72 138,272 362,272" fill="none" stroke="#C5A03F" stroke-width="1.5" opacity=".45" filter="url(#glow)"/>
    <circle cx="250" cy="178" r="58" fill="url(#eyeG)" opacity=".55"/>
    <path d="M198 178 Q250 142 302 178 Q250 214 198 178Z" fill="#1A1610" stroke="#D9C077" stroke-width="1.8" filter="url(#glow)"/>
    <circle cx="250" cy="178" r="19" fill="#0E0B07" stroke="#C5A03F" stroke-width="1.5" filter="url(#glow)"/>
    <circle cx="250" cy="178" r="9"  fill="#FFD060" filter="url(#sglow)"/>
    <circle cx="250" cy="178" r="4"  fill="#FFF8E0" filter="url(#sglow)"/>
    <g stroke="#C5A03F" stroke-width=".9" opacity=".35" filter="url(#glow)">
      <line x1="250" y1="156" x2="250" y2="126"/>
      <line x1="272" y1="162" x2="289" y2="136"/>
      <line x1="278" y1="178" x2="308" y2="178"/>
      <line x1="272" y1="194" x2="289" y2="220"/>
      <line x1="250" y1="200" x2="250" y2="230"/>
      <line x1="228" y1="194" x2="211" y2="220"/>
      <line x1="222" y1="178" x2="192" y2="178"/>
      <line x1="228" y1="162" x2="211" y2="136"/>
    </g>
    <text x="75"  y="95"  fill="#7A5C18" font-size="22" opacity=".5" filter="url(#glow)">𓂀</text>
    <text x="402" y="95"  fill="#7A5C18" font-size="22" opacity=".5" filter="url(#glow)">𓃭</text>
    <text x="55"  y="365" fill="#4A3810" font-size="17" opacity=".35">𓆣</text>
    <text x="420" y="365" fill="#4A3810" font-size="17" opacity=".35">𓅓</text>
  </svg>
`

const SCROLL_PYRAMID = `
  <div class="sp-wrap">
    <div class="sp-level sp-level-0"><div class="sp-block root">𓂀</div></div>
    <div class="sp-level sp-level-1"><div class="sp-block">👤</div><div class="sp-block">👤</div></div>
    <div class="sp-level sp-level-2"><div class="sp-block">👤</div><div class="sp-block">👤</div><div class="sp-block">👤</div><div class="sp-block">👤</div></div>
    <div class="sp-level sp-level-3"><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div><div class="sp-block sm">👤</div></div>
  </div>
`
