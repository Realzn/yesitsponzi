import { pad, countdownParts } from '../lib/utils.js'
import { ROUND_LAUNCH, ROUND_END } from '../lib/config.js'

let _interval = null

export function startTimer(onChange) {
  if (_interval) clearInterval(_interval)
  _interval = setInterval(() => {
    const now = Date.now()
    if (now < ROUND_LAUNCH) {
      onChange('pre', countdownParts(ROUND_LAUNCH))
    } else if (now < ROUND_END) {
      onChange('live', countdownParts(ROUND_END))
    } else {
      onChange('done', null)
      clearInterval(_interval)
    }
  }, 1000)
  // Immediate tick
  const now = Date.now()
  if (now < ROUND_LAUNCH)      onChange('pre',  countdownParts(ROUND_LAUNCH))
  else if (now < ROUND_END)    onChange('live', countdownParts(ROUND_END))
  else                         onChange('done', null)
}

export function formatCountdown({ days, hours, mins, secs }) {
  return `
    <div class="cd-grid">
      <div class="cd-b"><div class="cd-n">${pad(days)}</div><div class="cd-l">jours</div></div>
      <div class="cd-col">:</div>
      <div class="cd-b"><div class="cd-n">${pad(hours)}</div><div class="cd-l">heures</div></div>
      <div class="cd-col">:</div>
      <div class="cd-b"><div class="cd-n">${pad(mins)}</div><div class="cd-l">min</div></div>
      <div class="cd-col">:</div>
      <div class="cd-b"><div class="cd-n">${pad(secs)}</div><div class="cd-l">sec</div></div>
    </div>
  `
}

export function urgencyMessage({ hours }) {
  if (hours < 2)  return '🚨 MOINS DE 2H. DERNIÈRE CHANCE.'
  if (hours < 6)  return `⚠️ ${hours}h restantes. Le timer attend personne.`
  if (hours < 24) return `${hours}h restantes. Recrute maintenant.`
  return ''
}
