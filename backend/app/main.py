from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, categories, transactions, budgets


app = FastAPI(title="FinTrack API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(budgets.router)
app.include_router(transactions.router)
app.include_router(categories.router)


@app.get("/")
def read_root():
    return {"message": "FinTrack API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}