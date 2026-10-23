from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import settings
from backend.app.db.session import SessionLocal
from backend.app.db.init_db import init_db
from backend.app.api import health, dashboard, ingest, alerts, cases, accounts, graph

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seeds on startup
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Mule Account Detection and Financial Fraud Investigation Platform Backend",
    lifespan=lifespan,
)

# CORS Configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to prevent leaking internal traces in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    status_code = getattr(exc, "status_code", 500)
    return JSONResponse(
        status_code=status_code,
        content={
            "error": "Internal Processing Error",
            "message": error_msg,
            "path": request.url.path,
        },
    )

# Include API Routers under /api
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(ingest.router, prefix="/api", tags=["Ingest"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(cases.router, prefix="/api", tags=["Cases"])
app.include_router(accounts.router, prefix="/api", tags=["Accounts"])
app.include_router(graph.router, prefix="/api", tags=["Graph"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
