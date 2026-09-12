from django.urls import path
from .views import (
    health_check,
    pdf_to_word,
    word_to_pdf,
    pdf_to_ppt,
    ppt_to_pdf,
    image_to_pdf,
    pdf_to_image,
    merge_pdf,
    compress_pdf,
    compress_image,
    compress_word,
    compress_ppt,
    excel_to_pdf,
    pdf_to_excel,
    split_pdf,
    rotate_pdf,
)

urlpatterns = [
    path('health/', health_check),
    path('pdf-to-word/', pdf_to_word),
    path('word-to-pdf/', word_to_pdf),
    path('pdf-to-ppt/', pdf_to_ppt),
    path('ppt-to-pdf/', ppt_to_pdf),
    path('image-to-pdf/', image_to_pdf),
    path('pdf-to-image/', pdf_to_image),
    path('merge-pdf/', merge_pdf),
    path('compress-pdf/', compress_pdf),
    path('compress-image/', compress_image),
    path('compress-word/', compress_word),
    path('compress-ppt/', compress_ppt),
    path('excel-to-pdf/', excel_to_pdf),
    path('pdf-to-excel/', pdf_to_excel),
    path('split-pdf/', split_pdf),
    path('rotate-pdf/', rotate_pdf),
]

