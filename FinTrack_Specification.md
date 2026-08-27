# FinTrack — Personal Finance & Bank Statement Analyzer
## Software Requirements Specification (SRS) v1.0

**Author:** Belvinard Pouadjeu
**Date:** August 26, 2026
**Status:** Draft for review

---

## 1. Project Charter

### 1.1 Vision
FinTrack is a full-stack web application that allows users to import bank statements, automatically categorize their transactions, and gain clear visibility into their spending habits through an interactive dashboard.

### 1.2 Problem Statement
Most people struggle to understand where their money goes each month. Bank apps show raw transaction lists but rarely provide meaningful categorization or trend analysis across time or across multiple accounts.

### 1.3 Objectives
- O1: Allow users to securely manage their own financial data (auth, isolation per user).
- O2: Allow import of transactions via CSV/PDF bank statements, avoiding manual entry fatigue.
- O3: Automatically categorize transactions with the ability for users to override.
- O4: Visualize spending patterns (by category, by time, by merchant).
- O5: Allow users to set budgets and receive feedback when they exceed them.

### 1.4 Scope

**In scope (v1.0):**
- User registration/authentication (JWT)
- Manual transaction CRUD
- CSV import of bank statements
- Rule-based auto-categorization with manual override
- Dashboard with charts (spending by category, spending over time)
- Budget limits per category with visual alerts

**Out of scope (v1.0 — candidates for v2):**
- PDF statement parsing (stretch goal, Phase 5)
- Multi-currency support
- Bank API integrations (Plaid-like live sync)
- ML-based anomaly/fraud detection
- Mobile app (native)

### 1.5 Success Criteria
- A new user can register, import a sample statement, and see a categorized dashboard in under 5 minutes.
- 90%+ of imported transactions are auto-categorized correctly using the default rule set on a representative sample statement.

---

## 2. Personas

| Persona | Description | Goals | Pain Points |
|---|---|---|---|
| **Aline, 28, Junior Analyst** | Wants to track monthly spending against a budget | Understand where money goes; stick to a budget | Manually reading bank statements is tedious |
| **Marc, 35, Freelancer** | Irregular income, multiple accounts | Consolidate view across accounts; spot overspending fast | No single place to see all transactions categorized |

---

## 3. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Users can register and log in using email/password | Must |
| FR-2 | Authenticated users can create, view, update, and delete transactions manually | Must |
| FR-3 | Users can upload a CSV bank statement file | Must |
| FR-4 | System parses CSV and creates transaction records, skipping duplicates | Must |
| FR-5 | System assigns a category to each imported transaction using keyword rules | Must |
| FR-6 | Users can manually reassign a transaction's category | Must |
| FR-7 | Users can view a dashboard with spending by category (pie/bar chart) | Must |
| FR-8 | Users can view spending trends over time (line chart) | Should |
| FR-9 | Users can define a monthly budget per category | Should |
| FR-10 | System visually flags categories that exceed their budget | Should |
| FR-11 | Users can export a spending report as PDF | Could |
| FR-12 | System parses PDF bank statements | Could (Phase 5) |

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | Passwords stored hashed (bcrypt/passlib), never in plaintext |
| NFR-2 | All API endpoints (except auth) require a valid JWT |
| NFR-3 | A user can only access their own data (row-level isolation enforced at query level) |
| NFR-4 | API responses for dashboard queries return in under 500ms for up to 5,000 transactions |
| NFR-5 | Application containerized via Docker Compose for reproducible local setup |
| NFR-6 | Codebase follows PEP8 (backend) and ESLint defaults (frontend) |
| NFR-7 | Core business logic (categorization, budget calculation) covered by unit tests (pytest) |

---

## 5. Epics & User Stories

Stories follow the format: **As a** [role], **I need** [need], **so that** [benefit]. Includes assumptions and Gherkin acceptance criteria.

### EPIC 1 — Authentication & Account Management

**US-1.1 — User Registration**
- **As a** new user, **I need** to create an account with email and password, **so that** my financial data is private to me.
- **Assumptions:** Email must be unique; password minimum 8 characters.
- **Type:** Feature (customer value)
```gherkin
Feature: User registration
  Scenario: Successful registration
    Given I am on the registration page
    When I submit a valid email and a password of at least 8 characters
    Then a new user account is created
    And I receive a confirmation that registration succeeded

  Scenario: Duplicate email
    Given an account already exists with email "aline@example.com"
    When I try to register with "aline@example.com"
    Then I receive an error indicating the email is already in use
```

**US-1.2 — User Login**
- **As a** registered user, **I need** to log in with my credentials, **so that** I can access my personal dashboard.
- **Assumptions:** JWT issued on success, expires after 24h.
- **Type:** Feature
```gherkin
Feature: User login
  Scenario: Successful login
    Given I have a registered account
    When I submit my correct email and password
    Then I receive a valid JWT access token

  Scenario: Invalid credentials
    Given I have a registered account
    When I submit an incorrect password
    Then I receive an authentication error
    And no token is issued
```

---

### EPIC 2 — Manual Transaction Management

**US-2.1 — Add Transaction**
- **As a** logged-in user, **I need** to manually add a transaction, **so that** I can track expenses not covered by an import.
- **Type:** Feature
```gherkin
Feature: Add transaction manually
  Scenario: Add a valid transaction
    Given I am logged in
    When I submit a transaction with a date, description, amount, and category
    Then the transaction is saved and linked to my account
    And it appears in my transaction list
```

**US-2.2 — Edit/Delete Transaction**
- **As a** logged-in user, **I need** to edit or delete a transaction, **so that** I can correct mistakes.
- **Type:** Feature
```gherkin
Feature: Edit or delete transaction
  Scenario: Edit a transaction
    Given I have an existing transaction
    When I update its amount or category
    Then the change is persisted and reflected in my dashboard

  Scenario: Delete a transaction
    Given I have an existing transaction
    When I delete it
    Then it no longer appears in my transaction list or dashboard totals
```

---

### EPIC 3 — Statement Import & Categorization

**US-3.1 — Import CSV Statement**
- **As a** logged-in user, **I need** to upload a CSV bank statement, **so that** I don't have to enter transactions manually.
- **Assumptions:** CSV columns: date, description, amount (configurable mapping in v1 via a fixed template).
- **Type:** Feature
```gherkin
Feature: Import CSV statement
  Scenario: Successful import
    Given I am logged in
    When I upload a valid CSV file with transaction rows
    Then all valid rows are created as transactions
    And duplicate rows (same date, description, amount) are skipped

  Scenario: Invalid file format
    Given I am logged in
    When I upload a file that is not a valid CSV
    Then I receive an error message and no transactions are created
```

**US-3.2 — Auto-Categorization**
- **As a** logged-in user, **I need** imported transactions to be automatically categorized, **so that** I don't have to categorize each one manually.
- **Assumptions:** Category assigned via keyword-matching against transaction description; unmatched transactions go to "Uncategorized".
- **Type:** Feature
```gherkin
Feature: Auto-categorize imported transactions
  Scenario: Transaction matches a known keyword
    Given a transaction description contains "UBER"
    When the transaction is imported
    Then it is automatically assigned to the "Transport" category

  Scenario: Transaction matches no keyword
    Given a transaction description matches no keyword rule
    When the transaction is imported
    Then it is assigned to the "Uncategorized" category
```

**US-3.3 — Reassign Category**
- **As a** logged-in user, **I need** to manually change a transaction's category, **so that** I can correct wrong auto-categorizations.
- **Type:** Feature
```gherkin
Feature: Reassign transaction category
  Scenario: User overrides category
    Given a transaction was auto-categorized as "Uncategorized"
    When I manually assign it to "Groceries"
    Then the transaction's category updates to "Groceries"
    And this choice does not need to persist as a rule for future imports (v1)
```

---

### EPIC 4 — Dashboard & Insights

**US-4.1 — Spending by Category**
- **As a** logged-in user, **I need** to see my spending broken down by category, **so that** I understand where my money goes.
- **Type:** Feature
```gherkin
Feature: Spending by category chart
  Scenario: View category breakdown
    Given I have transactions across multiple categories this month
    When I open my dashboard
    Then I see a chart showing total spend per category for the selected period
```

**US-4.2 — Spending Over Time**
- **As a** logged-in user, **I need** to see my spending trend over time, **so that** I can spot months where I overspent.
- **Type:** Feature
```gherkin
Feature: Spending trend chart
  Scenario: View monthly trend
    Given I have transactions spanning multiple months
    When I open my dashboard
    Then I see a line chart of total spending per month
```

---

### EPIC 5 — Budgeting

**US-5.1 — Set Budget**
- **As a** logged-in user, **I need** to set a monthly budget per category, **so that** I can control my spending.
- **Type:** Feature
```gherkin
Feature: Set category budget
  Scenario: Define a budget
    Given I am logged in
    When I set a monthly budget of 100,000 XAF for "Groceries"
    Then the budget is saved and applies to the current and future months
```

**US-5.2 — Budget Alert**
- **As a** logged-in user, **I need** to be visually alerted when I exceed a budget, **so that** I can adjust my spending in time.
- **Type:** Feature
```gherkin
Feature: Budget exceeded alert
  Scenario: Spending exceeds budget
    Given my "Groceries" budget is 100,000 XAF for this month
    And I have spent 120,000 XAF in "Groceries" this month
    When I view my dashboard
    Then the "Groceries" category is visually flagged as over budget
```

---

### EPIC 6 — Infrastructure (Technical Debt)

**US-6.1 — Project Environment Setup**
- **As a** developer, **I need** a reproducible local dev environment, **so that** I can develop and test consistently.
- **Type:** Technical debt (no direct customer value, required to continue development)
```gherkin
Feature: Local environment setup
  Scenario: Start the full stack locally
    Given Docker and Docker Compose are installed
    When I run "docker compose up"
    Then the FastAPI backend, PostgreSQL database, and React frontend all start successfully
```

**US-6.2 — CI Pipeline**
- **As a** developer, **I need** an automated test pipeline, **so that** regressions are caught before merging.
- **Type:** Technical debt
```gherkin
Feature: Continuous integration
  Scenario: Run tests on push
    Given I push a commit to the repository
    When the CI pipeline triggers
    Then backend unit tests run automatically
    And the build fails if any test fails
```

---

## 6. Data Model (v1)

```
users
  id (PK)
  email (unique)
  password_hash
  created_at

categories
  id (PK)
  name
  user_id (FK -> users.id, nullable for default/system categories)
  is_default (bool)

transactions
  id (PK)
  user_id (FK -> users.id)
  date
  description
  amount
  category_id (FK -> categories.id)
  source (enum: manual, csv_import)
  created_at

budgets
  id (PK)
  user_id (FK -> users.id)
  category_id (FK -> categories.id)
  monthly_limit
  month (year-month)
```

---

## 7. Technical Architecture (v1)

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy ORM, Alembic migrations, Pydantic schemas, JWT auth (python-jose + passlib/bcrypt)
- **Database:** PostgreSQL
- **Frontend:** React + Tailwind CSS, Axios for API calls, Recharts for visualizations
- **File Parsing:** pandas for CSV
- **Testing:** pytest (backend), React Testing Library (frontend, later phase)
- **Containerization:** Docker + Docker Compose
- **Version Control:** Git/GitHub, feature-branch workflow, PRs against `main`

---

## 8. Release Plan (Sprints)

| Sprint | Focus | Stories |
|---|---|---|
| Sprint 0 | Environment & CI setup | US-6.1, US-6.2 |
| Sprint 1 | Auth | US-1.1, US-1.2 |
| Sprint 2 | Manual transactions | US-2.1, US-2.2 |
| Sprint 3 | CSV import & categorization | US-3.1, US-3.2, US-3.3 |
| Sprint 4 | Dashboard | US-4.1, US-4.2 |
| Sprint 5 | Budgeting & polish | US-5.1, US-5.2 |

---

## 9. Definition of Done (per story)
- Code implemented and merged to `main` via reviewed PR
- Unit tests written and passing for business logic
- Gherkin acceptance criteria manually verified
- No linter errors
- Feature demoed (screenshot or short GIF) added to project README

---

## 10. Open Questions (to resolve before Sprint 1)
1. Should categories be global defaults + user-custom, or fully per-user from the start?
2. What CSV column format will we standardize on for v1 (this affects the parser)?
3. Do we need multi-account support (e.g., checking + savings) in v1, or single account per user?
