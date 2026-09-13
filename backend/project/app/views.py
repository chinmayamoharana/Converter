import os
import io
import time
import zipfile
from pathlib import Path
from uuid import uuid4

from django.conf import settings
import fitz  # PyMuPDF
from PIL import Image
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from docx2pdf import convert as docx_convert
from docx import Document
from docx.enum.section import WD_SECTION
from docx.shared import Pt
from pdf2docx import Converter
from pptx import Presentation
from concurrent.futures import ThreadPoolExecutor
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Ensure media folder exists
os.makedirs(settings.MEDIA_ROOT, exist_ok=True)



_last_purge_time = 0


def _purge_old_media_files(max_age_hours=1):
    global _last_purge_time
    now = time.time()
    if now - _last_purge_time < 900:  # Purge max once every 15 mins
        return
    _last_purge_time = now
    try:
        cutoff = now - (max_age_hours * 3600)
        media_path = Path(settings.MEDIA_ROOT)
        for item in media_path.iterdir():
            if item.is_file() and item.stat().st_mtime < cutoff:
                try:
                    item.unlink(missing_ok=True)
                except Exception:
                    pass
    except Exception:
        pass



def _build_unique_paths(upload_name, output_extension):
    _purge_old_media_files()
    original_name = Path(upload_name).name
    stem = Path(original_name).stem or "file"
    suffix = Path(original_name).suffix.lower()
    unique_id = uuid4().hex[:8]

    input_name = f"{stem}-{unique_id}-in{suffix}"
    output_name = f"{stem}-{unique_id}-out{output_extension}"

    return (
        Path(settings.MEDIA_ROOT) / input_name,
        Path(settings.MEDIA_ROOT) / output_name,
    )


def _save_uploaded_file(uploaded_file, destination):
    if hasattr(uploaded_file, 'seek'):
        try:
            uploaded_file.seek(0)
        except Exception:
            pass
    with open(destination, "wb+") as target:
        for chunk in uploaded_file.chunks():
            target.write(chunk)


def _cleanup_files(*paths):
    for path in paths:
        if path and Path(path).exists():
            try:
                Path(path).unlink(missing_ok=True)
            except Exception:
                pass


def _pdf_has_extractable_text(pdf_path):
    with fitz.open(pdf_path) as pdf_document:
        for page in pdf_document:
            if page.get_text("text").strip():
                return True
    return False


def _build_image_based_docx(pdf_path, docx_path):
    temp_images = []
    pdf_document = fitz.open(pdf_path)

    try:
        if pdf_document.page_count == 0:
            raise ValueError("The uploaded PDF has no pages.")

        document = Document()
        first_section = document.sections[0]
        first_page = pdf_document[0]
        first_section.page_width = Pt(first_page.rect.width)
        first_section.page_height = Pt(first_page.rect.height)
        first_section.top_margin = Pt(18)
        first_section.bottom_margin = Pt(18)
        first_section.left_margin = Pt(18)
        first_section.right_margin = Pt(18)

        for index, page in enumerate(pdf_document):
            if index > 0:
                section = document.add_section(WD_SECTION.NEW_PAGE)
                section.page_width = Pt(page.rect.width)
                section.page_height = Pt(page.rect.height)
                section.top_margin = Pt(18)
                section.bottom_margin = Pt(18)
                section.left_margin = Pt(18)
                section.right_margin = Pt(18)

            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image_path = Path(settings.MEDIA_ROOT) / f"{pdf_path.stem}-page-{index + 1}.png"
            pixmap.save(str(image_path))
            temp_images.append(image_path)

            section = document.sections[-1]
            usable_width = section.page_width - section.left_margin - section.right_margin
            document.add_picture(str(image_path), width=usable_width)

        document.save(docx_path)
    finally:
        pdf_document.close()
        _cleanup_files(*temp_images)


def _compress_zip_media(input_path, output_path, media_prefix="media/", extreme=True):
    if not zipfile.is_zipfile(input_path):
        import shutil
        shutil.copy2(input_path, output_path)
        return

    quality = 28 if extreme else 52
    max_dim = 850 if extreme else 1400

    with zipfile.ZipFile(input_path, 'r') as in_zip:
        with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as out_zip:
            for item in in_zip.infolist():
                data = in_zip.read(item.filename)
                
                if Path(item.filename).suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                    try:
                        img = Image.open(io.BytesIO(data))
                        img_format = img.format or ("JPEG" if Path(item.filename).suffix.lower() in ['.jpg', '.jpeg'] else "PNG")
                        
                        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

                        out_buffer = io.BytesIO()
                        
                        if img.mode in ("RGBA", "P") or extreme:
                            img = img.convert("RGB")
                            img_format = "JPEG"
                            
                        if img_format.upper() in ["JPEG", "JPG"]:
                            img.save(out_buffer, format="JPEG", quality=quality, optimize=True, progressive=True)
                        elif img_format.upper() == "PNG":
                            if extreme or img.mode != "RGB":
                                img = img.convert("RGB")
                                img.save(out_buffer, format="JPEG", quality=quality, optimize=True)
                            else:
                                img.save(out_buffer, format="PNG", optimize=True)
                        else:
                            img.save(out_buffer, format=img_format, optimize=True)
                            
                        compressed_data = out_buffer.getvalue()
                        if len(compressed_data) < len(data):
                            data = compressed_data
                        img.close()
                    except Exception:
                        pass
                        
                out_zip.writestr(item, data)




# ---------------- HEALTH CHECK ----------------
@api_view(['GET'])
def health_check(request):
    _purge_old_media_files()
    return Response({
        "status": "ok",
        "service": "OmniConvert Engine API",
        "active_tools": 15,
        "server_time": time.strftime("%Y-%m-%d %H:%M:%S"),
    })


# ---------------- 1. PDF → WORD ----------------
@api_view(['POST'])
def pdf_to_word(request):
    pdf_file = request.FILES.get('file')

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    pdf_path, docx_path = _build_unique_paths(pdf_file.name, ".docx")
    converter = None

    try:
        _save_uploaded_file(pdf_file, pdf_path)

        if _pdf_has_extractable_text(pdf_path):
            converter = Converter(str(pdf_path))
            converter.convert(str(docx_path))
            message = "PDF converted to Word document (.docx)"
        else:
            _build_image_based_docx(pdf_path, docx_path)
            message = "Image-based PDF converted to Word with page snapshots"
    except Exception as exc:
        _cleanup_files(pdf_path, docx_path)
        return Response(
            {"error": f"Conversion failed: {exc}"},
            status=500,
        )
    finally:
        if converter is not None:
            converter.close()

    return Response({
        "message": message,
        "file": settings.MEDIA_URL + docx_path.name
    })


# ---------------- 2. WORD → PDF ----------------
@api_view(['POST'])
def word_to_pdf(request):
    word_file = request.FILES.get("file")

    if not word_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(word_file.name).suffix.lower() not in [".docx", ".doc"]:
        return Response({"error": "Please upload a DOCX/DOC file"}, status=400)

    word_path, pdf_path = _build_unique_paths(word_file.name, ".pdf")

    try:
        _save_uploaded_file(word_file, word_path)
        docx_convert(str(word_path), str(pdf_path))
    except Exception as exc:
        _cleanup_files(word_path, pdf_path)
        return Response(
            {"error": f"Conversion failed: {exc}"},
            status=500,
        )

    return Response({
        "message": "Word converted to PDF with embedded formatting preserved",
        "file": settings.MEDIA_URL + pdf_path.name
    })


# ---------------- 3. PDF → PPT ----------------
@api_view(['POST'])
def pdf_to_ppt(request):
    pdf_file = request.FILES.get("file")

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    pdf_path, pptx_path = _build_unique_paths(pdf_file.name, ".pptx")
    temp_images = []

    try:
        _save_uploaded_file(pdf_file, pdf_path)

        pdf_doc = fitz.open(pdf_path)
        prs = Presentation()
        blank_slide_layout = prs.slide_layouts[6]

        if pdf_doc.page_count > 0:
            from pptx.util import Inches
            first_page = pdf_doc[0]
            prs.slide_width = Inches(first_page.rect.width / 72.0)
            prs.slide_height = Inches(first_page.rect.height / 72.0)

        def render_page(idx):
            page = pdf_doc[idx]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            return idx, pixmap.tobytes("png")

        max_workers = min(os.cpu_count() or 4, 8)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            rendered_pages = list(executor.map(render_page, range(pdf_doc.page_count)))

        for idx, img_bytes in rendered_pages:
            slide = prs.slides.add_slide(blank_slide_layout)
            slide.shapes.add_picture(
                io.BytesIO(img_bytes),
                left=0,
                top=0,
                width=prs.slide_width,
                height=prs.slide_height,
            )

        pdf_doc.close()
        prs.save(str(pptx_path))
    except Exception as exc:
        _cleanup_files(pdf_path, pptx_path)
        return Response(
            {"error": f"PDF to PPT conversion failed: {exc}"},
            status=500,
        )
    finally:
        _cleanup_files(*temp_images)

    return Response({
        "message": "PDF converted to PowerPoint presentation (.pptx)",
        "file": settings.MEDIA_URL + pptx_path.name
    })


# ---------------- 4. PPT → PDF ----------------
@api_view(['POST'])
def ppt_to_pdf(request):
    ppt_file = request.FILES.get("file")

    if not ppt_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(ppt_file.name).suffix.lower() not in [".pptx", ".ppt"]:
        return Response({"error": "Please upload a PPT/PPTX file"}, status=400)

    ppt_path, pdf_path = _build_unique_paths(ppt_file.name, ".pdf")

    try:
        _save_uploaded_file(ppt_file, ppt_path)

        try:
            import win32com.client
            powerpoint = win32com.client.Dispatch("PowerPoint.Application")
            powerpoint.Visible = 1
            deck = powerpoint.Presentations.Open(str(ppt_path.resolve()))
            deck.SaveAs(str(pdf_path.resolve()), 32)
            deck.Close()
            powerpoint.Quit()
        except Exception:
            prs = Presentation(str(ppt_path))
            doc = fitz.open()

            for slide in prs.slides:
                page = doc.new_page(width=720, height=540)
                text_content = []
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        text_content.append(shape.text)
                
                full_text = "\n".join(text_content).strip()
                if not full_text:
                    full_text = f"Slide Content ({len(doc)} pages)"

                page.insert_text(fitz.Point(36, 50), full_text, fontsize=14)

            doc.save(str(pdf_path))
            doc.close()

    except Exception as exc:
        _cleanup_files(ppt_path, pdf_path)
        return Response(
            {"error": f"PPT to PDF conversion failed: {exc}"},
            status=500,
        )

    return Response({
        "message": "PowerPoint converted to PDF presentation",
        "file": settings.MEDIA_URL + pdf_path.name
    })


# ---------------- 5. IMAGE → PDF ----------------
@api_view(['POST'])
def image_to_pdf(request):
    files = request.FILES.getlist("files") or [request.FILES.get("file")]
    files = [f for f in files if f is not None]

    if not files:
        return Response({"error": "No image files uploaded"}, status=400)

    out_name = f"images_converted-{uuid4().hex[:8]}.pdf"
    pdf_path = Path(settings.MEDIA_ROOT) / out_name

    temp_files = []
    pil_images = []

    try:
        for idx, img_file in enumerate(files):
            suffix = Path(img_file.name).suffix.lower()
            if suffix not in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"]:
                continue

            temp_img_path = Path(settings.MEDIA_ROOT) / f"temp_{uuid4().hex[:6]}{suffix}"
            _save_uploaded_file(img_file, temp_img_path)
            temp_files.append(temp_img_path)

            img = Image.open(temp_img_path)
            if img.mode != "RGB":
                img = img.convert("RGB")
            pil_images.append(img)

        if not pil_images:
            return Response({"error": "No valid image files processed"}, status=400)

        first_img = pil_images[0]
        other_imgs = pil_images[1:] if len(pil_images) > 1 else []

        first_img.save(str(pdf_path), "PDF", resolution=100.0, save_all=True, append_images=other_imgs)

        for img in pil_images:
            img.close()

    except Exception as exc:
        _cleanup_files(pdf_path, *temp_files)
        return Response(
            {"error": f"Image to PDF conversion failed: {exc}"},
            status=500,
        )
    finally:
        _cleanup_files(*temp_files)

    return Response({
        "message": f"Successfully converted {len(pil_images)} image(s) to PDF",
        "file": settings.MEDIA_URL + pdf_path.name
    })


# ---------------- 6. PDF → IMAGE ----------------
@api_view(['POST'])
def pdf_to_image(request):
    pdf_file = request.FILES.get("file")

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    pdf_path, _ = _build_unique_paths(pdf_file.name, ".pdf")

    try:
        _save_uploaded_file(pdf_file, pdf_path)
        pdf_doc = fitz.open(pdf_path)
        total_pages = pdf_doc.page_count

        if total_pages == 0:
            pdf_doc.close()
            raise ValueError("The uploaded PDF has no pages.")

        if total_pages == 1:
            png_name = f"{pdf_path.stem}-page1.png"
            png_path = Path(settings.MEDIA_ROOT) / png_name
            pixmap = pdf_doc[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            pixmap.save(str(png_path))
            pdf_doc.close()

            return Response({
                "message": "PDF page exported as high-res PNG image",
                "file": settings.MEDIA_URL + png_name
            })
        else:
            zip_name = f"{pdf_path.stem}-images.zip"
            zip_path = Path(settings.MEDIA_ROOT) / zip_name

            def render_page(idx):
                page = pdf_doc[idx]
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                return idx, pixmap.tobytes("png")

            max_workers = min(os.cpu_count() or 4, 8)
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                rendered_pages = list(executor.map(render_page, range(total_pages)))

            with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_STORED) as zipf:
                for idx, img_bytes in rendered_pages:
                    zipf.writestr(f"page-{idx+1}.png", img_bytes)

            pdf_doc.close()

            return Response({
                "message": f"Exported {total_pages} PDF pages into PNG Zip package",
                "file": settings.MEDIA_URL + zip_name
            })

    except Exception as exc:
        return Response(
            {"error": f"PDF to Image conversion failed: {exc}"},
            status=500,
        )
    finally:
        _cleanup_files(pdf_path)


# ---------------- 7. MERGE PDF ----------------
@api_view(['POST'])
def merge_pdf(request):
    files = request.FILES.getlist("files") or [request.FILES.get("file")]
    files = [f for f in files if f is not None]

    if len(files) < 2:
        return Response({"error": "Please upload at least 2 PDF files to merge."}, status=400)

    out_name = f"merged-{uuid4().hex[:8]}.pdf"
    merged_pdf_path = Path(settings.MEDIA_ROOT) / out_name
    temp_pdfs = []

    try:
        merged_doc = fitz.open()

        for pdf_file in files:
            if Path(pdf_file.name).suffix.lower() != ".pdf":
                continue

            temp_path = Path(settings.MEDIA_ROOT) / f"temp_{uuid4().hex[:6]}.pdf"
            _save_uploaded_file(pdf_file, temp_path)
            temp_pdfs.append(temp_path)

            doc = fitz.open(temp_path)
            merged_doc.insert_pdf(doc)
            doc.close()

        if merged_doc.page_count == 0:
            merged_doc.close()
            return Response({"error": "No valid PDF pages found to merge."}, status=400)

        merged_doc.save(str(merged_pdf_path))
        merged_doc.close()

    except Exception as exc:
        _cleanup_files(merged_pdf_path, *temp_pdfs)
        return Response(
            {"error": f"Merge PDF failed: {exc}"},
            status=500,
        )
    finally:
        _cleanup_files(*temp_pdfs)

    return Response({
        "message": f"Successfully merged {len(temp_pdfs)} PDF files into one document",
        "file": settings.MEDIA_URL + merged_pdf_path.name
    })


# ---------------- 8. COMPRESS PDF ----------------
@api_view(['POST'])
def compress_pdf(request):
    pdf_file = request.FILES.get("file")
    mode = request.data.get("mode", "extreme")

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    stem = Path(pdf_file.name).stem or "file"
    out_name = f"{stem}-compressed-{uuid4().hex[:8]}.pdf"
    compressed_path = Path(settings.MEDIA_ROOT) / out_name

    try:
        file_bytes = pdf_file.read()
        original_size = len(file_bytes)

        if original_size == 0:
            return Response({"error": "Uploaded PDF file is empty."}, status=400)

        pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")

        if pdf_doc.page_count == 0:
            pdf_doc.close()
            return Response({"error": "PDF document contains no pages."}, status=400)

        is_extreme = mode == "extreme"
        dpi_val = 90 if is_extreme else 115
        quality_val = 26 if is_extreme else 48

        new_doc = fitz.open()

        def process_page(page_num):
            page = pdf_doc[page_num]
            pixmap = page.get_pixmap(dpi=dpi_val, alpha=False)
            img = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            
            img_buffer = io.BytesIO()
            img.save(img_buffer, format="JPEG", quality=quality_val, optimize=True, progressive=True)
            img.close()
            return (page.rect.width, page.rect.height, img_buffer.getvalue())

        max_workers = min(os.cpu_count() or 4, 8)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(process_page, range(pdf_doc.page_count)))

        for w, h, img_bytes in results:
            new_page = new_doc.new_page(width=w, height=h)
            new_page.insert_image(new_page.rect, stream=img_bytes)

        compressed_bytes = new_doc.tobytes(garbage=4, deflate=True)
        new_doc.close()
        pdf_doc.close()

        compressed_size = len(compressed_bytes)
        if compressed_size >= original_size:
            compressed_bytes = file_bytes
            compressed_size = original_size
            savings_percent = 0.0
        else:
            savings_percent = round((1 - (compressed_size / max(original_size, 1))) * 100, 1)

        with open(compressed_path, "wb") as f:
            f.write(compressed_bytes)

    except Exception as exc:
        _cleanup_files(compressed_path)
        return Response(
            {"error": f"PDF compression failed: {str(exc)}"},
            status=400,
        )

    return Response({
        "message": f"PDF compressed! Reduced by {savings_percent}%" if savings_percent > 0 else "PDF file is already fully optimized!",
        "file": settings.MEDIA_URL + compressed_path.name,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "savings_percent": savings_percent,
    })


# ---------------- 9. COMPRESS IMAGE ----------------
@api_view(['POST'])
def compress_image(request):
    img_file = request.FILES.get("file")
    mode = request.data.get("mode", "extreme")

    if not img_file:
        return Response({"error": "No image file uploaded"}, status=400)

    suffix = Path(img_file.name).suffix.lower()
    if suffix not in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
        return Response({"error": "Please upload a valid image file (JPG, PNG, WEBP, BMP)"}, status=400)

    stem = Path(img_file.name).stem or "image"
    out_name = f"{stem}-compressed-{uuid4().hex[:8]}{'.jpg' if mode == 'extreme' else suffix}"
    compressed_path = Path(settings.MEDIA_ROOT) / out_name

    try:
        raw_bytes = img_file.read()
        original_size = len(raw_bytes)

        img = Image.open(io.BytesIO(raw_bytes))
        is_extreme = mode == "extreme"

        quality = 24 if is_extreme else 48
        max_dim = 1000 if is_extreme else 1600

        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        if img.mode in ("RGBA", "P") or is_extreme:
            img = img.convert("RGB")

        out_buffer = io.BytesIO()

        if is_extreme or suffix in [".jpg", ".jpeg", ".bmp"]:
            img.save(out_buffer, format="JPEG", quality=quality, optimize=True, progressive=True)
        elif suffix == ".webp":
            img.save(out_buffer, format="WEBP", quality=quality, method=6)
        else:
            img.save(out_buffer, format="PNG", optimize=True)

        img.close()
        compressed_bytes = out_buffer.getvalue()

        if len(compressed_bytes) >= original_size:
            compressed_bytes = raw_bytes
            savings_percent = 0.0
        else:
            savings_percent = round((1 - (len(compressed_bytes) / max(original_size, 1))) * 100, 1)

        with open(compressed_path, "wb") as f:
            f.write(compressed_bytes)

        compressed_size = len(compressed_bytes)

    except Exception as exc:
        _cleanup_files(compressed_path)
        return Response(
            {"error": f"Image compression failed: {str(exc)}"},
            status=400,
        )

    return Response({
        "message": f"Image compressed! Reduced by {savings_percent}%" if savings_percent > 0 else "Image is already fully optimized!",
        "file": settings.MEDIA_URL + compressed_path.name,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "savings_percent": savings_percent,
    })


# ---------------- 10. COMPRESS WORD ----------------
@api_view(['POST'])
def compress_word(request):
    docx_file = request.FILES.get("file")
    mode = request.data.get("mode", "extreme")

    if not docx_file:
        return Response({"error": "No Word file uploaded"}, status=400)

    if Path(docx_file.name).suffix.lower() not in [".docx", ".doc"]:
        return Response({"error": "Please upload a Word file (.docx or .doc)"}, status=400)

    docx_path, compressed_path = _build_unique_paths(docx_file.name, Path(docx_file.name).suffix.lower())

    try:
        _save_uploaded_file(docx_file, docx_path)
        original_size = docx_path.stat().st_size

        _compress_zip_media(docx_path, compressed_path, media_prefix="word/media/", extreme=(mode == "extreme"))

        compressed_size = compressed_path.stat().st_size
        if compressed_size >= original_size or compressed_size == 0:
            compressed_path.unlink(missing_ok=True)
            _save_uploaded_file(docx_file, compressed_path)
            compressed_size = original_size
            savings_percent = 0.0
        else:
            savings_percent = round((1 - (compressed_size / max(original_size, 1))) * 100, 1)

    except Exception as exc:
        _cleanup_files(docx_path, compressed_path)
        return Response(
            {"error": f"Word compression failed: {str(exc)}"},
            status=400,
        )
    finally:
        _cleanup_files(docx_path)

    return Response({
        "message": f"Word document compressed! Size reduced by {savings_percent}%" if savings_percent > 0 else "Word document is already fully optimized!",
        "file": settings.MEDIA_URL + compressed_path.name,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "savings_percent": savings_percent,
    })


# ---------------- 11. COMPRESS POWERPOINT ----------------
@api_view(['POST'])
def compress_ppt(request):
    pptx_file = request.FILES.get("file")
    mode = request.data.get("mode", "extreme")

    if not pptx_file:
        return Response({"error": "No PowerPoint file uploaded"}, status=400)

    if Path(pptx_file.name).suffix.lower() not in [".pptx", ".ppt"]:
        return Response({"error": "Please upload a PowerPoint file (.pptx or .ppt)"}, status=400)

    pptx_path, compressed_path = _build_unique_paths(pptx_file.name, Path(pptx_file.name).suffix.lower())

    try:
        _save_uploaded_file(pptx_file, pptx_path)
        original_size = pptx_path.stat().st_size

        _compress_zip_media(pptx_path, compressed_path, media_prefix="ppt/media/", extreme=(mode == "extreme"))

        compressed_size = compressed_path.stat().st_size
        if compressed_size >= original_size or compressed_size == 0:
            compressed_path.unlink(missing_ok=True)
            _save_uploaded_file(pptx_file, compressed_path)
            compressed_size = original_size
            savings_percent = 0.0
        else:
            savings_percent = round((1 - (compressed_size / max(original_size, 1))) * 100, 1)

    except Exception as exc:
        _cleanup_files(pptx_path, compressed_path)
        return Response(
            {"error": f"PowerPoint compression failed: {str(exc)}"},
            status=400,
        )
    finally:
        _cleanup_files(pptx_path)

    return Response({
        "message": f"PowerPoint compressed! Size reduced by {savings_percent}%" if savings_percent > 0 else "PowerPoint deck is already fully optimized!",
        "file": settings.MEDIA_URL + compressed_path.name,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "savings_percent": savings_percent,
    })


# ---------------- 12. EXCEL → PDF (NEW) ----------------
@api_view(['POST'])
def excel_to_pdf(request):
    excel_file = request.FILES.get("file")

    if not excel_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(excel_file.name).suffix.lower() not in [".xlsx", ".xls"]:
        return Response({"error": "Please upload an Excel file (.xlsx)"}, status=400)

    excel_path, pdf_path = _build_unique_paths(excel_file.name, ".pdf")

    try:
        _save_uploaded_file(excel_file, excel_path)

        wb = openpyxl.load_workbook(excel_path, data_only=True)
        pdf_doc = fitz.open()

        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            page = pdf_doc.new_page(width=792, height=612)  # Landscape letter
            
            lines = [f"Sheet: {sheet_name}", "=" * 50]
            for row in sheet.iter_rows(values_only=True):
                row_vals = [str(val) if val is not None else "" for val in row]
                if any(row_vals):
                    lines.append("  |  ".join(row_vals[:8]))

            full_text = "\n".join(lines[:35])
            page.insert_text(fitz.Point(36, 40), full_text, fontsize=11)

        wb.close()
        pdf_doc.save(str(pdf_path))
        pdf_doc.close()

    except Exception as exc:
        _cleanup_files(excel_path, pdf_path)
        return Response(
            {"error": f"Excel to PDF conversion failed: {str(exc)}"},
            status=500,
        )
    finally:
        _cleanup_files(excel_path)

    return Response({
        "message": "Excel spreadsheet converted to PDF document successfully",
        "file": settings.MEDIA_URL + pdf_path.name
    })


# ---------------- 13. PDF → EXCEL (NEW) ----------------
@api_view(['POST'])
def pdf_to_excel(request):
    pdf_file = request.FILES.get("file")

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    pdf_path, excel_path = _build_unique_paths(pdf_file.name, ".xlsx")

    try:
        _save_uploaded_file(pdf_file, pdf_path)

        pdf_doc = fitz.open(pdf_path)
        wb = openpyxl.Workbook()
        wb.remove(wb.active)  # remove default sheet

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")

        for idx, page in enumerate(pdf_doc):
            ws = wb.create_sheet(title=f"Page {idx+1}")
            text_blocks = page.get_text("blocks")

            ws.append(["Block ID", "Extracted Content"])
            for cell in ws[1]:
                cell.font = header_font
                cell.fill = header_fill

            for block_id, block in enumerate(text_blocks):
                content = block[4].strip()
                if content:
                    ws.append([f"Block {block_id+1}", content])

        pdf_doc.close()
        wb.save(str(excel_path))
        wb.close()

    except Exception as exc:
        _cleanup_files(pdf_path, excel_path)
        return Response(
            {"error": f"PDF to Excel conversion failed: {str(exc)}"},
            status=500,
        )
    finally:
        _cleanup_files(pdf_path)

    return Response({
        "message": "PDF content extracted into Excel workbook (.xlsx)",
        "file": settings.MEDIA_URL + excel_path.name
    })


# ---------------- 14. SPLIT PDF ----------------
@api_view(['POST'])
def split_pdf(request):
    pdf_file = request.FILES.get("file")

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    pdf_path, _ = _build_unique_paths(pdf_file.name, ".pdf")

    try:
        _save_uploaded_file(pdf_file, pdf_path)
        pdf_doc = fitz.open(pdf_path)
        total_pages = pdf_doc.page_count

        if total_pages == 0:
            pdf_doc.close()
            return Response({"error": "PDF has no pages to split."}, status=400)

        zip_name = f"{pdf_path.stem}-split.zip"
        zip_path = Path(settings.MEDIA_ROOT) / zip_name

        def split_page(idx):
            single_doc = fitz.open()
            single_doc.insert_pdf(pdf_doc, from_page=idx, to_page=idx)
            data = single_doc.tobytes(garbage=4, deflate=True)
            single_doc.close()
            return idx, data

        max_workers = min(os.cpu_count() or 4, 8)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            rendered_pdfs = list(executor.map(split_page, range(total_pages)))

        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
            for idx, pdf_bytes in rendered_pdfs:
                zipf.writestr(f"page-{idx+1}.pdf", pdf_bytes)

        pdf_doc.close()

    except Exception as exc:
        return Response(
            {"error": f"PDF split failed: {str(exc)}"},
            status=500,
        )
    finally:
        _cleanup_files(pdf_path)

    return Response({
        "message": f"Successfully split {total_pages} PDF pages into ZIP archive",
        "file": settings.MEDIA_URL + zip_name
    })


# ---------------- 15. ROTATE PDF (NEW) ----------------
@api_view(['POST'])
def rotate_pdf(request):
    pdf_file = request.FILES.get("file")
    raw_angle = request.data.get("angle", 90)
    try:
        angle = int(raw_angle)
    except (ValueError, TypeError):
        angle = 90

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    if Path(pdf_file.name).suffix.lower() != ".pdf":
        return Response({"error": "Please upload a PDF file"}, status=400)

    pdf_path, rotated_path = _build_unique_paths(pdf_file.name, ".pdf")

    try:
        _save_uploaded_file(pdf_file, pdf_path)
        pdf_doc = fitz.open(pdf_path)

        for page in pdf_doc:
            page.set_rotation((page.rotation + angle) % 360)

        pdf_doc.save(str(rotated_path), deflate=True, garbage=3)
        pdf_doc.close()

    except Exception as exc:
        _cleanup_files(pdf_path, rotated_path)
        return Response(
            {"error": f"PDF rotation failed: {str(exc)}"},
            status=500,
        )
    finally:
        _cleanup_files(pdf_path)

    return Response({
        "message": f"PDF pages rotated by {angle}° successfully",
        "file": settings.MEDIA_URL + rotated_path.name
    })
