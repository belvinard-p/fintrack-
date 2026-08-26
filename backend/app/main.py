from fastapi import FastAPI

app = FastAPI(title="FinTrack API", version="0.1.0")


@app.get("/")
def read_root():
    return {"message": "FinTrack API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}