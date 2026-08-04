import logging
import os

import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)

# Allow overriding the Tesseract binary path (e.g. a custom install or a
# Linux package) via TESSERACT_CMD. Falls back to PATH resolution.
_TESSERACT_CMD = os.environ.get("TESSERACT_CMD", "").strip()
if _TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD


def extract_text_from_image(image_path: str) -> str:
    try:
        image = Image.open(image_path)
        return pytesseract.image_to_string(image)
    except Exception as exc:
        logger.warning("OCR failed for %s: %s", image_path, exc)
        raise
