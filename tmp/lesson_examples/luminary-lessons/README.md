# 🦋 Luminary Lessons — Lyla Rae's AI Tutor

Lumi AI lesson platform for Lyla Rae. Two fully interactive lessons with a genuine AI tutor that responds to everything she says.

---

## Lessons

- **Maths — Fractions** with Match It game
- **History — Ancient Egyptians** with True or False game

---

## Setup (5 minutes)

### Step 1 — Get your API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in (or create a free account)
3. Go to **API Keys** → **Create Key**
4. Copy your key — it starts with `sk-ant-`

### Step 2 — Run locally

```bash
# Clone or download this folder, then:
cd luminary-lessons
npm install

# Create your .env file
cp .env.example .env

# Open .env and paste your API key:
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start the server
npm start

# Open in browser:
# http://localhost:3000
```

Lyla opens `http://localhost:3000` on any device on the same WiFi.

---

## Deploy to Vercel (permanent URL, any device anywhere)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# When asked, accept all defaults

# Then add your API key as an environment variable:
vercel env add ANTHROPIC_API_KEY
# Paste your key when prompted

# Redeploy with the env var:
vercel --prod
```

Vercel gives you a URL like `https://luminary-lessons.vercel.app` that works on any phone, tablet, or computer — no WiFi sharing needed.

---

## How it works

```
Lyla's device  →  /api/lumi (your server)  →  Anthropic API
                         ↑
                  API key lives here only
                  Never in the HTML files
```

The proxy server holds your API key securely. The lesson HTML files call `/api/lumi` which forwards to Anthropic. No CORS issues, no exposed keys.

---

## Adding more lessons

Duplicate any lesson HTML file in `public/` and update:
1. The `SYSTEM` constant — change the lesson topic and phases
2. The concept card HTML
3. The built-in game component
4. Update `index.html` with a link to the new lesson

---

## Files

```
luminary-lessons/
├── server.js          ← proxy server (holds API key)
├── package.json
├── vercel.json        ← Vercel deployment config
├── .env.example       ← copy to .env, add your key
├── .gitignore         ← keeps .env out of GitHub
└── public/
    ├── index.html             ← Lyla's lesson picker
    ├── maths-fractions.html   ← Fractions lesson
    └── history-egyptians.html ← Ancient Egyptians lesson
```
