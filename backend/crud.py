# /backend/crud.py - FINAL CORRECTED VERSION

from sqlalchemy.orm import Session, joinedload

# --- Corrected ABSOLUTE imports ---
import database_models as db_models
import models as pydantic_models

# --- READ Functions ---

def get_project(db: Session, project_id: int):
    """
    Retrieves a single project by its ID, eagerly loading all related data.
    """
    return db.query(db_models.Project).options(
        joinedload(db_models.Project.objectives)
        .joinedload(db_models.Objective.activities)
        .joinedload(db_models.Activity.kpis)
    ).options(
         joinedload(db_models.Project.objectives)
        .joinedload(db_models.Objective.activities)
        .joinedload(db_models.Activity.tasks)
    ).filter(db_models.Project.id == project_id).first()

def get_task(db: Session, task_id: int):
    """
    Retrieves a single task by its ID.
    """
    return db.query(db_models.Task).filter(db_models.Task.id == task_id).first()

# --- UPDATE Functions ---

def update_kpi_value(db: Session, kpi_id: int, value_to_add: float):
    """
    Finds a KPI by its ID and adds the given value to its current_value.
    """
    kpi_to_update = db.query(db_models.KPI).filter(db_models.KPI.id == kpi_id).first()

    if kpi_to_update:
        kpi_to_update.current_value += value_to_add
        db.commit()
        db.refresh(kpi_to_update)
    
    return kpi_to_update
