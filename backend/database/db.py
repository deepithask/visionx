"""
Database Connection & Session Factory
SQLAlchemy 2.0 implementation ready for SQLite or PostgreSQL/Supabase
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import DATABASE_URL

# Connect args needed for SQLite thread handling
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for API routes to acquire a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
