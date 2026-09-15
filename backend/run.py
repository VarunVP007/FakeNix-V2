"""
FAKENIX 2.0 — Flask Application Entry Point
Run with: python run.py
Or with:  flask run
"""
import os
import sys

# Ensure the backend directory is in the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f"\n{'='*60}")
    print(f"  FAKENIX 2.0 Backend")
    print(f"  Running at: http://127.0.0.1:{port}")
    print(f"  Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"  Demo Mode: {os.environ.get('DEMO_MODE', 'true')}")
    print(f"{'='*60}\n")
    app.run(
        host='127.0.0.1',
        port=port,
        debug=debug,
        use_reloader=debug
    )
