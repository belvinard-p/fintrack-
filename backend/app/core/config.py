from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # -> backend/


class Settings(BaseSettings):
    database_url: str
    test_database_url: str = "postgresql://fintrack_user:fintrack_pass@localhost:5433/fintrack_test_db"
    secret_key: str = "changeme"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")


settings = Settings()