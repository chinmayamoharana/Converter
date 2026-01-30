import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from pdf2docx import Converter
from docx2pdf import convert


# ensure media folder exists
os.makedirs(settings.MEDIA_ROOT, exist_ok=True)


# ---------------- PDF → WORD ----------------
@api_view(['POST'])
def pdf_to_word(request):
    pdf_file = request.FILES.get('file')

    if not pdf_file:
        return Response({"error": "No file uploaded"}, status=400)

    pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_file.name)
    docx_path = pdf_path.replace(".pdf", ".docx")

    with open(pdf_path, "wb+") as f:
        for chunk in pdf_file.chunks():
            f.write(chunk)

    cv = Converter(pdf_path)
    cv.convert(docx_path)
    cv.close()

    return Response({
        "message": "PDF converted to Word",
        "file": settings.MEDIA_URL + os.path.basename(docx_path)
    })


# ---------------- WORD → PDF (NO SOFFICE) ----------------
@api_view(['POST'])
def word_to_pdf(request):
    word_file = request.FILES.get("file")

    if not word_file:
        return Response({"error": "No file uploaded"}, status=400)

    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

    word_path = os.path.join(settings.MEDIA_ROOT, word_file.name)
    pdf_path = word_path.replace(".docx", ".pdf")

    with open(word_path, "wb+") as f:
        for chunk in word_file.chunks():
            f.write(chunk)

    # ✅ THIS uses Microsoft Word internally
    convert(word_path, pdf_path)

    return Response({
        "message": "PDF generated exactly like Word",
        "file": settings.MEDIA_URL + os.path.basename(pdf_path)
    })