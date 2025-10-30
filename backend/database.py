# /backend/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# The database URL tells SQLAlchemy where our database is located.
# For SQLite, it's just a path to a local file.
SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"

# The 'engine' is the core interface to the database.
# The 'connect_args' are only needed for SQLite to allow it to be used by multiple threads.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# A SessionLocal class is a "factory" for creating new database sessions.
# A session is like a temporary conversation with the database.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base will be used as a parent class for our database models.
Base = declarative_base()