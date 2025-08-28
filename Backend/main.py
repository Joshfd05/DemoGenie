from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Local modules
from .routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(title="DemoGenie Backend", version="0.1.0")

    # CORS: allow frontend origin(s)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "https://v0.dev",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    return app


app = create_app()


if __name__ == "__main__":
    # Uvicorn entry point for `python Backend/main.py`
    uvicorn.run("Backend.main:app", host="0.0.0.0", port=8000, reload=True)


