import os
import sys
from pathlib import Path

# Add backend/project directory to sys.path for Django
BASE_DIR = Path(__file__).resolve().parent.parent / "backend" / "project"
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
