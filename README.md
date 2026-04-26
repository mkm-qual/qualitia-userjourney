# Qualitia — User Journey Map

A collaborative, real-time editable user journey map for the Qualitia team.

## Features

- **Real-time collaboration** — changes sync every 4 seconds across all users
- **Editable phases & cells** — click any cell to edit; phase names are also editable
- **Add / reorder / delete phases** — full phase management
- **Undo / Redo** — up to 20 steps (`Ctrl+Z` / `Ctrl+Y`)
- **Save button** — `Ctrl+S` or click Save; everyone sees the latest immediately
- **Admin panel** — add users, reset passwords, manage roles
- **User authentication** — every stakeholder has their own login

## Default Login

| Username | Password   | Role  |
|----------|-----------|-------|
| `admin`  | `Admin@123` | Admin |

**Change the admin password after first login via Admin Panel → Reset PW.**

## Local Development

```bash
# Install all dependencies
npm run install:all

# Start backend (port 3001)
npm run dev:server

# In another terminal, start frontend (port 5173)
npm run dev:client
```

Open http://localhost:5173

## Deploy to Railway (free, ~1 min)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repository
4. Railway auto-detects `railway.toml` and builds + deploys
5. Under **Settings → Networking** → Generate Domain for your public URL

> **Data persistence**: Add a Railway Volume mounted at `/app` (`DB_DIR=/app`) so the SQLite database survives redeploys.

## Environment Variables

| Variable   | Default                          | Description              |
|-----------|----------------------------------|--------------------------|
| `PORT`    | `3001`                           | Server port              |
| `JWT_SECRET` | `qualitia-journey-secret-2024` | Change this in production! |
| `DB_DIR`  | app root                         | Directory for `qualitia.db` |
