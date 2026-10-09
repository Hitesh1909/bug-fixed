# Run

## Book application

Requires Node.js 22.

```powershell
cd nodejs
npm install
npm run db:init
npm start
```

Open http://localhost:3000

## Handwriting application

Requires Python 3.11 and Tesseract OCR.

Install Tesseract for Windows from https://github.com/UB-Mannheim/tesseract/wiki

The application looks for `C:\Program Files\Tesseract-OCR\tesseract.exe`.

Set `TESSERACT_CMD` to the executable path if Tesseract is installed somewhere else.

```powershell
cd python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000
