# ============================================================
# FAKENIX 2.0 — Production Dockerfile for Backend
# Optimized for Render Docker Web Service & containerized deployments
# ============================================================

FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    FLASK_ENV=production

# Install essential system dependencies (OpenCV headless, MediaInfo, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    mediainfo \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create application user for security (do not run as root)
RUN useradd -u 1001 -m -s /bin/bash appuser

# Copy application source code
COPY . /app

# Ensure storage directories exist with correct permissions
RUN mkdir -p storage/uploads storage/reports storage/processed storage/evidence && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (Render dynamically assigns $PORT)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-5000}/health || exit 1

# Start with Gunicorn WSGI server
CMD ["sh", "-c", "gunicorn \"app:create_app()\" --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 120 --access-logfile - --error-logfile -"]
