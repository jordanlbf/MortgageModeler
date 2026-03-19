"""
Application settings — loaded from environment variables with sensible defaults.

Uses Pydantic BaseSettings to support .env files and environment variable overrides.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration.

    All values can be overridden via environment variables or a .env file.

    Attributes:
        APP_ENV: Deployment environment (development, staging, production)
        DEBUG: Enable debug mode
        APP_TITLE: Application title shown in API docs
        APP_VERSION: Application version string
        CORS_ORIGINS: Comma-separated list of allowed CORS origins
    """
    APP_ENV: str = "development"
    DEBUG: bool = True
    APP_TITLE: str = "MortgageModeler"
    APP_VERSION: str = "0.2.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
