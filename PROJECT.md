# FinTrack — Analyseur de finances personnelles

## But du projet

FinTrack est une application web full-stack qui permet à un utilisateur de **suivre ses dépenses, importer ses relevés bancaires, catégoriser ses transactions et visualiser ses habitudes financières** via un tableau de bord interactif.

Le problème résolu : la plupart des applications bancaires affichent des listes brutes de transactions sans analyse ni tendance. FinTrack comble ce manque en offrant une vue claire et personnalisée de ses finances.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | FastAPI (Python), SQLAlchemy, Alembic, JWT |
| Base de données | PostgreSQL |
| Frontend | Next.js 15 (App Router), TanStack Query, Tailwind CSS, Recharts |
| Conteneurisation | Docker + Docker Compose |
| Tests | pytest (backend) |
| CI | GitHub Actions |

---

## Fonctionnalités

### 1. Authentification
- Inscription avec email et mot de passe (hashé avec bcrypt)
- Connexion avec génération d'un **JWT** valable 24h
- Toutes les routes (sauf `/auth`) sont protégées — chaque utilisateur n'accède qu'à ses propres données

### 2. Gestion manuelle des transactions
- **Créer** une transaction (date, description, montant, catégorie)
- **Modifier** une transaction existante (montant, catégorie, description, date)
- **Supprimer** une transaction
- Les transactions sont isolées par utilisateur

### 3. Import de relevés CSV
- Upload d'un fichier CSV contenant des transactions bancaires
- Parsing automatique des colonnes (date, description, montant)
- **Détection des doublons** : une transaction identique (même date + description + montant) n'est pas réimportée
- Retour du nombre de transactions créées vs ignorées

### 4. Catégorisation automatique
- À l'import, chaque transaction est **automatiquement catégorisée** par correspondance de mots-clés dans la description :

| Catégorie | Mots-clés détectés |
|---|---|
| Groceries | walmart, carrefour, supermarket... |
| Transport | uber, lyft, taxi, fuel... |
| Dining Out | restaurant, starbucks, mcdonald... |
| Utilities | electricity, internet, phone bill... |
| Rent | rent |
| Entertainment | netflix, spotify, cinema... |
| Health | pharmacy, doctor, hospital... |
| Salary | salary, payroll, deposit |

- Si aucun mot-clé ne correspond → catégorie **Uncategorized**
- L'utilisateur peut **réassigner manuellement** la catégorie d'une transaction

### 5. Tableau de bord
- **Graphique en camembert** : répartition des dépenses par catégorie
- **Graphique en barres** : évolution des dépenses mois par mois
- Les données sont chargées via TanStack Query avec mise en cache automatique

### 6. Budgets par catégorie
- Définir un **budget mensuel** par catégorie (ex : 100 000 XAF pour "Groceries" en 2025-01)
- Consulter le **statut des budgets** pour un mois donné :
  - Montant limite
  - Montant réellement dépensé
  - Indicateur visuel si le budget est **dépassé**
- Modifier ou supprimer un budget existant

### 7. Catégories personnalisées
- Des catégories **par défaut** sont disponibles pour tous les utilisateurs
- Chaque utilisateur peut créer ses **propres catégories** personnalisées

### 8. Logs d'audit
- Les actions sensibles (ex : suppression de budget) sont **enregistrées** dans un journal d'audit lié à l'utilisateur

### 9. Transactions récurrentes *(fonctionnalité avancée)*
- Possibilité de marquer des transactions comme récurrentes (loyer, abonnements...)

### 10. Objectifs d'épargne *(fonctionnalité avancée)*
- Définir des objectifs financiers et suivre leur progression

---

## Architecture

```
fintrack/
├── backend/                  # API FastAPI
│   ├── app/
│   │   ├── routers/          # Endpoints : auth, transactions, budgets, categories...
│   │   ├── models/           # Modèles SQLAlchemy (User, Transaction, Budget, Category...)
│   │   ├── schemas/          # Schémas Pydantic (validation des entrées/sorties)
│   │   ├── core/             # Config, sécurité, JWT, catégorisation, dépendances
│   │   └── services/         # Logique métier (import CSV...)
│   └── tests/                # Tests pytest par fonctionnalité
│
├── frontend/                 # Application Next.js
│   └── src/
│       ├── app/              # Pages (App Router)
│       │   └── (protected)/  # Pages protégées par le guard d'authentification
│       ├── features/         # Modules métier (auth, dashboard, transactions, budgets...)
│       ├── components/ui/    # Composants UI réutilisables (Button, Card, Input...)
│       ├── services/         # Client HTTP Axios avec intercepteur JWT
│       └── lib/              # QueryProvider, gestion de session
│
└── docker-compose.yml        # Lance PostgreSQL en local (port 5433)
```

---

## Modèle de données

```
users           → email, password_hash
categories      → name, user_id (null = catégorie par défaut), is_default
transactions    → user_id, date, description, amount, category_id, source (manual/csv_import)
budgets         → user_id, category_id, monthly_limit, month (YYYY-MM)
```

---

## Lancer le projet en local

```bash
# 1. Démarrer la base de données
docker compose up -d

# 2. Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend
cd frontend
pnpm install
pnpm dev
```

L'API est disponible sur `http://localhost:8000` et le frontend sur `http://localhost:3000`.
