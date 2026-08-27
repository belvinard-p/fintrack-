from app.core.database import engine

with engine.connect() as conn:
    print("Database connection successful!")