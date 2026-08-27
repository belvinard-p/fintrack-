from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "changeme"  # will use for JWT later
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24h

    class Config:
        env_file = ".env"


settings = Settings()