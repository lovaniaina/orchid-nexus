# /backend/main.py - FINAL, VERIFIED-SYNTAX VERSION WITH ALL FEATURES

from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Date, Text, DateTime
from sqlalchemy.orm import sessionmaker, Session, relationship, subqueryload
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, EmailStr
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

# --- Setup ---
UPLOADS_DIR = Path("static/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SQLALCHEMY_DATABASE_URL = "sqlite:///./orchid_nexus.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, nullable=False)
    tasks = relationship("Task", back_populates="assignee")
    deliverables = relationship("Deliverable", back_populates="submitter")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    objectives = relationship("Objective", back_populates="project", cascade="all, delete-orphan")

class Objective(Base):
    __tablename__ = "objectives"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="objectives")
    activities = relationship("Activity", back_populates="objective", cascade="all, delete-orphan")

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    objective_id = Column(Integer, ForeignKey("objectives.id"))
    objective = relationship("Objective", back_populates="activities")
    tasks = relationship("Task", back_populates="activity", cascade="all, delete-orphan")
    kpis = relationship("KPI", back_populates="activity", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    description = Column(String, index=True)
    status = Column(String, default="Pending")
    activity_id = Column(Integer, ForeignKey("activities.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    activity = relationship("Activity", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")
    deliverables = relationship("Deliverable", back_populates="task", cascade="all, delete-orphan")

class KPI(Base):
    __tablename__ = "kpis"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    unit = Column(String, nullable=True)
    current_value = Column(Integer, default=0)
    target_value = Column(Integer, default=100)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    activity = relationship("Activity", back_populates="kpis")
    history = relationship("KPIHistory", back_populates="kpi", cascade="all, delete-orphan")

class KPIHistory(Base):
    __tablename__ = "kpi_history"
    id = Column(Integer, primary_key=True)
    value = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    kpi_id = Column(Integer, ForeignKey("kpis.id"))
    kpi = relationship("KPI", back_populates="history")

class Deliverable(Base):
    __tablename__ = "deliverables"
    id = Column(Integer, primary_key=True)
    text_content = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    submitter_id = Column(Integer, ForeignKey("users.id"))
    task = relationship("Task", back_populates="deliverables")
    submitter = relationship("User", back_populates="deliverables")

# --- Pydantic Schemas (VERIFIED MULTI-LINE FORMAT) ---
class UserBase(BaseModel):
    email: EmailStr
class UserCreate(UserBase):
    password: str
    role: str
class UserSchema(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True
class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    email: Optional[str] = None
class DeliverableSchema(BaseModel):
    id: int
    text_content: Optional[str] = None
    file_path: Optional[str] = None
    timestamp: datetime.datetime
    submitter: UserSchema
    class Config:
        from_attributes = True
class TaskBase(BaseModel):
    description: str
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
class TaskCreate(TaskBase):
    activity_id: int
    assignee_id: Optional[int] = None
class TaskUpdate(BaseModel):
    description: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
class TaskSchema(TaskBase):
    id: int
    status: str
    assignee: Optional[UserSchema] = None
    deliverables: List[DeliverableSchema] = []
    class Config:
        from_attributes = True
class KPICreate(BaseModel):
    name: str
    unit: Optional[str] = None
    target_value: int
    activity_id: int
class KPIEntryCreate(BaseModel):
    value: int
class KPISchema(KPICreate):
    id: int
    current_value: int
    class Config:
        from_attributes = True
class KPIHistorySchema(BaseModel):
    value: int
    timestamp: datetime.datetime
    class Config:
        from_attributes = True
class ActivityBase(BaseModel):
    name: str
class ActivityCreate(ActivityBase):
    objective_id: int
class ActivitySchema(ActivityBase):
    id: int
    tasks: List[TaskSchema] = []
    kpis: List[KPISchema] = []
    class Config:
        from_attributes = True
class ObjectiveBase(BaseModel):
    name: str
class ObjectiveCreate(ObjectiveBase):
    project_id: int
class ObjectiveSchema(ObjectiveBase):
    id: int
    name: str
    activities: List[ActivitySchema] = []
    class Config:
        from_attributes = True
class ProjectBase(BaseModel):
    name: str
class ProjectCreate(ProjectBase):
    pass
class ProjectSchema(ProjectBase):
    id: int
    name: str
    objectives: List[ObjectiveSchema] = []
    class Config:
        from_attributes = True
class ProjectSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int

# --- WebSocket Manager ---
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

# --- App setup and dependencies ---
app = FastAPI(title="Orchid Nexus API"); app.mount("/static", StaticFiles(directory="static"), name="static"); origins = ["http://localhost:5173", "http://127.0.0.1:5173"]; app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"]); Base.metadata.create_all(bind=engine)
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
    user = db.query(User).filter(User.email == email).first();
    if user is None: raise credentials_exception
    return user
def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles: raise HTTPException(status_code=403, detail="Operation not permitted")
    return role_checker

# --- AUTH & USER Endpoints ---
@app.post("/token", response_model=Token, tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = security.authenticate_user(db, form_data.username, form_data.password);
    if not user: raise HTTPException(status_code=401, detail="Incorrect credentials")
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer"}
@app.post("/users/", response_model=UserSchema, tags=["Authentication"])
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first(): raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(email=user.email, hashed_password=security.get_password_hash(user.password), role=user.role); db.add(db_user); db.commit(); db.refresh(db_user); return db_user
@app.get("/users/me", response_model=UserSchema, tags=["Authentication"])
def read_me(current_user: User = Depends(get_current_user)): return current_user
@app.get("/users/", response_model=List[UserSchema], tags=["Users"])
def read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)): return db.query(User).all()

# --- PROJECT Endpoints ---
@app.post("/projects/", response_model=ProjectSchema, tags=["Projects"], dependencies=[Depends(require_role(["Project Manager"]))])
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(name=project.name); db.add(db_project); db.commit(); db.refresh(db_project); return db_project
@app.get("/projects/", response_model=List[ProjectSchema], tags=["Projects"])
def read_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)): return db.query(Project).all()
@app.get("/projects/{project_id}", response_model=ProjectSchema, tags=["Projects"])
def read_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_project = db.query(Project).options(subqueryload(Project.objectives).subqueryload(Objective.activities).subqueryload(Activity.tasks).subqueryload(Task.assignee), subqueryload(Project.objectives).subqueryload(Objective.activities).subqueryload(Activity.kpis), subqueryload(Project.objectives).subqueryload(Objective.activities).subqueryload(Activity.tasks).subqueryload(Task.deliverables).subqueryload(Deliverable.submitter)).filter(Project.id == project_id).first()
    if not db_project: raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role == "Field Officer":
        for objective in db_project.objectives:
            for activity in objective.activities:
                activity.tasks = [task for task in activity.tasks if task.assignee_id == current_user.id]
            objective.activities = [act for act in objective.activities if act.tasks]
        db_project.objectives = [obj for obj in db_project.objectives if obj.activities]
    return db_project
@app.get("/projects/{project_id}/summary", response_model=ProjectSummary, tags=["Projects"])
def get_summary(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).options(subqueryload(Project.objectives).subqueryload(Objective.activities).subqueryload(Activity.tasks)).filter(Project.id == project_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    tasks = [task for obj in project.objectives for act in obj.activities for task in act.tasks]
    return ProjectSummary(total_tasks=len(tasks), completed_tasks=len([t for t in tasks if t.status=="Complete"]), overdue_tasks=len([t for t in tasks if t.end_date and t.end_date < datetime.date.today() and t.status!="Complete"]))

# --- HIERARCHY Endpoints ---
@app.post("/objectives/", response_model=ObjectiveSchema, tags=["Objectives"], dependencies=[Depends(require_role(["Project Manager"]))])
async def create_objective(objective: ObjectiveCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = Objective(name=objective.name, project_id=objective.project_id); db.add(db_obj); db.commit(); db.refresh(db_obj); await manager.broadcast_update(objective.project_id, f"{current_user.email} created objective: {objective.name}"); return db_obj
@app.patch("/objectives/{objective_id}", response_model=ObjectiveSchema, tags=["Objectives"], dependencies=[Depends(require_role(["Project Manager"]))])
async def update_objective(objective_id: int, objective_update: ObjectiveBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Objective).filter(Objective.id == objective_id).first()
    if not db_obj: raise HTTPException(status_code=404, detail="Objective not found")
    db_obj.name = objective_update.name; db.commit(); db.refresh(db_obj); await manager.broadcast_update(db_obj.project_id, f"{current_user.email} updated objective: {db_obj.name}"); return db_obj
@app.delete("/objectives/{objective_id}", status_code=204, tags=["Objectives"], dependencies=[Depends(require_role(["Project Manager"]))])
async def delete_objective(objective_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Objective).filter(Objective.id == objective_id).first()
    if not db_obj: raise HTTPException(status_code=404, detail="Objective not found")
    project_id = db_obj.project_id; await manager.broadcast_update(project_id, f"{current_user.email} deleted objective: {db_obj.name}"); db.delete(db_obj); db.commit(); return
@app.post("/activities/", response_model=ActivitySchema, tags=["Activities"], dependencies=[Depends(require_role(["Project Manager"]))])
async def create_activity(activity: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = db.query(Objective).filter(Objective.id == activity.objective_id).first()
    if not obj: raise HTTPException(status_code=404, detail="Objective not found")
    db_act = Activity(name=activity.name, objective_id=activity.objective_id); db.add(db_act); db.commit(); db.refresh(db_act); await manager.broadcast_update(obj.project_id, f"{current_user.email} created activity: {activity.name}"); return db_act
@app.patch("/activities/{activity_id}", response_model=ActivitySchema, tags=["Activities"], dependencies=[Depends(require_role(["Project Manager"]))])
async def update_activity(activity_id: int, activity_update: ActivityBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_act = db.query(Activity).options(subqueryload(Activity.objective)).filter(Activity.id == activity_id).first()
    if not db_act: raise HTTPException(status_code=404, detail="Activity not found")
    db_act.name = activity_update.name; db.commit(); db.refresh(db_act); await manager.broadcast_update(db_act.objective.project_id, f"{current_user.email} updated activity: {db_act.name}"); return db_act
@app.delete("/activities/{activity_id}", status_code=204, tags=["Activities"], dependencies=[Depends(require_role(["Project Manager"]))])
async def delete_activity(activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_act = db.query(Activity).options(subqueryload(Activity.objective)).filter(Activity.id == activity_id).first()
    if not db_act: raise HTTPException(status_code=404, detail="Activity not found")
    project_id = db_act.objective.project_id; await manager.broadcast_update(project_id, f"{current_user.email} deleted activity: {db_act.name}"); db.delete(db_act); db.commit(); return
@app.post("/tasks/", response_model=TaskSchema, tags=["Tasks"], dependencies=[Depends(require_role(["Project Manager", "Monitoring Officer"]))])
async def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = Task(**task.dict()); db.add(db_task); db.commit(); db.refresh(db_task); act = db.query(Activity).options(subqueryload(Activity.objective)).filter(Activity.id == task.activity_id).first()
    if act and act.objective: await manager.broadcast_update(act.objective.project_id, f"{current_user.email} created task: {task.description}")
    return db_task
@app.patch("/tasks/{task_id}", response_model=TaskSchema, tags=["Tasks"], dependencies=[Depends(require_role(["Project Manager", "Monitoring Officer"]))])
async def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = db.query(Task).options(subqueryload(Task.activity).subqueryload(Activity.objective)).filter(Task.id == task_id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    update_data = task_update.dict(exclude_unset=True);
    for key, value in update_data.items(): setattr(db_task, key, value)
    db.commit(); db.refresh(db_task);
    if db_task.activity and db_task.activity.objective: await manager.broadcast_update(db_task.activity.objective.project_id, f"{current_user.email} updated task: {db_task.description}")
    return db_task
@app.delete("/tasks/{task_id}", status_code=204, tags=["Tasks"], dependencies=[Depends(require_role(["Project Manager"]))])
async def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = db.query(Task).options(subqueryload(Task.activity).subqueryload(Activity.objective)).filter(Task.id == task_id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    project_id = db_task.activity.objective.project_id; await manager.broadcast_update(project_id, f"{current_user.email} deleted task: {db_task.description}"); db.delete(db_task); db.commit(); return
@app.patch("/tasks/{task_id}/status", response_model=TaskSchema, tags=["Tasks"])
async def update_task_status(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = db.query(Task).options(subqueryload(Task.activity).subqueryload(Activity.objective)).filter(Task.id == task_id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    db_task.status = "Complete" if db_task.status == "Pending" else "Pending"; db.commit(); db.refresh(db_task)
    if db_task.activity and db_task.activity.objective: await manager.broadcast_update(db_task.activity.objective.project_id, f"Task status updated for: {db_task.description}")
    return db_task
@app.post("/kpis/", response_model=KPISchema, tags=["KPIs"], dependencies=[Depends(require_role(["Project Manager", "Monitoring Officer"]))])
async def create_kpi(kpi: KPICreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_kpi = KPI(**kpi.dict()); db.add(db_kpi); db.commit(); db.refresh(db_kpi); act = db.query(Activity).options(subqueryload(Activity.objective)).filter(Activity.id == kpi.activity_id).first()
    if act and act.objective: await manager.broadcast_update(act.objective.project_id, f"{current_user.email} created KPI: {kpi.name}")
    return db_kpi
@app.post("/kpis/{kpi_id}/entries", response_model=KPISchema, tags=["KPIs"])
async def create_kpi_entry(kpi_id: int, entry: KPIEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_kpi = db.query(KPI).options(subqueryload(KPI.activity).subqueryload(Activity.objective)).filter(KPI.id == kpi_id).first()
    if not db_kpi: raise HTTPException(status_code=404, detail="KPI not found")
    db_kpi.current_value += entry.value
    history_entry = KPIHistory(kpi_id=kpi_id, value=db_kpi.current_value); db.add(history_entry); db.commit(); db.refresh(db_kpi)
    if db_kpi.activity and db_kpi.activity.objective: await manager.broadcast_update(db_kpi.activity.objective.project_id, f"{current_user.email} updated KPI: {db_kpi.name}")
    return db_kpi
@app.get("/kpis/{kpi_id}/history", response_model=List[KPIHistorySchema], tags=["KPIs"])
def get_kpi_history(kpi_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(KPIHistory).filter(KPIHistory.kpi_id == kpi_id).order_by(KPIHistory.timestamp.asc()).all()
@app.delete("/kpis/{kpi_id}", status_code=204, tags=["KPIs"], dependencies=[Depends(require_role(["Project Manager", "Monitoring Officer"]))])
async def delete_kpi(kpi_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_kpi = db.query(KPI).options(subqueryload(KPI.activity).subqueryload(Activity.objective)).filter(KPI.id == kpi_id).first()
    if not db_kpi: raise HTTPException(status_code=404, detail="KPI not found")
    project_id = db_kpi.activity.objective.project_id; await manager.broadcast_update(project_id, f"{current_user.email} deleted KPI: {db_kpi.name}"); db.delete(db_kpi); db.commit(); return
@app.post("/deliverables/", response_model=DeliverableSchema, tags=["Deliverables"])
async def create_deliverable(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), task_id: int = Form(...), text_content: Optional[str] = Form(None), proof_file: Optional[UploadFile] = File(None)):
    db_task = db.query(Task).options(subqueryload(Task.activity).subqueryload(Activity.objective)).filter(Task.id == task_id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    file_path = None
    if proof_file:
        file_path_obj = UPLOADS_DIR / f"{uuid.uuid4()}_{proof_file.filename}"
        file_path_obj.write_bytes(await proof_file.read())
        file_path = str(file_path_obj.name)
    db_deliv = Deliverable(task_id=task_id, submitter_id=current_user.id, text_content=text_content, file_path=file_path); db.add(db_deliv); db.commit(); db.refresh(db_deliv)
    if db_task.activity and db_task.activity.objective: await manager.broadcast_update(db_task.activity.objective.project_id, f"{current_user.email} submitted a deliverable for task: {db_task.description}")
    return db_deliv

# --- WebSocket Endpoint ---
@app.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    await manager.connect(websocket, project_id)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: pass
    finally: manager.disconnect(websocket, project_id)