# 🚀 OmniConvert — Next-Gen Document Studio

> **Ultra-fast, secure online document converter, editor, and high-ratio compressor suite.**  
> Built with Django REST Framework (Python), React 19, Vite, PyMuPDF, and TailwindCSS.

---

## 🌟 Key Features

* **⚡ Ultra-High Compression Engine (80% – 90% Reduction)**
  * **Compress PDF**: Downsamples raster graphics and re-encodes PDF page streams (`90 DPI`, quality `26`).
  * **Compress Image**: Converts heavy PNG/BMP/JPG files into WebP/JPEG (`24%` quality) with Lanczos downscaling.
  * **Compress PowerPoint & Word**: Re-compresses internal ZIP media folders with ZIP Deflate level 9.

* **🔄 Full Document Converter Suite**
  * **PDF ↔ Word**: Convert `.pdf` to `.docx` layout-preserved Word files and `.docx` to `.pdf`.
  * **PDF ↔ PowerPoint**: Convert `.pdf` to editable `.pptx` presentations and `.pptx` to `.pdf`.
  * **PDF ↔ Excel**: Extract tabular data to `.xlsx` sheets and `.xlsx` to `.pdf`.
  * **PDF ↔ Image**: Render PDF pages into high-res `.png` packages or convert `.jpg`/`.png` into single PDFs.
  * **PDF Utility Tools**: Split multi-page PDFs, Merge multiple PDFs, and Rotate PDF pages by 90°/180°/270°.

* **⚡ High-Performance Architecture**
  * **Multi-Threaded Parallel Execution**: Page rendering across `ThreadPoolExecutor` utilizes all CPU cores.
  * **Zero-Disk I/O Memory Streaming**: Renders and zips documents directly in RAM streams (`pixmap.tobytes()`).
  * **Auto-Purging & E2E Security**: Temporary uploaded media files are automatically purged.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Backend** | Python 3.12, Django 6.0, Django REST Framework, PyMuPDF (fitz), Pillow, `python-pptx`, `pdf2docx`, `openpyxl` |
| **Frontend** | React 19, Vite, React Router DOM v7, TailwindCSS, Lucide React, Axios |
| **Architecture** | REST API Architecture, Lazy Route Loading (`React.lazy`), Multithreaded Worker Execution |

---

## 📁 Repository Structure

```text
converter/
├── backend/
│   ├── env/                      # Virtual Environment
│   └── project/
│       ├── app/                  # Main Converter Django App
│       │   ├── urls.py           # API Route Definitions
│       │   └── views.py          # Multithreaded Converter & Compression Logic
│       ├── media/                # Output Storage (Auto-Purged)
│       └── manage.py
├── frontend/
│   ├── public/
│   │   ├── logo.svg              # OmniConvert Vector Logo
│   │   └── favicon.svg           # Tab Favicon
│   ├── src/
│   │   ├── api/                  # Axios Client Instance
│   │   ├── components/           # React Converter Components & Reusable Logo
│   │   ├── App.jsx               # Lazy Loaded React Router Layout
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* Python 3.10+
* Node.js 18+ & npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend/project

# Activate Python virtual environment (Windows)
..\env\Scripts\activate

# Run database migrations
python manage.py migrate

# Start Django backend server on http://127.0.0.1:8000
python manage.py runserver
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server on http://localhost:5173
npm run dev
```

---

## 📡 API Endpoints Reference

| Endpoint | Method | Input File Type | Description |
| :--- | :---: | :--- | :--- |
| `/api/pdf-to-word/` | `POST` | `.pdf` | Converts PDF to formatted DOCX document |
| `/api/word-to-pdf/` | `POST` | `.docx`, `.doc` | Converts Word document to PDF |
| `/api/pdf-to-ppt/` | `POST` | `.pdf` | Converts PDF pages into PPTX slide deck |
| `/api/ppt-to-pdf/` | `POST` | `.pptx`, `.ppt` | Converts PowerPoint deck to PDF |
| `/api/pdf-to-excel/` | `POST` | `.pdf` | Extracts PDF tabular data into Excel `.xlsx` |
| `/api/excel-to-pdf/` | `POST` | `.xlsx`, `.xls` | Converts Excel spreadsheet to PDF |
| `/api/pdf-to-image/` | `POST` | `.pdf` | Renders PDF pages to high-res PNG Zip |
| `/api/image-to-pdf/` | `POST` | `.png`, `.jpg` | Converts images into single PDF |
| `/api/compress-pdf/` | `POST` | `.pdf` | Downsamples and compresses PDF size (up to 90%) |
| `/api/compress-image/` | `POST` | `.jpg`, `.png`, `.webp` | High-ratio image compressor |
| `/api/compress-word/` | `POST` | `.docx` | Re-compresses Word document media |
| `/api/compress-ppt/` | `POST` | `.pptx` | Re-compresses PowerPoint deck media |
| `/api/merge-pdf/` | `POST` | `.pdf` (Multiple) | Merges multiple PDFs into one |
| `/api/split-pdf/` | `POST` | `.pdf` | Splits multi-page PDF into Zip archive |
| `/api/rotate-pdf/` | `POST` | `.pdf` | Rotates PDF pages by requested angle |

