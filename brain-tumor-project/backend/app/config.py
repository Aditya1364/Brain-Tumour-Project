from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME:           str  = "NeuralOnco"
    DEBUG:              bool = True
    DATABASE_URL:       str  = "sqlite:///./brain_tumor.db"
    SECRET_KEY:         str  = "change-me-in-production"
    MODEL_PATH:         str  = "app/ml/models/resnet50_brain_tumor.pth"
    UPLOAD_DIR:         str  = "uploads"
    MAX_FILE_SIZE_MB:   int  = 50
    ALLOWED_ORIGINS:    str  = "*"

    # Public URL — update this when ngrok URL changes
    APP_URL:            str  = "http://localhost:5173"

    # Email
    EMAIL_FROM:         str  = ""
    EMAIL_PASSWORD:     str  = ""
    EMAIL_SMTP:         str  = "smtp.gmail.com"
    EMAIL_PORT:         int  = 587
    NOTIFY_ON_CRITICAL: bool = True

    class Config:
        env_file = ".env"
        extra    = "ignore"

settings = Settings()
