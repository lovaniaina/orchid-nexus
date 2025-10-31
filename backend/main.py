# /backend/main.py - FINAL CORRECTED AND COMPLETE FOR MODULE 1

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session


# --- Absolute imports for all our local modules ---
import database_models
from database import engine, SessionLocal
import crud
from models import Project, DataEntryPayload, ObjectiveCreate, Objective, ObjectiveUpdate, ActivityCreate, Activity, ActivityUpdate
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

# Add this new endpoint to /backend/main.py

@app.post("/projects/{project_id}/objectives", response_model=Objective)
def create_objective_for_project(
    project_id: int, 
    objective: ObjectiveCreate, 
    db: Session = Depends(get_db)
):
    """
    Creates a new objective linked to a specific project.
    """
    return crud.create_objective(db=db, objective=objective, project_id=project_id)

# Add this new endpoint to /backend/main.py
@app.put("/activities/{activity_id}", response_model=Activity)
def update_activity(
    activity_id: int,
    activity_update: ActivityUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates a specific activity by its ID.
    """
    return crud.update_activity(db=db, activity_id=activity_id, activity_update=activity_update)
# Add this new endpoint to /backend/main.py

@app.delete("/objectives/{objective_id}", status_code=204)
def delete_objective(objective_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific objective by its ID.
    """
    crud.delete_objective(db=db, objective_id=objective_id)
    # For DELETE operations, it's common to return no content.
    # The status_code=204 tells the client the operation was successful
    # but there is no data to return.
    return

# Add this new endpoint to /backend/main.py

@app.put("/objectives/{objective_id}", response_model=Objective)
def update_objective(
    objective_id: int,
    objective_update: ObjectiveUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates a specific objective by its ID.
    """
    return crud.update_objective(db=db, objective_id=objective_id, objective_update=objective_update)

# Add this new endpoint to /backend/main.py

@app.post("/objectives/{objective_id}/activities", response_model=Activity)
def create_activity_for_objective(
    objective_id: int,
    activity: ActivityCreate,
    db: Session = Depends(get_db)
):
    """
    Creates a new activity linked to a specific objective.
    """
    return crud.create_activity(db=db, activity=activity, objective_id=objective_id)

# Add this new endpoint to /backend/main.py

@app.delete("/activities/{activity_id}", status_code=204)
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific activity by its ID.
    """
    crud.delete_activity(db=db, activity_id=activity_id)
    return

@app.get("/")
def read_root():
    return {"message": "Orchid Nexus Backend is running!"}