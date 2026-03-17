# YESITSPONZI 🔺

> Crée ta pyramide. Recrute. Le winner prend tout le site. Oui c'est un ponzi.

## Stack

- **Frontend** : Vanilla JS + Vite
- **Backend** : Supabase (Postgres + Realtime)
- **Hosting** : Cloudflare Pages
- **Auth** : Aucune (site public)

## Structure

```
yesitsponzi/
├── index.html                    # Entry point
├── vite.config.js
├── package.json
├── .env.example                  # Variables à copier en .env
├── public/
│   └── _redirects                # SPA routing Cloudflare
├── src/
│   ├── main.js                   # Bootstrap + routing
│   ├── lib/
│   │   ├── supabase.js           # Client + requêtes DB
│   │   ├── store.js              # State global (pub/sub)
│   │   ├── config.js             # Constantes (dates, etc.)
│   │   └── utils.js              # Helpers (esc, ago, copy...)
│   ├── components/
│   │   ├── ticker.js             # Bande défilante
│   │   ├── header.js             # Header + badge
│   │   ├── timer.js              # Countdown + urgence
│   │   ├── pyramid-viz.js        # Visualisation pyramide winner
│   │   └── notification.js       # Notif nouveaux membres
│   ├── screens/
│   │   ├── pre.js                # Pre-launch (countdown + waitlist)
│   │   ├── live.js               # Round en cours (créer pyramide)
│   │   ├── dashboard.js          # Dashboard personnel
│   │   └── winner.js             # Showcase pyramide gagnante
│   └── styles/
│       └── main.css              # Design system complet
└── supabase/
    └── migrations/
        └── 001_init.sql          # Schema complet à exécuter
```

## Setup local

```bash
# 1. Clone et installe
git clone https://github.com/TOI/yesitsponzi
cd yesitsponzi
npm install

# 2. Variables d'environnement
cp .env.example .env
# Remplis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Base de données
# Va sur supabase.com → SQL Editor
# Colle le contenu de supabase/migrations/001_init.sql
# Execute

# 4. Lance le dev server
npm run dev
# → http://localhost:3000
```

## Déployer sur Cloudflare Pages

```bash
# Build
npm run build
# → génère /dist

# Option A : Via GitHub (recommandé)
# 1. Push sur GitHub
# 2. Cloudflare Pages → New project → Connect Git
# 3. Build command : npm run build
# 4. Build output dir : dist
# 5. Environment variables : ajoute VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY

# Option B : Via Wrangler CLI
npx wrangler pages deploy dist --project-name yesitsponzi
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL de ton projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon |
| `VITE_ROUND_LAUNCH` | Date de lancement (ISO 8601) |
| `VITE_ROUND_END` | Date de fin du round (ISO 8601) |

## Modifier les dates du round

Dans `.env` :
```
VITE_ROUND_LAUNCH=2026-03-14T20:00:00+01:00
VITE_ROUND_END=2026-03-17T20:00:00+01:00
```

## Logique des screens

```
maintenant < LAUNCH       → screen-pre    (countdown + waitlist)
LAUNCH < maintenant < END → screen-live   (créer pyramide)
                            screen-dashboard (si pyramide déjà créée)
maintenant > END          → screen-winner  (showcase + pyramide visuelle)
```
