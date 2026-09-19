from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    LLM_PROVIDER: str = "mock"
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()