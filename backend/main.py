from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import config
from app.api.routes.blast import router as blast_router
from app.api.routes.campaigns import router as campaigns_router
from app.db.database import engine, Base
from app.db import models

import logging
from contextlib import asynccontextmanager

# Setup simple logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Registered API Routes ===")
    for route in app.routes:
        logger.info(f"{route.methods} -> {route.path}")
    logger.info("=============================")
    
    # Initialize DB Tables
    logger.info("Initializing Database Tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized.")
    
    yield

app = FastAPI(title="GDGoC Blast Email API", lifespan=lifespan)

# Setup CORS untuk mengizinkan request dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(blast_router, prefix="/api", tags=["Blast Email Task"])
app.include_router(campaigns_router, prefix="/api", tags=["Campaign Data"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
