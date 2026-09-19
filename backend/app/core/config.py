import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    LLM_PROVIDER: str = "mock"
    CORS_ORIGINS: Any = ["http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        try:
            parsed_value = json.loads(value)
        except json.JSONDecodeError:
            parsed_value = [origin.strip() for origin in value.split(",")]

        if isinstance(parsed_value, str):
            return [parsed_value]
        return parsed_value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        enable_decoding=False,
    )

settings = Settings()