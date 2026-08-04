import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".jfif"}

# (extension, magic bytes) — a cheap content sniff that rejects files that
# merely carry a whitelisted extension (e.g. an HTML file renamed to .pdf).
_MAGIC: dict[str, bytes] = {
    ".pdf": b"%PDF",
    ".png": b"\x89PNG\r\n\x1a\n",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".jfif": b"\xff\xd8\xff",
}


def _kind_dir(kind: str) -> Path:
    base = Path(settings.UPLOAD_DIR).expanduser()
    base.mkdir(parents=True, exist_ok=True)
    directory = base / kind
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def validate_and_save(upload: UploadFile, kind: str) -> tuple[Path, str]:
    """Validate an upload and write it to disk.

    Returns ``(absolute_path, stored_filename)``. The stored filename is a
    random uuid4 hex so two uploads never collide and the user-controlled
    filename never reaches the filesystem path (path traversal safe).

    Raises HTTPException 400/413/422 on invalid input.
    """
    if not upload.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was provided.",
        )

    extension = Path(upload.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF, JPG, or PNG file.",
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    head = upload.file.read(16)
    upload.file.seek(0)

    # Content-type sniffing for the strongest signal we have. jfif often
    # arrives as image/jpeg from browsers, so match on magic bytes only.
    if not head.startswith(_MAGIC[extension]):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "File contents do not match its extension. Please upload a "
                "valid, legible PDF or image."
            ),
        )

    stored_name = f"{uuid.uuid4().hex}{extension}"
    path = _kind_dir(kind) / stored_name

    try:
        with open(path, "wb") as buffer:
            while True:
                chunk = upload.file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)
    except OSError as exc:
        logger.error("Failed to write upload %s: %s", path, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not store the uploaded file.",
        )

    if path.stat().st_size > max_bytes:
        path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB size limit.",
        )

    return path, stored_name
