from pathlib import Path

MAX_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff"


class UploadError(Exception):
    def __init__(self, message):
        self.message = message


def validate_upload(filename, content_type, data):
    if not filename or filename != Path(filename).name or "/" in filename or "\\" in filename or ".." in filename:
        raise UploadError("Invalid file name")
    extension = Path(filename).suffix.lower()
    expected_type = ALLOWED_EXTENSIONS.get(extension)
    if expected_type is None:
        raise UploadError("Use a JPG or PNG image")
    if content_type != expected_type:
        raise UploadError("File type does not match the image")
    if not isinstance(data, (bytes, bytearray)) or len(data) == 0:
        raise UploadError("Image is empty")
    if len(data) > MAX_BYTES:
        raise UploadError("Image must be 5 MB or smaller")
    if extension == ".png" and not data.startswith(PNG_MAGIC):
        raise UploadError("File content is not a PNG image")
    if extension in {".jpg", ".jpeg"} and not data.startswith(JPEG_MAGIC):
        raise UploadError("File content is not a JPEG image")
    return extension
