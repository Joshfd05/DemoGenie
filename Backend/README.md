# DemoGenie Backend (FastAPI)

FastAPI backend that powers the DemoGenie frontend. Provides endpoints to replace frontend dummy data with real API responses, matching the exact JSON shapes used by the current UI. Includes AI-powered prep brief generation using OpenAI.

## Requirements
- Python 3.11+
- pip or uv/pipx

## Install
```bash
cd /home/joshua/DemoGenie/Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Setup
1. Copy the example environment file:
```bash
cp env.example .env
```

2. The OpenAI API key is already configured in `env.example`. If you need to update it:
```bash
# Edit .env and update OPENAI_API_KEY
OPENAI_API_KEY=your_openai_api_key_here
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
- POST `/book-demo` → Assign AE, schedule, return confirmation card shape
- GET `/merchant/{merchant_id}` → Confirmation card data
- GET `/demos` → AE dashboard list items matching frontend mock
- POST `/generate-brief/{merchant_id}` → AI-powered prep brief generation (OpenAI)
- GET `/prep-brief/{merchant_id}` → Retrieve generated brief
- GET `/calendar-events` → Mock AE availability and booked slots

## AI Features
- **Prep Brief Generation**: Uses OpenAI GPT-4 to generate personalized prep briefs
- **Fallback**: If OpenAI is unavailable, uses intelligent mock responses
- **Structured Output**: AI responses are parsed into consistent JSON format
- **Error Handling**: Graceful fallback to mock data if API calls fail

## Notes
- Uses in-memory storage with seeded AEs and bookings for demo speed
- JSON response keys mirror the frontend dummy objects so no UI changes are required
- Calendar integration is mocked; swap out in `utils.py`
- OpenAI API key is configured and ready to use


