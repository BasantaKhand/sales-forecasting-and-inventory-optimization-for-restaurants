"""Application configuration."""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration loaded from environment variables."""

    # MongoDB connection string (database name included so get_default_database works)
    MONGO_URI = os.getenv(
        "MONGO_URI", "mongodb://localhost:27017/restaurant_forecast"
    )

    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Flask
    DEBUG = os.getenv("FLASK_ENV", "development").lower() != "production"

    # CORS
    CORS_ORIGINS = ["http://localhost:3000"]

    # File uploads (CSV import)
    MAX_CONTENT_LENGTH = 200 * 1024 * 1024  # 200 MB
