# FinTrack — Personal Finance Tracker


A full-stack personal finance web application that lets you track spending, import bank statements, categorize transactions automatically, manage budgets, set savings goals, and understand your money through an interactive dashboard — available in both English and French.


🌐 **Live Demo:** [fintrack-belvinard.vercel.app](https://fintrack-belvinard.vercel.app/)
🔌 **API Docs (Swagger):** [fintrack-backend-latest.onrender.com/docs](https://fintrack-backend-latest.onrender.com/docs)


---


## Table of Contents


1. [About](#about)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Configuration](#configuration)
8. [Security](#security)
9. [Contribution Guidelines](#contribution-guidelines)
10. [Roadmap](#roadmap)
11. [License](#license)
12. [Acknowledgements](#acknowledgements)
13. [Author](#author)


---


## About


Most banking apps show a raw list of transactions with little insight into spending habits. FinTrack fills that gap: it lets you log expenses and income manually or import a bank statement CSV, automatically sorts transactions into categories, tracks monthly budgets per category, manages recurring bills and savings goals, and visualizes everything on a dashboard with category and trend charts.


The app started as a portfolio project and is now built to be used by real people — it has rate limiting, an audit trail, account/data deletion, and a public "how it works" guide so new users understand the value before signing up.


---


## Features


- **Authentication** — JWT-based auth with bcrypt password hashing and rate-limited login/register endpoints
- **Transactions** — add manually or import a bank statement CSV (common column names detected automatically, duplicates skipped, invalid rows reported instead of failing the whole import)
- **Automatic categorization** — new transactions are sorted into a category by keyword matching, with full support for renaming, reassigning, and custom categories
- **Budgets** — set a monthly limit per category and see at a glance whether you're on track, with a dashboard banner when you go over budget
- **Recurring transactions** — set up rent, subscriptions, or salary once; FinTrack generates the transaction automatically every month
- **Savings goals** — set a target amount, track contributions, and watch progress with a visual bar
- **Dashboard** — spending-by-category pie chart and month-over-month spending bar chart (Recharts)
- **Export** — download your transaction history as CSV or as a formatted PDF report (with category totals and a summary)
- **Audit log** — every sensitive action (deletions, CSV imports) is recorded and viewable in account settings
- **Account management** — change password, or permanently delete your account and all associated data in one action
- **Bilingual UI** — English and French, auto-detected from the browser and remembered per visitor
- **Light/dark theme**
- **Responsive, accessible UI** built with shadcn/ui components on Base UI primitives


---


## Tech Stack


**Backend**
- FastAPI 0.141
- SQLAlchemy 2.0 + Alembic (migrations)
- PostgreSQL (Neon, serverless, in production)
- Pydantic v2 / pydantic-settings
- python-jose (JWT) + passlib/bcrypt (password hashing)
- slowapi (rate limiting)
- ReportLab (PDF report generation)
- pytest (92 tests)


**Frontend**
- Next.js 16 (App Router, Turbopack)
- React 19
- TanStack Query v5 (server state & caching)
- Axios (HTTP client with JWT interceptor)
- Tailwind CSS v4
- shadcn/ui on Base UI primitives
- Recharts (dashboard charts)
- next-themes (dark mode), sonner (toasts)


**Infrastructure & Deployment**
- Docker (backend image published to Docker Hub)
- Render (backend hosting, free tier)
- Vercel (frontend hosting, free tier)
- Neon (managed serverless PostgreSQL)
- GitHub Actions (CI — backend test suite on every push)


---


## Architecture


```
Browser
 └── Next.js App (Vercel)
       ├── App Router pages   → auth, dashboard, transactions, budgets, goals, recurring, settings
       ├── TanStack Query     → server state & caching for every API call
       ├── Axios client       → JWT bearer auth, redirects to /login on 401
       ├── i18n context       → EN/FR translations, persisted in localStorage
       └── shadcn/ui + Tailwind → theming and components


FastAPI API (Render, Docker container)
       ├── Routers    → auth, transactions, budgets, categories, goals, recurring-transactions, audit-logs
       ├── SQLAlchemy → ORM models, Alembic migrations
       ├── slowapi    → rate limiting on login/register
       └── ReportLab  → CSV/PDF report generation


PostgreSQL (Neon, pooled serverless connection)
```


**Key architectural decisions:**
- The frontend is organized as domain-driven feature modules (`features/<domain>/{types,services,hooks,components}`) rather than by technical layer
- Every backend query filters by the authenticated user — there is no shared/cross-user data path
- The Docker image is built once and reused for local testing, Docker Hub, and the Render deployment, so "it works in the container" means the same thing everywhere
- Local development runs against a Dockerized PostgreSQL instance; production runs against Neon — the two are never mixed, and switching between them never requires code changes, only environment variables


---


## Project Structure


```
fintrack/
├── backend/
│   ├── app/
│   │   ├── routers/          # auth, transactions, budgets, categories, goals, recurring_transactions, audit_logs
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── core/             # config, security, JWT, rate limiting, categorization, audit logging
│   │   └── services/         # CSV import, PDF export
│   ├── alembic/               # database migrations
│   ├── tests/                 # pytest suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router pages (public routes + (protected) group)
│       ├── features/          # domain modules: auth, transactions, budgets, categories, goals,
│       │                      #   recurring-transactions, audit-logs, dashboard
│       ├── components/ui/     # shadcn/ui primitives
│       ├── lib/i18n/          # translation dictionaries and language provider
│       └── services/          # Axios client with JWT interceptor
│
├── docker-compose.yml         # local PostgreSQL (port 5433)
├── render.yaml                # Render deployment blueprint
└── .github/workflows/         # CI — backend test suite
```


---


## Getting Started


**Prerequisites**
- Docker Desktop
- Python >= 3.12
- Node.js >= 20 and pnpm


**Installation**


```bash
# Clone the repository
git clone https://github.com/belvinard-p/fintrack-.git
cd fintrack-


# 1. Start local PostgreSQL
docker compose up -d


# 2. Backend
cd backend
python -m venv venv
source venv/Scripts/activate   # or venv/bin/activate on macOS/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload


# 3. Frontend (in a new terminal)
cd frontend
pnpm install
pnpm dev
```


The API is available at `http://localhost:8000/docs` and the frontend at `http://localhost:3000`.


**Run the backend test suite**


```bash
cd backend
pytest
```


---


## Configuration


Backend — create `backend/.env` (gitignored):


| Variable            | Description                                         | Required |
|---------------------|------------------------------------------------------|----------|
| `DATABASE_URL`       | PostgreSQL connection string                         | Yes      |
| `TEST_DATABASE_URL`  | PostgreSQL connection string used by the test suite  | Yes      |
| `SECRET_KEY`         | JWT signing key — rejected at startup if short/weak  | Yes      |
| `CORS_ORIGINS`       | Comma-separated list of allowed frontend origins     | No (defaults to `http://localhost:3000`) |


Frontend — create `frontend/.env.local`:


| Variable              | Description                        | Required |
|-----------------------|-------------------------------------|----------|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend    | Yes (defaults to `http://127.0.0.1:8000`) |


---


## Security


- Passwords are hashed with bcrypt via passlib — never stored in plain text
- Authentication uses a signed JWT bearer token; `SECRET_KEY` is validated at startup and rejects short or known-insecure defaults
- Login and registration are rate-limited (5/minute and 10/minute respectively) via slowapi
- CORS only allows origins explicitly listed in `CORS_ORIGINS` — no wildcard in production
- Every database query is scoped to the authenticated user; there is no endpoint that can return another user's data
- Sensitive actions (deletions, CSV imports) are written to a per-user audit log
- Account deletion is a single action that cascades across all of a user's data (transactions, budgets, categories, goals, recurring transactions, audit logs)
- All secrets (`.env`, `.env.production`) are gitignored and never committed; the Docker image excludes them entirely via `.dockerignore`


---


## Contribution Guidelines


This started as a personal project but is open to contributions — bug fixes, accessibility improvements, and translations are especially welcome.


1. Fork the repository
2. Create a feature branch: `git checkout -b fix/your-fix`
3. Backend changes must keep the pytest suite passing (`pytest` in `backend/`)
4. Frontend changes must keep `pnpm tsc --noEmit` and `pnpm build` clean
5. If you add user-facing text, add translations to both `frontend/src/lib/i18n/translations/en.ts` and `fr.ts`
6. Submit a pull request with a clear description of the change


---


## Roadmap


**Completed**
- Core transaction, budget, category, and goal management
- CSV import/export and PDF report export
- Automatic categorization
- Recurring transactions
- Audit log and account/data deletion
- Rate limiting and hardened JWT configuration
- Bilingual UI (English/French) with a public onboarding guide
- Dockerized backend deployed to Render, frontend deployed to Vercel, Neon as the production database


**Planned**
- Password reset via email (currently blocked on choosing a transactional email provider — Render's free tier does not allow outbound email)
- Email verification at sign-up
- User-editable, rule-based categorization (beyond the built-in keyword list)


**Explicitly out of scope for now**
- Multi-currency support
- Shared/multi-user accounts
- Live bank sync (Plaid or similar)


---


## License


This project is for personal and portfolio use. All rights reserved © Belvinard Pouadjeu.


If you'd like to use parts of this code as a reference or template, please credit the original author.


---


## Acknowledgements


- [FastAPI](https://fastapi.tiangolo.com/) — backend framework
- [Next.js](https://nextjs.org/) — frontend framework
- [shadcn/ui](https://ui.shadcn.com/) — UI component library (Base UI preset)
- [TanStack Query](https://tanstack.com/query) — server state management
- [Recharts](https://recharts.org/) — dashboard charts
- [Neon](https://neon.tech/) — managed serverless PostgreSQL
- [Render](https://render.com/) — backend hosting
- [Vercel](https://vercel.com/) — frontend hosting
- [Docker](https://www.docker.com/) — containerization


---


## Author


**Belvinard Pouadjeu**
Fullstack Developer & Data Engineer


- Portfolio: [belvinard-resume.netlify.app](https://belvinard-resume.netlify.app/)
- GitHub: [github.com/belvinard-p](https://github.com/belvinard-p)
- LinkedIn: [linkedin.com/in/belvinard-pouadjeu-19a734377](https://www.linkedin.com/in/belvinard-pouadjeu-19a734377)
- Email: belvinardpouadjeu@gmail.com
