# 🔭 Scout — Research Like an Architect. Finish Before Lunch.

Ever spent weeks reading docs, crawling developer forums, and reverse-engineering integrations — only to find out the API you picked is deprecated and incompatible with your stack? Yeah. We've been there. Scout was built specifically because that experience is **way too common** and **way too painful**.

Scout is an AI-powered API discovery and integration engine. You paste your GitHub repo link, tell Scout what you want, and it hands you back the top 3 APIs that actually fit your codebase — then forks your repo, writes the implementation, and opens a Pull Request. All while you sip your coffee.

---

## 🚀 What It Does

**Step 1 — Drop your repo link**
Scout takes your GitHub URL and your plain-English description of what you need.

**Step 2 — Set your priorities**
Cheapest? Best rate limits? Most stable? You pick what matters.

**Step 3 — Let the AI workforce do its thing**
Scout spins up a multi-model pipeline under the hood (more on that below).

**Step 4 — Pick your favorite**
You get the top 3 APIs ranked with real numbers for pricing, scalability, and compatibility. Not vibes — actual data.

**Step 5 — Merge the PR**
Scout forks your repo, writes the integration code, and opens a cross-repo pull request back to your original. You review, you merge, you ship.

---

## 🧠 How It Works

Scout runs a three-stage AI pipeline every time you search:

### 1. Codebase Analysis — *powered by Gemini 2.5 Flash*
Gemini reads your repo and figures out exactly what you need: your language, framework, scale requirements, and what kinds of APIs would actually slot in cleanly.

### 2. Live Web Search — *powered by Exa*
No stale training data here. Exa crawls the live web to surface real API candidates with up-to-date pricing, rate limits, and doc excerpts. Developers describe what they want functionally, not by product name — Exa handles that really well.

### 3. Smart Ranking — *powered by Gemini 2.5*
Gemini scores each candidate across compatibility, price, scalability, and maintenance against your stated priorities — and returns the top 3 with full reasoning and specific numbers.

### 4. Auto-Implementation — *powered by Devin API*
Once you pick an API, Scout kicks off a Devin session. Devin forks your repo, implements the integration (including local testing), and opens a PR back to the original. Scout polls the session every 5 seconds and shows a live progress tracker — so you're never just staring at a spinner wondering if anything is happening.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | TypeScript |
| **Frameworks & Libraries** | Next.js, React 19, Tailwind CSS 4, Framer Motion |
| **AI & APIs** | Gemini 2.5 Flash, Exa API, Devin API, GitHub Raw Content API |
| **Platform** | Vercel, npm |

### AI Model Breakdown
- **Gemini 2.0 Flash** — Intent extraction from user code and message; API scoring; code snippet generation
- **Exa API** — Semantic search to find live API candidates with real pricing and docs
- **Devin API** — Two-session workflow: first session generates implementation code preview, second session does the actual fork + PR

---

## ⚡ Architecture

```
User Input (GitHub URL + chat message)
        ↓
  Gemini 2.5 Flash
  (intent extraction: language, framework, search queries)
        ↓
     Exa Search
  (live web crawl → API candidates + doc excerpts)
        ↓
  Gemini 2.5 Scoring
  (compatibility · price · scalability · maintenance → top 3)
        ↓
  User Picks an API
        ↓
   Devin Session
  (fork repo → implement → open cross-repo PR)
        ↓
    You Merge 🎉
```

*Built at LA Hacks 2026.*
