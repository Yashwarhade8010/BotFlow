# BotFlow — WhatsApp AI SaaS

Full-stack app built with:
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL + Sequelize ORM
- **Real-time**: Socket.io
- **AI**: Claude (Anthropic) · GPT-4o (OpenAI) · Gemini Pro (Google)
- **WhatsApp**: Meta Cloud API v19.0

---

## 📁 Project Structure

```
botflow-app/
├── server/          # Node.js + Express + Sequelize
│   ├── src/
│   │   ├── config/      # MySQL DB connection
│   │   ├── models/      # Sequelize models (User, Bot, Conversation, etc.)
│   │   ├── controllers/ # Route controllers
│   │   ├── services/    # AI, WhatsApp, Socket.io, Knowledge
│   │   ├── middleware/  # Auth JWT middleware
│   │   ├── routes/      # Express routes
│   │   └── server.js    # Entry point
│   ├── uploads/         # Uploaded knowledge files
│   └── .env.example
│
└── client/          # React + Vite
    ├── src/
    │   ├── context/     # Auth + Socket contexts
    │   ├── services/    # Axios API client
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # All pages (Login, Signup, Dashboard, etc.)
    │   └── main.jsx
    └── index.html
```

---

## ⚡ Quick Start

### 1. MySQL Setup

Create the database:
```sql
CREATE DATABASE botflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL credentials and API keys

npm install
npm run dev
# API runs at http://localhost:5000
```

The server uses Sequelize `sync({ alter: true })` in development, so tables are auto-created on first run.

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
# App runs at http://localhost:3000
```

Requests to `/api` are proxied to `http://localhost:5000` via Vite config.

---

## 🔑 Required Environment Variables

```env
# MySQL
DB_HOST=localhost
DB_NAME=botflow
DB_USER=root
DB_PASSWORD=yourpassword

# JWT (generate random 64-char strings)
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# AI APIs (add whichever you need)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AIza...

# WhatsApp
WHATSAPP_API_VERSION=v19.0
```

---

## 🗃️ MySQL Schema (auto-created by Sequelize)

| Table              | Description                          |
|--------------------|--------------------------------------|
| `users`            | User accounts, plans, usage          |
| `bots`             | Bot configs, WhatsApp credentials    |
| `conversations`    | Conversation threads                 |
| `messages`         | Individual messages in conversations |
| `knowledge_sources`| Uploaded files, text, URLs           |
| `daily_stats`      | Aggregated daily analytics           |

---

## 🚀 Production Deployment

```bash
# Build frontend
cd client && npm run build

# Start backend (serves React build from /client/dist)
cd server
NODE_ENV=production node src/server.js

# Or use PM2
pm2 start src/server.js --name botflow
```

Update `server/.env`:
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com
```

---

## 📡 API Endpoints

| Method | Path                             | Description               |
|--------|----------------------------------|---------------------------|
| POST   | /api/auth/register               | Register new user         |
| POST   | /api/auth/login                  | Login                     |
| GET    | /api/auth/me                     | Get current user          |
| GET    | /api/bots                        | List bots                 |
| POST   | /api/bots                        | Create bot                |
| PUT    | /api/bots/:id                    | Update bot                |
| PATCH  | /api/bots/:id/status             | Activate / pause          |
| POST   | /api/bots/:id/whatsapp/connect   | Connect WhatsApp          |
| GET    | /api/conversations               | List conversations        |
| POST   | /api/conversations/:id/reply     | Agent reply               |
| PATCH  | /api/conversations/:id/resolve   | Resolve conversation      |
| GET    | /api/knowledge/:botId            | List knowledge sources    |
| POST   | /api/knowledge/:botId/upload     | Upload file               |
| GET    | /api/analytics/overview          | Dashboard analytics       |
| GET/POST | /api/webhook/:verifyToken      | WhatsApp webhook          |

---

## 📱 WhatsApp Webhook Setup

1. Get a Phone Number ID and Access Token from Meta Developer Console
2. Set your webhook URL to: `https://yourdomain.com/api/webhook/<verify_token>`
3. The verify_token is generated per-bot when you create it
4. Connect in BotFlow's Onboarding Step 4 or Settings > WhatsApp
