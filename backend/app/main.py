from fastapi import FastAPI

from app.routers import auth


app = FastAPI(title="FinTrack API", version="0.1.0")

app.include_router(auth.router)


@app.get("/")
def read_root():
    return {"message": "FinTrack API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}