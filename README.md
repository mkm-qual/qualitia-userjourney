# Qualitia — User Journey Map

A collaborative, real-time editable user journey map for the Qualitia team.

## 🚀 Deploy (get a public link in ~3 min)

### Option A — Render.com (recommended, free, persistent storage)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mkm-qual/qualitia-userjourney)

1. Click the button above → Sign in / create a free Render account
2. Click **Apply** — Render builds and deploys automatically
3. Your public URL appears under **Dashboard → Service → Settings → URL** (looks like `https://qualitia-userjourney.onrender.com`)

> Data persists via the Render Disk defined in `render.yaml`.

### Option B — Railway (alternative)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `mkm-qual/qualitia-userjourney`
3. Add env var: `DB_DIR=/data` and attach a Volume at `/data`
4. Click **Generate Domain** under Settings → Networking

---

## Features

- **Real-time collaboration** — changes sync every 4 seconds across all logged-in users
- **Editable phases & cells** — click any cell to edit inline; phase names are also editable
- **Add / reorder / delete phases** — full phase management
- **Undo / Redo** — up to 20 steps (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`)
- **Save button** — `Ctrl+S` or click Save; everyone sees the latest update immediately
- **Admin panel** — add users, reset passwords, manage roles (admin / user)
- **User authentication** — every stakeholder has their own login

## Default Login

| Username | Password    | Role  |
|----------|------------|-------|
| `admin`  | `Admin@123` | Admin |

> **First thing to do:** Log in as admin → click Users → Reset PW for the admin account.

## Local Development

```bash
# Install all dependencies
npm install

# Build the React frontend
npm run build

# Start the server (serves both API and frontend)
npm start
```

Open http://localhost:3001

For hot-reload development:
```bash
# Terminal 1 — backend
npm run dev:server

# Terminal 2 — frontend (with HMR)
npm run dev:client
# Open http://localhost:5173
```

## Environment Variables

| Variable     | Default                            | Description                         |
|--------------|------------------------------------|-------------------------------------|
| `PORT`       | `3001`                             | Server port                         |
| `JWT_SECRET` | `qualitia-journey-secret-2024`     | **Change this in production!**      |
| `DB_DIR`     | app root                           | Directory where `data/` is stored   |
