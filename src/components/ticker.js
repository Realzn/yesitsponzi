const MSGS = [
  "YESITSPONZI.COM",
  "OUI C'EST UN PONZI",
  "CRÉE TA PYRAMIDE",
  "RECRUTE OU MEURS",
  "LE WINNER PREND TOUT LE SITE",
  "ROUND 1 — 72H",
  "ZÉRO ARGENT 100% FIERTÉ",
  "PREMIER ARRIVÉ PREMIER GAGNÉ",
  "LE SITE T'APPARTIENT SI TU GAGNES",
  "YES. IT'S A PONZI. AND ?",
]

export function renderTicker() {
  const content = [...MSGS, ...MSGS].map(m => `${m}<span class="ts">◆</span>`).join(' ')
  return `
    <div id="ticker">
      <div class="tk-inner">${content}</div>
    </div>
  `
}
