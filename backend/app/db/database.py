from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.core.config import config
import os

# Asumsi .env menggunakan format:
# DATABASE_URL=postgresql://user:password@localhost:5432/blast_email
# Gunakan psycopg2 untuk sinkron atau asyncpg untuk asinkron.
# Di sini kita gunakan versi sinkron jika URL tidak memakai asyncpg, tapi baiknya disesuaikan.
# Kita konversi jika url berupa postgresql:// menjadi postgresql+asyncpg://
db_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/blast_email")

if db_url.startswith("postgresql://"):
    async_db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
else:
    async_db_url = db_url

engine = create_async_engine(async_db_url, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
