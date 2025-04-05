import logging
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.api.api import api_router
from app.db.base import Base
from app.db.init_db import init_db
from app.db.session import engine

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Fra-Gent API server")

    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # Continue anyway to allow the API to start

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Fra-Gent API server")

@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "name": "Fra-Gent",
        "version": "0.1.0",
        "status": "ok",
    }

# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)
