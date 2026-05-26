from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import config
from app.api.routes import blast

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
app.include_router(blast.router, prefix="/api", tags=["Campaign"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
