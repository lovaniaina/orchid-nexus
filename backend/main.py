# /backend/main.py - FINAL CORRECTED AND COMPLETE FOR MODULE 1

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# --- Absolute imports for all our local modules ---
import database_models
from database import engine, SessionLocal
import crud
from models import Project, DataEntryPayload

# This command creates the database tables if they don't exist
database_models.Base.metadata.create_all(bind=engine)

# Create the FastAPI app instance
app = FastAPI()

# --- CORS Middleware Configuration ---
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency for getting a database session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---

@app.get("/projects/{project_id}", response_model=Project)
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the full hierarchical details for a single project from the database.
    """
    db_project = crud.get_project(db=db, project_id=project_id)
    # In a real app, you would add an error check here for when the project is not found
    return db_project

@app.post("/data-entry", response_model=Project)
def create_data_entry(payload: DataEntryPayload, db: Session = Depends(get_db)):
    """
    Receives a data entry, updates the correct KPI in the database,
    and returns the entire updated project object.
    """
    task = crud.get_task(db=db, task_id=payload.taskId)
    
    if task:
        crud.update_kpi_value(db=db, kpi_id=task.kpi_id, value_to_add=payload.numericValue)

    # After the update, fetch the entire project again to get the fresh data
    updated_project = crud.get_project(db=db, project_id=1)
    
    return updated_project

@app.get("/")
def read_root():
    return {"message": "Orchid Nexus Backend is running!"}