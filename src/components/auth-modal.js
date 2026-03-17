import { Auth } from '../lib/auth.js'
import { toast } from '../lib/utils.js'

let onSuccessCb = null

export function renderAuthModal() {
  return `
    <div id="auth-modal">
      <div class="am-box">
        <button class="am-close" id="am-close">✕</button>

        <div class="am-tabs">
          <div class="am-tab on" data-tab="signin">Connexion</div>
          <div class="am-tab" data-tab="signup">Inscription</div>
        </div>

        <!-- SIGN IN -->
        <div class="am-panel on" id="panel-signin">
          <div class="am-title">Content de te revoir.</div>
          <div class="am-sub">Connecte-toi pour gérer ta pyramide.</div>
          <div class="am-field">
            <label>Email</label>
            <input id="si-email" type="email" placeholder="ton@email.com" autocomplete="email">
          </div>
          <div class="am-field">
            <label>Mot de passe</label>
            <input id="si-pass" type="password" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="am-btn" id="si-btn">CONNEXION →</button>
          <div class="am-switch">Pas de compte ? <span id="go-signup">Inscris-toi</span></div>
        </div>

        <!-- SIGN UP -->
        <div class="am-panel" id="panel-signup">
          <div class="am-title">Entre dans le jeu.</div>
          <div class="am-sub">Crée un compte pour lancer ta pyramide.</div>
          <div class="am-field">
            <label>Email</label>
            <input id="su-email" type="email" placeholder="ton@email.com" autocomplete="email">
          </div>
          <div class="am-field">
            <label>Mot de passe</label>
            <input id="su-pass" type="password" placeholder="8 caractères min" autocomplete="new-password">
          </div>
          <div class="am-field">
            <label>Pseudo</label>
            <input id="su-pseudo" type="text" placeholder="TonNom" maxlength="30">
          </div>
          <button class="am-btn" id="su-btn">CRÉER MON COMPTE →</button>
          <div class="am-switch">Déjà un compte ? <span id="go-signin">Connexion</span></div>
        </div>

      </div>
    </div>
  `
}

export function initAuthModal(onSuccess) {
  onSuccessCb = onSuccess

  // Tabs
  document.querySelectorAll('.am-tab').forEach(el => {
    el.addEventListener('click', function () {
      const tab = this.dataset.tab
      document.querySelectorAll('.am-tab').forEach(t => t.classList.remove('on'))
      document.querySelectorAll('.am-panel').forEach(p => p.classList.remove('on'))
      this.classList.add('on')
      document.getElementById('panel-' + tab).classList.add('on')
    })
  })

  document.getElementById('go-signup').addEventListener('click', () => {
    document.querySelectorAll('.am-tab')[1].click()
  })
  document.getElementById('go-signin').addEventListener('click', () => {
    document.querySelectorAll('.am-tab')[0].click()
  })

  // Close
  document.getElementById('am-close').addEventListener('click', closeAuthModal)
  document.getElementById('auth-modal').addEventListener('click', e => {
    if (e.target.id === 'auth-modal') closeAuthModal()
  })

  // Sign in
  document.getElementById('si-btn').addEventListener('click', handleSignIn)
  document.getElementById('si-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignIn()
  })

  // Sign up
  document.getElementById('su-btn').addEventListener('click', handleSignUp)
  document.getElementById('su-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignUp()
  })
}

export function openAuthModal(tab = 'signin') {
  const modal = document.getElementById('auth-modal')
  if (!modal) return
  modal.classList.add('open')
  document.querySelectorAll('.am-tab').forEach(t =>
    t.classList.toggle('on', t.dataset.tab === tab)
  )
  document.querySelectorAll('.am-panel').forEach(p =>
    p.classList.toggle('on', p.id === 'panel-' + tab)
  )
  setTimeout(() => {
    document.getElementById(tab === 'signin' ? 'si-email' : 'su-email')?.focus()
  }, 100)
}

export function closeAuthModal() {
  document.getElementById('auth-modal')?.classList.remove('open')
}

async function handleSignIn() {
  const email = document.getElementById('si-email').value.trim()
  const pass  = document.getElementById('si-pass').value
  if (!email || !pass) return toast('Email + mot de passe requis')

  const btn = document.getElementById('si-btn')
  btn.disabled = true; btn.textContent = 'connexion...'

  const { error } = await Auth.signIn(email, pass)

  btn.disabled = false; btn.textContent = 'CONNEXION →'

  if (error) return toast('Erreur: ' + error.message)
  toast('Connecté 🔺')
  closeAuthModal()
  onSuccessCb?.()
}

async function handleSignUp() {
  const email  = document.getElementById('su-email').value.trim()
  const pass   = document.getElementById('su-pass').value
  const pseudo = document.getElementById('su-pseudo').value.trim()
  if (!email || !pass || !pseudo) return toast('Tous les champs requis')
  if (pass.length < 8) return toast('Mot de passe: 8 caractères min')

  const btn = document.getElementById('su-btn')
  btn.disabled = true; btn.textContent = 'création...'

  const { data, error } = await Auth.signUp(email, pass)

  btn.disabled = false; btn.textContent = 'CRÉER MON COMPTE →'

  if (error) return toast('Erreur: ' + error.message)

  // Save pseudo to user metadata
  if (data.user) {
    await import('../lib/supabase.js').then(({ sb }) =>
      sb.auth.updateUser({ data: { pseudo } })
    )
  }

  toast('Compte créé ! Vérifie ton email 📬')
  closeAuthModal()
  onSuccessCb?.()
}
