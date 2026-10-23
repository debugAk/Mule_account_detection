import os
import re
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mule Sentinel Investigation Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./data/mule_platform.db"

    # Security & RBAC
    SECRET_KEY: str = "mule-sentinel-dev-secret-key-change-in-prod-8812"
    DEFAULT_INVESTIGATOR_ID: str = "ANALYST-104"
    DEFAULT_INVESTIGATOR_ROLE: str = "investigator"

    # ML Model
    MODEL_PATH: str = "ml/models/mule_detector_pipeline.joblib"
    METRICS_PATH: str = "ml/models/mule_account_metrics.json"

    # Ingestion limits
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_UPLOAD_ROWS: int = 100000

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Sensitive data redaction helper for logs and safe outputs
PII_PATTERNS = [
    (re.compile(r'\b\d{9,18}\b'), lambda m: m.group(0)[:4] + 'XXXX' + m.group(0)[-4:]),
    (re.compile(r'([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})'), lambda m: m.group(1)[:2] + '***@' + m.group(2)),
]

def redact_sensitive_text(text: str) -> str:
    if not text:
        return text
    result = text
    for pattern, repl in PII_PATTERNS:
        result = pattern.sub(repl, result)
    return result
