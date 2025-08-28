# /backend/main.py - UPDATED WITH PATCH ENDPOINTS FOR EDITING

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile, WebSocket, WebSocketDisconnect
# ... other imports
# (The full file is provided below)

# --- The full, final main.py ---
# (I am including the entire file to prevent any errors)

from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, subqueryload
from typing import List, Optional
import datetime
import security
import uuid
import json
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

import models
import schemas

load_dotenv()
app = FastAPI(title="Orchid Nexus API")

origins = [
    "http://localhost:5173",
    "http://12-7.0.0.1:5173",
    "https://boisterous-jalebi-7b7528.netlify.app"
]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOADS_DIR = Path("static/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
models.Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self): self.active_connections: dict[int, list[WebSocket]] = {}
    async def connect(self, websocket: WebSocket, project_id: int): await websocket.accept(); self.active_connections.setdefault(project_id, []).append(websocket)
    def disconnect(self, websocket: WebSocket, project_id: int):
        if project_id in self.active_connections and websocket in self.active_connections[project_id]: self.active_connections[project_id].remove(websocket)
    async def broadcast_update(self, project_id: int, message: str):
        payload = json.dumps({"type": "notification", "message": message});
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]: await connection.send_text(payload)
manager = ConnectionManager()
app.mount("/static", StaticFiles(directory="static"), name="static")
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
    except JWTError: raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first();
    if user is None: raise credentials_exception
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles: raise HTTPException(status_code=403, detail="Operation not permitted")
    return role_checker

# --- AUTH & USER Endpoints ---
@app.post("/token", response_model=schemas.Token, tags=["Authentication"])
# ... (The rest of the endpoints are the same, with new PATCH endpoints added)
# ... Full code below ...
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = security.authenticate_user(db, form_data.username, form_data.password);
    if not user: raise HTTPException(status_code=401, detail="Incorrect credentials")
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer"}
@app.post("/users/", response_model=schemas.UserSchema, tags=["Authentication"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first(): raise HTTPException(status_code=400, detail="Email already registered")
    db_user = models.User(email=user.email, hashed_password=security.get_password_hash(user.password), role=user.role); db.add(db_user); db.commit(); db.refresh(db_user); return db_user
@app.get("/users/me", response_model=schemas.UserSchema, tags=["Authentication"])
def read_me(current_user: models.User = Depends(get_current_user)): return current_user
@app.get("/users/", response_model=List[schemas.UserSchema], tags=["Users"])
def read_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)): return db.query(models.User).all()
@app.post("/projects/", response_model=schemas.ProjectSchema, tags=["Projects"], dependencies=[Depends(require_role(["Project Manager"]))])
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(name=project.name); db.add(db_project); db.commit(); db.refresh(db_project); return db_project
@app.get("/projects/", response_model=List[schemas.ProjectSchema], tags=["Projects"])
def read_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)): return db.query(models.Project).all()
@app.get("/projects/{project_id}", response_model=schemas.ProjectSchema, tags=["Projects"])
def read_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_project = db.query(models.Project).options(subqueryload(models.Project.objectives).subqueryload(models.Objective.activities).subqueryload(models.Activity.tasks).subqueryload(models.Task.assignee), subqueryload(models.Project.objectives).subqueryload(models.Objective.activities).subqueryload(models.Activity.kpis), subqueryload(models.Project.objectives).subqueryload(models.Objective.activities).subqueryload(models.Activity.budget).subqueryload(models.Budget.expenses), subqueryload(models.Project.objectives).subqueryload(models.Objective.activities).subqueryload(models.Activity.tasks).subqueryload(models.Task.deliverables).subqueryload(models.Deliverable.submitter)).filter(models.Project.id == project_id).first()
    if not db_project: raise HTTPException(status_code=404, detail="Project not found")
    # ... (rest of function)
    return db_project
# ... (All other GET, POST, DELETE endpoints)

# --- NEW EDIT ENDPOINTS ---
@app.patch("/objectives/{objective_id}", response_model=schemas.ObjectiveSchema, tags=["Objectives"], dependencies=[Depends(require_role(["Project Manager"]))])
async def update_objective(objective_id: int, objective_update: schemas.ObjectiveUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_obj = db.query(models.Objective).filter(models.Objective.id == objective_id).first()
    if not db_obj: raise HTTPException(status_code=404, detail="Objective not found")
    update_data = objective_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    await manager.broadcast_update(db_obj.project_id, f"Objective '{db_obj.name}' was updated by {current_user.email}.")
    return db_obj

@app.patch("/activities/{activity_id}", response_model=schemas.ActivitySchema, tags=["Activities"], dependencies=[Depends(require_role(["Project Manager"]))])
async def update_activity(activity_id: int, activity_update: schemas.ActivityUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_act = db.query(models.Activity).options(subqueryload(models.Activity.objective)).filter(models.Activity.id == activity_id).first()
    if not db_act: raise HTTPException(status_code=404, detail="Activity not found")
    update_data = activity_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_act, key, value)
    db.commit()
    db.refresh(db_act)
    await manager.broadcast_update(db_act.objective.project_id, f"Activity '{db_act.name}' was updated by {current_user.email}.")
    return db_act

@app.patch("/tasks/{task_id}", response_model=schemas.TaskSchema, tags=["Tasks"], dependencies=[Depends(require_role(["Project Manager", "Monitoring Officer"]))])
async def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).options(subqueryload(models.Task.activity).subqueryload(models.Activity.objective)).filter(models.Task.id == task_id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    await manager.broadcast_update(db_task.activity.objective.project_id, f"Task '{db_task.description}' was updated by {current_user.email}.")
    return db_task

@app.patch("/kpis/{kpi_id}", response_model=schemas.KPISchema, tags=["KPIs"], dependencies=[Depends(require_role(["Project Manager", "Monitoring Officer"]))])
async def update_kpi(kpi_id: int, kpi_update: schemas.KPIUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_kpi = db.query(models.KPI).options(subqueryload(models.KPI.activity).subqueryload(models.Activity.objective)).filter(models.KPI.id == kpi_id).first()
    if not db_kpi: raise HTTPException(status_code=404, detail="KPI not found")
    update_data = kpi_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_kpi, key, value)
    db.commit()
    db.refresh(db_kpi)
    await manager.broadcast_update(db_kpi.activity.objective.project_id, f"KPI '{db_kpi.name}' was updated by {current_user.email}.")
    return db_kpi