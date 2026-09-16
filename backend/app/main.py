from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routers import auth, categories, transactions, budgets, goals, audit_logs, recurring_transactions


app = FastAPI(title="FinTrack API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(budgets.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(goals.router)
app.include_router(audit_logs.router)
app.include_router(recurring_transactions.router)


@app.get("/")
def read_root():
    return {"message": "FinTrack API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}