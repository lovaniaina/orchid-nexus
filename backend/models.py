# /backend/models.py - FINAL CORRECT VERSION

from pydantic import BaseModel
from typing import List, Optional

class KPI(BaseModel):
    id: int
    name: str
    current_value: int = 0
    target_value: int
    unit: str

class Task(BaseModel):
    id: int
    description: str
    kpi_id: int 

class Activity(BaseModel):
    id: int
    name: str
    kpis: List[KPI] = []
    tasks: List[Task] = []

class Objective(BaseModel):
    id: int
    name: str
    activities: List[Activity] = []

class Project(BaseModel):
    id: int
    name: str
    objectives: List[Objective] = []

class DataEntryPayload(BaseModel):
    taskId: int
    numericValue: int

class ObjectiveCreate(BaseModel):
    name: str

class ObjectiveUpdate(BaseModel):
    name: str

class ActivityCreate(BaseModel):
    name: str

class ActivityUpdate(BaseModel):
    name: str