from pydantic_settings import BaseSettings
from typing import List, Union
import json

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./medai.db"
    SECRET_KEY: str = "medai_secure_secret_key_2026_production_grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours enhanced session

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()