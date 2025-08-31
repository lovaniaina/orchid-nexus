# /backend/models.py - THE MISSING FILE

from sqlalchemy import Column, Integer, String, ForeignKey, Date, Text, DateTime, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

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
    budget = relationship("Budget", back_populates="activity", uselist=False, cascade="all, delete-orphan")

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

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    inventories = relationship("Inventory", back_populates="item", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    inventories = relationship("Inventory", back_populates="location", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = 'inventory'
    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, nullable=False, default=0)
    item_id = Column(Integer, ForeignKey('items.id'))
    location_id = Column(Integer, ForeignKey('locations.id'))
    item = relationship("Item", back_populates="inventories")
    location = relationship("Location", back_populates="inventories")
    __table_args__ = (UniqueConstraint('item_id', 'location_id', name='_item_location_uc'),)

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    activity_id = Column(Integer, ForeignKey("activities.id"), unique=True, nullable=False)
    activity = relationship("Activity", back_populates="budget")
    expenses = relationship("Expense", back_populates="budget", cascade="all, delete-orphan")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    budget = relationship("Budget", back_populates="expenses")