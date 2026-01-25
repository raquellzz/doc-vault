import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Salva o arquivo recebido na pasta local e retorna o caminho absoluto.
    """
    try:
        safe_filename = upload_file.filename.replace(" ", "_")
        file_path = UPLOAD_DIR / safe_filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return str(file_path.absolute())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
    finally:
        await upload_file.close()