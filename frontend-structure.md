# Frontend Project Structure

Next.js 15 app using the App Router, TanStack Query, Axios, and Tailwind CSS.

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router — defines all routes
│   │   ├── (protected)/              # Route group: pages behind auth guard (no URL segment)
│   │   │   ├── layout.tsx            # Auth guard: redirects to /login if no token in sessionStorage
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Dashboard page: pie chart (spending by category) + bar chart (spending by month)
│   │   │   └── transactions/
│   │   │       └── page.tsx          # Transactions page: renders the TransactionForm to add a new transaction
│   │   ├── login/
│   │   │   └── page.tsx              # Login page: email/password form, stores JWT in sessionStorage on success
│   │   ├── register/
│   │   │   └── page.tsx              # Register page: email/password form, redirects to /login on success
│   │   ├── layout.tsx                # Root layout: wraps the entire app with QueryProvider and global fonts
│   │   ├── page.tsx                  # Home page: simple FinTrack landing screen
│   │   ├── globals.css               # Global CSS imported by the root layout
│   │   ├── favicon.ico               # App favicon
│   │   ├── budgets/                  # Budgets route (not yet implemented)
│   │   └── transactions/             # Duplicate transactions route (not yet implemented)
│   │
│   ├── features/                     # Feature-based modules (business logic, isolated per domain)
│   │   ├── auth/
│   │   │   ├── index.ts              # Public API: re-exports login, register functions and types
│   │   │   ├── services/
│   │   │   │   └── auth-api.ts       # API calls: POST /auth/login and POST /auth/register
│   │   │   └── types/
│   │   │       └── index.ts          # Types: LoginCredentials, RegisterPayload, AuthResponse
│   │   │
│   │   ├── dashboard/
│   │   │   ├── index.ts              # Public API: re-exports hooks, components and types
│   │   │   ├── services/
│   │   │   │   └── dashboard-api.ts  # API calls: GET /transactions/dashboard/by-category and by-month
│   │   │   ├── hooks/
│   │   │   │   ├── use-category-spending.ts   # TanStack Query hook to fetch spending by category
│   │   │   │   └── use-monthly-spending.ts    # TanStack Query hook to fetch spending by month
│   │   │   ├── components/
│   │   │   │   ├── category-pie-chart.tsx     # Recharts PieChart component for category spending
│   │   │   │   └── monthly-spending-chart.tsx # Recharts BarChart component for monthly spending
│   │   │   └── types/
│   │   │       └── index.ts          # Types: CategorySpending, MonthlySpending
│   │   │
│   │   └── transactions/
│   │       ├── index.ts              # Public API: re-exports TransactionForm, useCreateTransaction and types
│   │       ├── services/
│   │       │   └── transactions-api.ts  # API calls: POST /transactions/
│   │       ├── hooks/
│   │       │   └── use-create-transaction.ts  # TanStack Query mutation hook to create a transaction
│   │       ├── components/
│   │       │   └── transaction-form.tsx       # Form with date, description, amount fields
│   │       └── types/
│   │           └── index.ts          # Types: Transaction, TransactionCreate
│   │
│   ├── components/
│   │   └── ui/                       # Reusable shadcn/ui primitive components
│   │       ├── button.tsx            # Button component
│   │       ├── card.tsx              # Card, CardHeader, CardTitle, CardContent components
│   │       ├── input.tsx             # Input component
│   │       └── label.tsx             # Label component
│   │
│   ├── services/
│   │   └── http-client.ts            # Axios instance with base URL and Bearer token interceptor
│   │
│   ├── lib/
│   │   ├── query-client.tsx          # QueryProvider: wraps children with TanStack QueryClientProvider
│   │   ├── session.ts                # Session helpers: getToken, setToken, clearToken (sessionStorage)
│   │   └── utils.ts                  # Utility functions (e.g. cn() for Tailwind class merging)
│   │
│   └── styles/
│       └── globals.css               # Duplicate global styles (main one is in app/globals.css)
│
├── public/                           # Static assets served as-is
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .env.local                        # Local environment variables (e.g. NEXT_PUBLIC_API_URL)
├── .gitignore                        # Files excluded from git
├── components.json                   # shadcn/ui configuration (component paths, style, aliases)
├── eslint.config.mjs                 # ESLint configuration
├── next-env.d.ts                     # Next.js TypeScript declarations (auto-generated)
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies and scripts
├── pnpm-lock.yaml                    # pnpm lockfile
├── pnpm-workspace.yaml               # pnpm workspace configuration
├── postcss.config.mjs                # PostCSS configuration for Tailwind
├── tsconfig.json                     # TypeScript configuration with @/* path alias
└── tsconfig.tsbuildinfo              # TypeScript incremental build cache (auto-generated)
```

## Key Architecture Decisions

- **(protected) route group**: wraps all authenticated pages under a single auth guard layout without adding a URL segment
- **Feature modules**: each domain (auth, dashboard, transactions) owns its types, API calls, hooks and components — pages just compose them
- **http-client.ts**: single Axios instance shared across all features; the request interceptor automatically attaches the JWT so individual API functions don't need to handle auth
- **session.ts**: centralises all sessionStorage access behind typed helpers so the token key is never duplicated
- **QueryProvider**: placed in the root layout so TanStack Query's cache is shared across the entire app
