import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
import os
import uuid

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Salva o arquivo recebido na pasta local e retorna o caminho absoluto.
    """
    if not UPLOAD_DIR.exists():
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_extension = upload_file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / new_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return str(file_path)