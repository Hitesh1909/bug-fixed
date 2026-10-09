import os

import pytesseract


def configure_tesseract():
    command = os.environ.get("TESSERACT_CMD")
    if command:
        pytesseract.pytesseract.tesseract_cmd = command
        return
    default = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(default):
        pytesseract.pytesseract.tesseract_cmd = default


def tesseract_config():
    return "--oem 3 --psm 6"


def prepare_for_ocr(original, preprocessed):
    return preprocessed


def extract_text(image, config):
    configure_tesseract()
    try:
        return pytesseract.image_to_string(image, lang="eng", config=config)
    except (pytesseract.TesseractError, OSError) as error:
        # TesseractNotFoundError is an OSError: Tesseract missing or failed to run
        raise RuntimeError("Text recognition failed") from error
