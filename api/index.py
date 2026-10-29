import os
import sys
from pathlib import Path

# Add backend/project directory to sys.path for Django
BASE_DIR = Path(__file__).resolve().parent.parent / "backend" / "project"
sys.path.insert(0, str(BASE_DIR))

# Configure TESSDATA_PREFIX for serverless OCR with PyMuPDF
tessdata_path = BASE_DIR / "tessdata"
if tessdata_path.exists() and (tessdata_path / "eng.traineddata").exists():
    os.environ["TESSDATA_PREFIX"] = str(tessdata_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
