# 🧠 Optimind — Self-Evolving Prompt Optimizer AI Platform

> A production-grade AI Chatbot Platform where every user prompt is autonomously improved by a built-in optimizer that **learns from each user's feedback and behavior over time using Thompson Sampling multi-armed bandits**.

---

## 🌟 Key Features

### 1. ⚡ Flagship Prompt Optimizer
- **In-Input Sparkles (`Sparkles`) Button**: Instantly triggers the self-evolving optimizer pipeline.
- **Diff View Comparison**: Side-by-side view contrasting original drafts vs optimized prompts with highlighted additions.
- **Prompt Score (0–100)**: Multi-metric breakdown measuring **Clarity**, **Context**, **Specificity**, **Output Format**, and **Negative Constraints**.
- **Live Prompt Coach**: Evaluates your draft in real time (debounced 800ms) with zero LLM lag using local heuristic evaluators, offering live hint chips.
- **Explainable AI**: Displays "What I Changed & Why" annotations for full transparency.
- **Three Core Decisions**: *Use Optimized* (+15 XP), *Edit then Use* (+10 XP), or *Keep Original*.

### 2. 🧬 Self-Evolving Engine (The Core Differentiator)
- **Task Classifier**: Automatically identifies task domains (*coding, writing, summarization, research, math, translation, brainstorming, data analysis, general Q&A*).
- **10+ Strategy Library**: Incorporates `add_role`, `add_context`, `add_constraints`, `add_output_format`, `few_shot_examples`, `chain_of_thought`, `step_by_step_breakdown`, `clarify_ambiguity`, `concise_rewrite`, and `audience_targeting`.
- **Thompson Sampling Bandit**: Maintains Beta distribution parameters ($\alpha$ successes, $\beta$ failures) per user and global scope with an exploration rate $\epsilon = 0.15$.
- **Multi-Factor Reward Signal**: Computes rewards from user decisions (acceptance $+1.0$, edit $+0.4$, rejection $-0.8$), response thumbs up/down, score delta improvements, and regeneration penalties.
- **Self-Reflection Background Job**: Periodically analyzes rejected optimizations and proposes evolved candidate strategy templates.
- **Evolution Dashboard**: Interactive Recharts visualizations displaying average score progression, acceptance rate, top strategies, GitHub-style 52-week activity heatmap, and the **Prompt DNA Profile** radar chart.

### 3. 🔥 Timezone-Aware Streaks & Reminders
- **Strict Local Calendar Math**: A user earns a streak for a day when they send **at least 2 prompts that calendar day in their own IANA timezone**.
- **Streak Freezes**: 1 free freeze earned every 7 days (max 2 held) that automatically protects your streak if a day is missed.
- **Confetti Celebrations**: Visual celebrations (`canvas-confetti`) when the 2nd prompt of the day qualifies.
- **Milestone Badges**: Unlockable achievements at 3, 7, 14, 30, 100, and 365 days with XP rewards.
- **Scheduled Background Reminders**: APScheduler checks every 5 minutes to dispatch Web Push (VAPID) and email alerts to users who haven't yet qualified by 7:00 PM local time, with a last-chance alert at 9:30 PM.

### 4. 🚀 Standout Innovations
- **Prompt Autopsy**: Highlights weak parts inline (vague words like "something", missing output formats, loose constraints) with one-click fixes.
- **Prompt DNA Profile Card**: Shareable visual card summarizing your prompting style (*"The Precise Architect"*, *"The Structured Strategist"*, *"The Visionary Explorer"*) as a radar chart.
- **Multi-Model Arena**: Run your prompt against two models side-by-side in a blind test and vote for the best output (+10 XP).
- **Hands-Free Voice Conversation Mode**: Fullscreen animated glowing voice orb with automatic listening and text-to-speech audio feedback.
- **Retro-Optimize**: Scans your past conversation history for weak prompts and shows what an optimized version would look like with the score gain.
- **Study & Mastery Mode**: Transforms any chat or uploaded document into active recall flashcards, interactive quizzes, and key takeaways.
- **Prompt Library (30+ Seeded Templates)**: Categorized across Developer, Student, Writer, Researcher, Business, and General personas with dynamic variable fill-in `{{topic}}`.
- **Chat with Files (RAG)**: Upload PDFs, DOCX, CSV, TXT, and images stored in MongoDB GridFS with vector chunking and document citations.
- **Public Optimizer API**: Generate API keys and integrate `/api/v1/public/optimize` into your own external applications.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Zustand, Lucide React, Recharts, canvas-confetti, react-markdown, remark-gfm, rehype-highlight, i18next (English, Spanish, French, Hindi, Telugu, Tamil).
- **Backend**: FastAPI, Python 3.11+, Uvicorn, Pydantic v2, Motor (Async MongoDB), MongoDB GridFS, JWT with bcrypt, APScheduler, slowapi rate limiting, pypdf, python-docx, Pillow, pywebpush.
- **LLM Abstraction**: Provider-agnostic interface (`LLMProvider`) supporting Google Gemini, Anthropic Claude, and a local Mock provider for zero-configuration testing. Configure a provider API key in `.env` for generated AI responses; Mock mode returns canned demo responses.

---

## 🚀 Quick Start

### Option A: Local Development (Recommended)

#### 1. Start MongoDB
Ensure MongoDB is running locally on port 27017:
```bash
# On Windows (services check)
Get-Service -Name MongoDB
```

#### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend (from workspace root)
$env:PYTHONPATH="backend"   # Windows PowerShell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API docs will be live at: `http://localhost:8000/api/v1/docs`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be live at: `http://localhost:5173`

---

### Option B: Docker Compose

```bash
docker-compose up --build
```
This launches:
- MongoDB at `localhost:27017`
- FastAPI backend at `localhost:8000`
- React frontend at `localhost:5173`

---

## 🔑 Demo Account Credentials

A fully populated demo account is automatically seeded on startup:
- **Email**: `demo@optimind.ai`
- **Password**: `password123`
- **Pre-loaded with**: 5-day streak, Level 3 developer profile, 350 XP, pinned chat, prompt memories, and 30+ library templates.

---

## 🧪 Running Tests

The test suite covers password hashing, JWT security, prompt scoring calibration, task classification, timezone-aware streak math, and the end-to-end integration lifecycle:

```bash
# Run all tests
$env:PYTHONPATH="backend"
pytest backend/tests/ -v
```

---

## 📚 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Register new user with persona & timezone |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access & refresh tokens |
| `POST` | `/api/v1/chats/{id}/messages` | SSE token-by-token streaming chat endpoint |
| `POST` | `/api/v1/optimizer/optimize` | Run multi-armed bandit prompt optimizer |
| `POST` | `/api/v1/optimizer/score` | Fast heuristic prompt coach scorer |
| `POST` | `/api/v1/optimizer/outcome` | Record user decision (accepted/edited/rejected) |
| `GET` | `/api/v1/streaks/me` | Fetch streak count, freezes, & qualification status |
| `GET` | `/api/v1/analytics/evolution` | Fetch Recharts metrics & Prompt DNA profile |
| `POST` | `/api/v1/public/optimize` | Public API endpoint authenticated via `X-API-Key` |

---

## 🛡️ License
MIT License. Built with advanced agentic software architecture for Google Antigravity.
