const MSGS = [
  "YESITSPONZI.COM",
  "𓂀 OUI C'EST UN PONZI 𓂀",
  "CRÉE TA PYRAMIDE",
  "RECRUTE OU PÉRIS",
  "LE WINNER PREND TOUT LE SITE",
  "ROUND I — 72H",
  "NULL ARGENTUM · OMNIA GLORIA",
  "PREMIER INSCRIT · PREMIER SACRÉ",
  "LE SITE T'APPARTIENT SI TU GAGNES",
  "YES. IT'S A PONZI. AND?",
  "𓆣 ORDINEM PYRÆMIDUM 𓆣",
]

export function renderTicker() {
  const content = [...MSGS, ...MSGS].map(m => `<span class="tk-item">${m}</span><span class="ts">◈</span>`).join(' ')
  return `<div id="ticker"><div class="tk-inner">${content}</div></div>`
}
