from pathlib import Path

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response

from app.services.pipeline import run_pipeline
from app.utils.files import new_result_id, processed_path, read_result, write_processed, write_result
from app.utils.validation import UploadError, validate_upload

router = APIRouter()


@router.post("/api/recognize")
async def recognize(file: UploadFile = File(...)):
    data = await file.read()
    try:
        validate_upload(file.filename, file.content_type, data)
        outcome = run_pipeline(data)
    except UploadError as error:
        return JSONResponse(status_code=400, content={"error": error.message})
    except ValueError:
        return JSONResponse(status_code=400, content={"error": "Image could not be read"})
    except RuntimeError:
        return JSONResponse(status_code=500, content={"error": "Image could not be processed"})
    result_id = new_result_id()
    write_result(result_id, outcome["text"])
    write_processed(result_id, outcome["processed_png"])
    return {
        "id": result_id,
        "text": outcome["text"],
        "processing_ms": outcome["processing_ms"],
        "filename": Path(file.filename).name,
    }


@router.get("/api/results/{result_id}/download")
def download(result_id: str):
    try:
        text = read_result(result_id)
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"error": "Result not found"})
    return Response(
        content=text,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{result_id}.txt"'},
    )


@router.get("/api/results/{result_id}/processed.png")
def processed(result_id: str):
    try:
        path = processed_path(result_id)
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"error": "Result not found"})
    return FileResponse(path, media_type="image/png")
