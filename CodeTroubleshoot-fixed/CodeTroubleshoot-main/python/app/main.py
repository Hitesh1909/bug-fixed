from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routes.pages import router as page_router
from app.routes.recognize import router as recognize_router

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/static", StaticFiles(directory=FRONTEND / "static"), name="static")
app.include_router(page_router)
app.include_router(recognize_router)
