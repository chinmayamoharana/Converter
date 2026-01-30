from django.urls import path
from .views import pdf_to_word, word_to_pdf

urlpatterns = [
    path('pdf-to-word/', pdf_to_word),
    path('word-to-pdf/', word_to_pdf),
]
