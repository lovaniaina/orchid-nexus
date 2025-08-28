# /backend/schemas.py - COMPLETE FILE

from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

# --- User & Auth Schemas ---
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

# --- Project Hierarchy Schemas ---
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
    assignee_id: Optional[int] = None
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
class KPIUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    target_value: Optional[int] = None
class KPISchema(KPICreate):
    id: int
    current_value: int
    class Config:
        from_attributes = True
        
class ExpenseBase(BaseModel):
    amount: float
    description: str
class ExpenseCreate(ExpenseBase):
    budget_id: int
class ExpenseSchema(ExpenseBase):
    id: int
    timestamp: datetime.datetime
    class Config:
        from_attributes = True
        
class BudgetBase(BaseModel):
    total_amount: float
class BudgetCreate(BudgetBase):
    activity_id: int
class BudgetSchema(BudgetBase):
    id: int
    activity_id: int
    expenses: List[ExpenseSchema] = []
    class Config:
        from_attributes = True
        
class ActivityBase(BaseModel):
    name: str
class ActivityCreate(ActivityBase):
    objective_id: int
class ActivityUpdate(BaseModel):
    name: Optional[str] = None
class ActivitySchema(BaseModel):
    id: int
    name: str
    tasks: List[TaskSchema] = []
    kpis: List[KPISchema] = []
    budget: Optional[BudgetSchema] = None
    class Config:
        from_attributes = True
        
class ObjectiveBase(BaseModel):
    name: str
class ObjectiveCreate(ObjectiveBase):
    project_id: int
class ObjectiveUpdate(BaseModel):
    name: Optional[str] = None
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
    
# --- Logistics Schemas ---
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
class ItemCreate(ItemBase): pass
class ItemSchema(ItemBase):
    id: int
    class Config: from_attributes = True
class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
class LocationCreate(LocationBase): pass
class LocationSchema(LocationBase):
    id: int
    class Config: from_attributes = True
class InventoryBase(BaseModel):
    quantity: int
    item_id: int
    location_id: int
    low_stock_threshold: Optional[int] = None
class InventorySchema(BaseModel):
    id: int
    quantity: int
    low_stock_threshold: int
    item_id: int
    location_id: int
    item: ItemSchema
    location: LocationSchema
    class Config: from_attributes = True
class DistributionRequest(BaseModel):
    item_id: int
    location_id: int
    quantity: int