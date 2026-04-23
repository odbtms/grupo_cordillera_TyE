import sys
try:
    import pypdf
    with open('Manual-Configuracion-EC2.pdf', 'rb') as file:
        reader = pypdf.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        with open('pdf_content.txt', 'w', encoding='utf-8') as out:
            out.write(text)
    print("Extracted with pypdf")
except ImportError:
    try:
        import fitz
        doc = fitz.open('Manual-Configuracion-EC2.pdf')
        text = ""
        for page in doc:
            text += page.get_text()
        with open('pdf_content.txt', 'w', encoding='utf-8') as out:
            out.write(text)
        print("Extracted with PyMuPDF")
    except ImportError:
        print("No PDF extraction library available.")
