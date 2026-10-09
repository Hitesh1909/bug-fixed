import io

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


def png_bytes(width=80, height=40):
    image = Image.new("RGB", (width, height), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def jpeg_bytes():
    image = Image.new("RGB", (80, 40), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_homepage():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "Process" in response.text
    assert "Copy text" in response.text
    assert "Download text" in response.text


def test_recognize_png(monkeypatch, tmp_path):
    monkeypatch.setenv("RESULT_DIR", str(tmp_path))
    monkeypatch.setattr(
        "app.recognition.ocr.pytesseract.image_to_string",
        lambda image, lang="eng", config="": "Hello",
    )
    client = TestClient(app)
    response = client.post(
        "/api/recognize",
        files={"file": ("note.png", png_bytes(), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["text"], str)
    assert isinstance(body["processing_ms"], (int, float))
    assert body["filename"] == "note.png"


def test_recognize_jpeg(monkeypatch, tmp_path):
    monkeypatch.setenv("RESULT_DIR", str(tmp_path))
    monkeypatch.setattr(
        "app.recognition.ocr.pytesseract.image_to_string",
        lambda image, lang="eng", config="": "Hello",
    )
    client = TestClient(app)
    response = client.post(
        "/api/recognize",
        files={"file": ("scan.jpg", jpeg_bytes(), "image/jpeg")},
    )
    assert response.status_code == 200
    assert isinstance(response.json()["text"], str)


def test_missing_file():
    client = TestClient(app)
    response = client.post("/api/recognize")
    assert response.status_code == 422


def test_rejects_pdf():
    client = TestClient(app)
    response = client.post(
        "/api/recognize",
        files={"file": ("notes.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 400


def test_rejects_png_with_wrong_content():
    client = TestClient(app)
    response = client.post(
        "/api/recognize",
        files={"file": ("note.png", b"not-an-image", "image/png")},
    )
    assert response.status_code == 400


def test_rejects_oversized_image():
    client = TestClient(app)
    payload = png_bytes() + b"0" * (5 * 1024 * 1024)
    response = client.post(
        "/api/recognize",
        files={"file": ("large.png", payload, "image/png")},
    )
    assert response.status_code == 400


def test_rejects_path_filename(monkeypatch, tmp_path):
    monkeypatch.setenv("RESULT_DIR", str(tmp_path))
    client = TestClient(app)
    response = client.post(
        "/api/recognize",
        files={"file": ("../../secret.png", png_bytes(), "image/png")},
    )
    assert response.status_code == 400


def test_download_returns_recognized_text(monkeypatch, tmp_path):
    monkeypatch.setenv("RESULT_DIR", str(tmp_path))
    monkeypatch.setattr(
        "app.recognition.ocr.pytesseract.image_to_string",
        lambda image, lang="eng", config="": "Hello\nWorld",
    )
    client = TestClient(app)
    created = client.post(
        "/api/recognize",
        files={"file": ("note.png", png_bytes(), "image/png")},
    ).json()
    response = client.get(f"/api/results/{created['id']}/download")
    assert response.status_code == 200
    assert response.text == "Hello\nWorld"


def test_download_unknown_result():
    client = TestClient(app)
    response = client.get("/api/results/" + "0" * 32 + "/download")
    assert response.status_code == 404


def test_resize_keeps_aspect_ratio():
    import numpy as np

    from app.preprocessing.image_ops import resize_image

    assert resize_image(np.zeros((1200, 480, 3), np.uint8)).shape[:2] == (600, 240)
    assert resize_image(np.zeros((280, 1400, 3), np.uint8)).shape[:2] == (160, 800)


def test_preprocess_gives_dark_text_on_light_background():
    import numpy as np

    from app.preprocessing.image_ops import preprocess_image

    image = np.full((100, 300, 3), 255, np.uint8)
    image[40:60, 50:250] = 0
    binary = preprocess_image(image)
    assert binary[0, 0] == 255  # background stays white
    assert binary[50, 100] == 0  # ink is black


def test_tesseract_failure_returns_500(monkeypatch, tmp_path):
    monkeypatch.setenv("RESULT_DIR", str(tmp_path))

    def boom(image, lang="eng", config=""):
        raise OSError("tesseract is not installed")

    monkeypatch.setattr("app.recognition.ocr.pytesseract.image_to_string", boom)
    client = TestClient(app)
    response = client.post(
        "/api/recognize",
        files={"file": ("note.png", png_bytes(), "image/png")},
    )
    assert response.status_code == 500
    assert "error" in response.json()
