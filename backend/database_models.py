# /backend/database_models.py

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship

# Import the 'Base' we created in database.py
from database import Base

# Each class here represents a table in our database.

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # This 'relationship' tells SQLAlchemy that it can find all the Objectives
    # related to a Project by looking at the 'project' attribute on the Objective model.
    objectives = relationship("Objective", back_populates="project")

class Objective(Base):
    __tablename__ = "objectives"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    # This 'ForeignKey' is the actual column in the database that links to the projects table.
    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project", back_populates="objectives")
    activities = relationship("Activity", back_populates="objective")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    objective_id = Column(Integer, ForeignKey("objectives.id"))

    objective = relationship("Objective", back_populates="activities")
    kpis = relationship("KPI", back_populates="activity")
    tasks = relationship("Task", back_populates="activity")

class KPI(Base):
    __tablename__ = "kpis"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    unit = Column(String)
    current_value = Column(Float, default=0.0)
    target_value = Column(Float, default=100.0)
    activity_id = Column(Integer, ForeignKey("activities.id"))

    activity = relationship("Activity", back_populates="kpis")
    tasks = relationship("Task", back_populates="kpi")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    kpi_id = Column(Integer, ForeignKey("kpis.id"))

    activity = relationship("Activity", back_populates="tasks")
    kpi = relationship("KPI", back_populates="tasks")