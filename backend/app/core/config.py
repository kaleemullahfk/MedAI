import secrets

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./medai.db"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours enhanced session

    # SECRET_KEY has no hardcoded default. See the model_validator below:
    #   - production/test: missing key is a hard startup error
    #   - development:     a random key is generated per process boot
    SECRET_KEY: str = ""

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    ENVIRONMENT: str = "development"  # development | production | test
    LOG_LEVEL: str = "INFO"

    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    )

    # Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Admin seeding (python -m app.scripts.seed_admin)
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    def model_post_init(self, __context) -> None:
        if not self.SECRET_KEY:
            if self.ENVIRONMENT == "development":
                # Ephemeral key for local dev. Tokens are invalidated on restart.
                object.__setattr__(
                    self, "SECRET_KEY", secrets.token_urlsafe(48)
                )
            else:
                raise RuntimeError(
                    "SECRET_KEY must be set in the environment for "
                    f"ENVIRONMENT={self.ENVIRONMENT!r}."
                )


settings = Settings()
