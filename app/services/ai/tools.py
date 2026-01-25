import fitz
from pathlib import Path

def extract_text_from_pdf(file_path: str) -> str:
    """
    Lê um arquivo PDF do disco e retorna todo o seu conteúdo como uma única string.
    """
    try:
        doc = fitz.open(file_path)
        # print(f"📄 Extraindo texto do PDF: {file_path}, Total de páginas: {doc.page_count}")

        with open("output.txt", "w", encoding="utf-8") as out:
            # print("📄 Iniciando extração de texto...")
            full_text = []

            for page in doc:
                text = page.get_text() 
                
                # print(f"📄 Página {page.number + 1}: {len(text)} caracteres extraídos.")
                
                full_text.append(text)
                
                out.write(text)
                out.write("\n\f") 

            out.close()
            return "\n".join(full_text)
        
    except Exception as e:
        print(f"Erro ao ler PDF {file_path}: {e}")
        raise e
    finally:
        if 'doc' in locals():
            doc.close()