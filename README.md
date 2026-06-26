<div align="center">

# ⚡ FlashGenius

### Turn your notes into AI-generated study material in seconds

Paste any text and let AI build **flashcards, quizzes, summaries, or mind maps** — then study them with clean, interactive interfaces.

<br/>

### 🔗 [**Try the live demo →**](https://flash-genius-vvo5.vercel.app)

<sub>Hosted on Vercel (frontend + serverless backend) with a Neon PostgreSQL database. The backend may take a few seconds to wake up on the first request.</sub>

<br/>

[![CI](https://github.com/arink1305/FlashGenius/actions/workflows/ci.yml/badge.svg)](https://github.com/arink1305/FlashGenius/actions/workflows/ci.yml)

![Live Demo](https://img.shields.io/badge/Live_Demo-flash--genius.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.138-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-Llama_3.1-F55036?style=for-the-badge&logo=meta&logoColor=white)

<br/>

![FlashGenius landing page](screenshots/landing.png)

</div>

<br/>

## ✨ Features

**Four AI generation modes** — pick what to create from your notes:

- 🃏 **Flashcards** — Q&A cards with configurable count (5–20) and difficulty (easy / medium / hard), studied with a card-flip interface
- ❓ **Quizzes** — multiple-choice (4 options) or yes/no questions, answered interactively with instant feedback and a score
- 📝 **Summaries** — a structured summary plus a list of key points
- 🧠 **Mind maps** — notes turned into a visual map with a central topic and colored branches

Plus everything around it:

-  **Powered by Llama 3.1** via the Groq API, with robust JSON parsing (retry + salvage) so generations don't fail
-  **Accounts & authentication** — JWT-based auth with bcrypt-hashed passwords
-  **Personal library** — every set is saved to your account, tagged by type, on a clean dashboard
-  **Light & dark mode** — switch themes instantly, preference is remembered
-  **Bilingual UI** — toggle between Norwegian and English
-  **Export your data** — download all your sets as JSON
-  **Account management** — change password, export data, or delete your account
-  **Public landing page** — browse the app before signing up; an account is only required to generate content

<br/>

##  Screenshots

<table>
  <tr>
    <td width="50%">
      <strong>Choose what to generate</strong><br/>
      <img src="screenshots/newset.png" alt="Generation mode chooser" />
    </td>
    <td width="50%">
      <strong>Dashboard</strong><br/>
      <img src="screenshots/dashboard.png" alt="Dashboard" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Quiz mode</strong><br/>
      <img src="screenshots/quiz.png" alt="Interactive quiz" />
    </td>
    <td width="50%">
      <strong>Flashcard study mode</strong><br/>
      <img src="screenshots/study-flipped.png" alt="Flashcard study mode" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>AI summary</strong><br/>
      <img src="screenshots/summary.png" alt="Summary view" />
    </td>
    <td width="50%">
      <strong>Mind map</strong><br/>
      <img src="screenshots/mindmap.png" alt="Mind map view" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Settings</strong><br/>
      <img src="screenshots/settings.png" alt="Settings page" />
    </td>
    <td width="50%">
      <strong>Login</strong><br/>
      <img src="screenshots/login.png" alt="Login page" />
    </td>
  </tr>
</table>

<br/>

##  How it works

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   React +   │ HTTP │   FastAPI    │  SQL │ PostgreSQL  │      │   Groq API   │
│    Vite     │─────▶│   backend    │─────▶│  database   │      │  (Llama 3.1) │
│  (frontend) │◀─────│              │◀─────│             │      │              │
└─────────────┘ JSON └──────┬───────┘ rows └─────────────┘      └──────▲───────┘
                            │                                          │
                            └──────────── prompt + notes ──────────────┘
                                          flashcards (JSON)
```

1. **You paste notes** on the Generate page and choose a card count and difficulty.
2. The **frontend** sends the request to the FastAPI backend with your JWT token in the `Authorization` header.
3. The **backend** builds a prompt and asks **Groq (Llama 3.1)** to return a strict JSON array of `{ question, answer }` objects.
4. The cards are **saved to PostgreSQL** under a new deck linked to your user, and the deck is returned to the frontend.
5. You're taken straight into **study mode** to review them.

<br/>

##  Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, React Router, Axios, plain CSS (custom properties, glass morphism, animations) |
| **Backend** | FastAPI, Uvicorn |
| **Database** | PostgreSQL (via `psycopg2`) |
| **Auth** | JWT (`python-jose`), password hashing with `bcrypt` |
| **AI** | Groq API — `llama-3.1-8b-instant` |

<br/>

##  Running locally

The app is **live above** — but you can also clone and run it yourself.

<details>
<summary><strong>Click to expand local setup instructions</strong></summary>

<br/>

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL
- A free [Groq API key](https://console.groq.com/keys)

### 1. Clone the repo

```bash
git clone https://github.com/arink1305/FlashGenius.git
cd FlashGenius
```

### 2. Set up the database

```bash
createdb flashgenius
```

### 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `backend/.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://localhost/flashgenius
SECRET_KEY=a_long_random_secret_string
```

Start the API:

```bash
uvicorn main:app --reload
```

The backend runs on **http://localhost:8000**.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on **http://localhost:5173**.

</details>

<br/>

## 🧪 Tests, CI & Docker

**Tests** — backend logic (auth hashing, JWT, AI-response parsing & mind-map normalization) and frontend utilities/hooks are covered by unit tests:

```bash
cd backend && pytest          # backend (pytest)
cd frontend && npm test       # frontend (Vitest)
```

**CI** — every push and pull request runs the full test suite and a production build via [GitHub Actions](.github/workflows/ci.yml).

**Docker** — run the whole stack (frontend + backend + PostgreSQL) with one command:

```bash
GROQ_API_KEY=your_key docker compose up --build
```

<br/>

## 📁 Project structure

```
FlashGenius/
├── backend/
│   ├── main.py              # FastAPI app + CORS + routers
│   ├── database.py          # DB connection & table setup
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py          # register, login, change password, delete account
│       └── flashcards.py    # generate, list, fetch, export, delete decks
│
└── frontend/
    └── src/
        ├── api.js           # Axios instance with JWT interceptor
        ├── App.jsx          # Routes + auth guards
        └── pages/
            ├── Landing.jsx        # public marketing page
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx      # your saved sets + profile menu
            ├── Generate.jsx       # notes input + count/difficulty
            ├── Study.jsx          # card-flip study mode
            ├── Settings.jsx       # theme, language, data, account
            └── ChangePassword.jsx
```

<br/>

## 💡 What I built

This is a full-stack project I built end to end:

- Designed and built the **entire frontend** in React — a public landing page, auth flow, dashboard, an AI generation page with live settings, an animated card-flip study mode, and a settings page with theme switching, language toggle, data export, and account management.
- Built the **REST API** in FastAPI from scratch, including JWT authentication, bcrypt password hashing, and full CRUD for flashcard decks.
- Designed a **relational schema** in PostgreSQL (users → decks → flashcards) and wrote the queries by hand.
- Integrated a **large language model** (Llama 3.1 through Groq) and engineered the prompt so the model returns strict, parseable JSON every time.
- Did all the **UI/UX and styling** myself in plain CSS — the light/dark themes, gradients, glass morphism, and animations.

## 🎓 What I learned

- **Connecting a frontend, backend, database, and an external AI API** into one working product — and how the pieces talk to each other over HTTP and SQL.
- **Authentication done properly** — how JWTs flow from login through to protected endpoints, and why passwords must be hashed (I hit and fixed a real bcrypt edge case along the way).
- **Prompt engineering for reliability** — getting an LLM to consistently return machine-readable JSON took a strict system prompt and a low temperature, not just asking nicely.
- **Working with constraints** — I started on one AI provider, hit free-tier limits, and migrated the whole integration to Groq, which taught me to keep that layer swappable.
- **Shipping a complete, polished experience** rather than a demo — empty states, loading states, error handling, responsive layouts, and the small details that make an app feel finished.

<br/>

<div align="center">

Built by **Arin Kehreman** · [GitHub](https://github.com/arink1305)

</div>
