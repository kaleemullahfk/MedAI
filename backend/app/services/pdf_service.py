import logging

import fitz

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        document = fitz.open(pdf_path)
        try:
            text = "".join(page.get_text() for page in document)
        finally:
            document.close()
        return text
    except Exception as exc:
        logger.warning("PDF extraction failed for %s: %s", pdf_path, exc)
        raise
