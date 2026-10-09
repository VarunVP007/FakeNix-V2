"""
FAKENIX 2.0 — Application Configuration
"""
import os
import secrets
from datetime import timedelta


def _secure_default(name: str, length: int = 32) -> str:
    return os.environ.get(name) or secrets.token_hex(length // 2)


class BaseConfig:
    """Base configuration shared across all environments."""

    # Flask
    SECRET_KEY = _secure_default('SECRET_KEY')
    JSON_SORT_KEYS = False

    # Database
    _RAW_DB_URL = os.environ.get('DATABASE_URL', 'sqlite:///fakenix_dev.db')
    # Render and Heroku provide postgres:// URLs, but SQLAlchemy 1.4+ requires postgresql://
    if _RAW_DB_URL and _RAW_DB_URL.startswith('postgres://'):
        _RAW_DB_URL = _RAW_DB_URL.replace('postgres://', 'postgresql://', 1)
    DATABASE_URL = _RAW_DB_URL
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT
    JWT_SECRET_KEY = _secure_default('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24))
    )
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # File uploads
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 104857600))  # 100 MB

    # Storage paths (resolved relative to backend/ folder)
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(_BASE_DIR, os.environ.get('UPLOAD_FOLDER', 'storage/uploads'))
    REPORT_FOLDER = os.path.join(_BASE_DIR, os.environ.get('REPORT_FOLDER', 'storage/reports'))
    PROCESSED_FOLDER = os.path.join(_BASE_DIR, os.environ.get('PROCESSED_FOLDER', 'storage/processed'))
    EVIDENCE_FOLDER = os.path.join(_BASE_DIR, os.environ.get('EVIDENCE_FOLDER', 'storage/evidence'))

    # AI Model
    MODEL_PATH = os.path.join(
        _BASE_DIR,
        os.environ.get('MODEL_PATH', 'models/fakenix_model.keras')
    )

    # Groq vision LLM (image/video deepfake analysis). When GROQ_API_KEY is set,
    # all uploads are analyzed by this model and DEMO_MODE is not used for them.
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
    GROQ_MODEL = os.environ.get('GROQ_MODEL', '')
    GROQ_TIMEOUT_SECONDS = float(os.environ.get('GROQ_TIMEOUT_SECONDS', 90))
    GROQ_VIDEO_FRAMES = int(os.environ.get('GROQ_VIDEO_FRAMES', 2))  # frames per video; must not exceed the model's image limit

    # Demo mode
    DEMO_MODE = os.environ.get('DEMO_MODE', 'true').lower() == 'true'

    # CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '')

    # Allowed upload extensions
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv'}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

    # Allowed MIME types
    ALLOWED_IMAGE_MIMES = {'image/jpeg', 'image/png', 'image/webp'}
    ALLOWED_VIDEO_MIMES = {'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/avi'}

    # Risk classification thresholds (deepfake confidence %)
    RISK_THRESHOLDS = {
        'low': (0.0, 30.0),         # 0–30% → real/low risk
        'suspicious': (30.0, 70.0), # 30–70% → suspicious/medium
        'high': (70.0, 100.1),      # 70–100% → deepfake/high
    }

    # Video frame sampling limits
    MAX_FRAMES_EXTRACTED = 30
    FRAME_SAMPLE_INTERVAL = 30  # every N frames

    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')


class DevelopmentConfig(BaseConfig):
    """Development configuration."""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = False


class TestingConfig(BaseConfig):
    """Testing configuration — uses in-memory SQLite."""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEMO_MODE = True
    # Use temp paths during testing
    import tempfile
    _TMP = tempfile.mkdtemp()
    UPLOAD_FOLDER = _TMP
    REPORT_FOLDER = _TMP
    PROCESSED_FOLDER = _TMP
    EVIDENCE_FOLDER = _TMP
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)


class ProductionConfig(BaseConfig):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False


config_map = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}
