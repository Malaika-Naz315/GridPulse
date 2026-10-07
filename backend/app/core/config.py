from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "GridPulse"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()