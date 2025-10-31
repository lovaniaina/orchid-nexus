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

# Add this new function inside /backend/crud.py

def create_objective(db: Session, objective: pydantic_models.ObjectiveCreate, project_id: int):
    """
    Creates a new Objective record in the database and links it to a project.
    """
    # Create a new SQLAlchemy model instance from the received data
    db_objective = db_models.Objective(name=objective.name, project_id=project_id)
    
    # Add the new instance to the session (staging it for saving)
    db.add(db_objective)
    
    # Commit the session to save the new record to the database
    db.commit()
    
    # Refresh the instance to get the new ID that the database assigned to it
    db.refresh(db_objective)
    
    return db_objective

# Add this new function inside /backend/crud.py

def create_activity(db: Session, activity: pydantic_models.ActivityCreate, objective_id: int):
    """
    Creates a new Activity record in the database and links it to an objective.
    """
    db_activity = db_models.Activity(name=activity.name, objective_id=objective_id)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

# Add this new function inside /backend/crud.py

def delete_objective(db: Session, objective_id: int):
    """
    Deletes an objective (and all its children) from the database.
    """
    # Find the specific objective to delete
    objective_to_delete = db.query(db_models.Objective).filter(db_models.Objective.id == objective_id).first()
    
    if objective_to_delete:
        # If found, delete it from the session
        db.delete(objective_to_delete)
        # Commit the session to make the deletion permanent
        db.commit()
    
    return objective_to_delete # Return the deleted item (or None if not found)

def delete_activity(db: Session, activity_id: int):
    """
    Deletes an activity (and its children) from the database.
    """
    activity_to_delete = db.query(db_models.Activity).filter(db_models.Activity.id == activity_id).first()
    if activity_to_delete:
        db.delete(activity_to_delete)
        db.commit()
    return activity_to_delete

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

# Add this new function inside /backend/crud.py

def update_objective(db: Session, objective_id: int, objective_update: pydantic_models.ObjectiveUpdate):
    """
    Updates an objective's name in the database.
    """
    db_objective = db.query(db_models.Objective).filter(db_models.Objective.id == objective_id).first()
    
    if db_objective:
        # Update the name field from the provided update data
        db_objective.name = objective_update.name
        db.commit()
        db.refresh(db_objective)
        
    return db_objective

# Add this new function inside /backend/crud.py

def update_activity(db: Session, activity_id: int, activity_update: pydantic_models.ActivityUpdate):
    """
    Updates an activity's name in the database.
    """
    db_activity = db.query(db_models.Activity).filter(db_models.Activity.id == activity_id).first()
    if db_activity:
        db_activity.name = activity_update.name
        db.commit()
        db.refresh(db_activity)
    return db_activity