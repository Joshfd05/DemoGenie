# DemoGenie Backend (FastAPI)

FastAPI backend that powers the DemoGenie frontend. Provides endpoints to replace frontend dummy data with real API responses, matching the exact JSON shapes used by the current UI.

## Requirements
- Python 3.11+
- pip or uv/pipx

## Install
```bash
cd /home/joshua/DemoGenie/Backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic
```

## Run
```bash
uvicorn Backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Or:
```bash
python -m Backend.main
```

- App runs at http://localhost:8000
- Open docs at http://localhost:8000/docs

## Endpoints
- POST /book-demo → Assign AE, schedule, return confirmation card shape
- GET /merchant/{merchant_id} → Confirmation card data
- GET /demos → AE dashboard list items matching frontend mock
- POST /generate-brief/{merchant_id} → Mock AI brief generation
- GET /prep-brief/{merchant_id} → Retrieve generated brief
- GET /calendar-events → Mock AE availability and booked slots

## Notes
- Uses in-memory storage with seeded AEs and bookings for demo speed
- JSON response keys mirror the frontend dummy objects so no UI changes are required
- Calendar and AI integrations are mocked; swap out in utils.py


