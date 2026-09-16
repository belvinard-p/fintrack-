from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # -> backend/

INSECURE_SECRET_KEYS = {"changeme", "secret", "", "your-secret-key"}


class Settings(BaseSettings):
    database_url: str
    test_database_url: str = "postgresql://fintrack_user:fintrack_pass@localhost:5433/fintrack_test_db"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v.strip().lower() in INSECURE_SECRET_KEYS:
            raise ValueError(
                "SECRET_KEY must be set to a real random value (e.g. `python -c "
                "\"import secrets; print(secrets.token_hex(32))\"`) — refusing to start "
                "with a known/default value."
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long.")
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()