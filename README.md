# 🏥 Rapid Care Ghana — v5

**Production-ready** emergency health response web app.
Montserrat font · Dark mode · Real icons · Google OAuth · PostgreSQL · Hosting-ready

---

## Quick Start (Local Dev)

```bash
npm install
# Edit server/.env (see below)
npm run dev
# Open http://localhost:3000
```

### Test Accounts
| Email | Password | Role |
|---|---|---|
| patient@test.com | test123 | Patient |
| ama@test.com | test123 | Patient |
| doctor@test.com | test123 | Professional |
| nurse@test.com | test123 | Professional |

---

## server/.env Setup

```env
PORT=3000
JWT_SECRET=change_this_to_something_long_and_random
SESSION_SECRET=another_long_random_string

# PostgreSQL — local dev
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/rapidcare

# Google OAuth (optional — leave as-is to skip)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

FRONTEND_URL=http://localhost:3000
```

---

## Setting Up PostgreSQL Locally

```bash
# macOS
brew install postgresql && brew services start postgresql

# Ubuntu/WSL
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Create database
psql -U postgres -c "CREATE DATABASE rapidcare;"
```

Then set `DATABASE_URL=postgresql://postgres:@localhost:5432/rapidcare` in your `.env`.

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
6. Copy **Client ID** and **Client Secret** into `.env`

---

## Hosting on Railway (Recommended — Free Tier Available)

1. Push your project to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin in Railway (it gives you `DATABASE_URL` automatically)
4. Set environment variables in Railway dashboard:
   ```
   JWT_SECRET=...
   SESSION_SECRET=...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://yourapp.railway.app/api/auth/google/callback
   FRONTEND_URL=https://yourapp.railway.app
   NODE_ENV=production
   ```
5. Railway auto-detects `npm start` and deploys

---

## Hosting on Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Add a **PostgreSQL** database → copy the connection string
4. Set env vars same as Railway above
5. Build command: `npm install`  Start command: `node server/server.js`

---

## Hosting on Supabase (Database only)

Use Supabase just for the PostgreSQL database:
1. Create project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database** → copy the **Connection string (URI)**
3. Use that as `DATABASE_URL` — host your Node.js app on Railway/Render

---

## File Structure

```
rapid-care/
├── server/
│   ├── server.js              ← Express + session + passport setup
│   ├── db.js                  ← PostgreSQL connection + table init + seed
│   ├── passport.js            ← Google OAuth strategy
│   ├── .env                   ← Environment variables (never commit this!)
│   └── routes/
│       ├── auth.routes.js     ← Register, login, Google OAuth, delete account
│       └── emergency.routes.js← Profiles, contacts, requests, professionals
├── public/
│   ├── index.html             ← Landing / role selection
│   ├── logo.jpg               ← Rapid Care logo
│   ├── css/main.css           ← Full responsive stylesheet (dark mode, Montserrat)
│   ├── js/utils.js            ← API client, icons, dark mode, avatar dropdown
│   └── pages/
│       ├── login.html         ← Sign in + Google button
│       ├── register.html      ← Registration (patient + professional)
│       ├── dashboard.html     ← Patient dashboard (7 pages)
│       └── pro-dashboard.html ← Professional dashboard (5 pages)
└── package.json
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/google` | No | Start Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |
| GET | `/api/auth/me` | JWT | Get current user |
| DELETE | `/api/auth/account` | JWT | Delete account |
| GET | `/api/professionals/active` | JWT | List active professionals |
| GET/PUT | `/api/profile/medical` | JWT | Medical profile |
| GET/POST/DELETE | `/api/contacts` | JWT | Emergency contacts |
| POST | `/api/requests` | JWT | Create request |
| GET | `/api/requests/mine` | JWT | Patient's own requests |
| GET | `/api/requests/pending` | JWT | Pro: pending requests |
| GET | `/api/requests/active` | JWT | Pro: active cases |
| PATCH | `/api/requests/:id/status` | JWT | Pro: update status |
| GET/PUT | `/api/professional/profile` | JWT | Pro profile |
| PATCH | `/api/professional/status` | JWT | Active/duty toggle |

---

## Ghana Emergency Numbers

| Service | Number |
|---|---|
| National Emergency (NADMO) | 112 |
| Ghana Police | 191 |
| Fire & Ambulance | 192 |
| Ghana Health Service | 0800-110-011 |
| KATH Poison Control | +233-322-060-401 |
| Mental Health Helpline | 0800-111-222 |

---

**Web Dev Group 4** — ABDULAI Kassim · ANDERSON Sylvester · AMARQUAYE Joshua · AMEGATCHER David · SAM Kingsford · KWANING Collins · BRAIDE Paul · ADJEI Melissa · AFFUL Martin · TORGAH Delali
