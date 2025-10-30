# /backend/seed.py

from database import SessionLocal, engine
from database_models import Project, Objective, Activity, KPI, Task, Base

# This line ensures that if we run this script, it will create the tables if they don't exist
Base.metadata.create_all(bind=engine)

# Get a new database session
db = SessionLocal()

print("Seeding database...")

# --- Clean up existing data ---
# To make this script runnable multiple times, we'll delete existing data first.
db.query(Task).delete()
db.query(KPI).delete()
db.query(Activity).delete()
db.query(Objective).delete()
db.query(Project).delete()
db.commit()
print("Cleared existing data.")

# --- Create Project ---
project1 = Project(name="Water Access Initiative")
db.add(project1)
db.commit()
db.refresh(project1) # refresh() updates the object with the ID from the database

print(f"Created Project: {project1.name}")

# --- Create Objectives ---
obj1 = Objective(name="Improve Access to Clean Water", project_id=project1.id)
obj2 = Objective(name="Enhance Agricultural Knowledge", project_id=project1.id)
db.add_all([obj1, obj2])
db.commit()
db.refresh(obj1)
db.refresh(obj2)

print(f"  - Created Objective: {obj1.name}")
print(f"  - Created Objective: {obj2.name}")

# --- Create Activities ---
act1 = Activity(name="Drill New Wells", objective_id=obj1.id)
act2 = Activity(name="Install Water Pumps", objective_id=obj1.id)
act3 = Activity(name="Conduct Farmer Training", objective_id=obj2.id)
db.add_all([act1, act2, act3])
db.commit()
db.refresh(act1)
db.refresh(act2)
db.refresh(act3)

print(f"    - Created Activity: {act1.name}")
# ... and so on for other activities

# --- Create KPIs ---
kpi1 = KPI(name="Wells Drilled", unit="wells", current_value=7, target_value=15, activity_id=act1.id)
kpi2 = KPI(name="Pumps Installed", unit="pumps", current_value=5, target_value=15, activity_id=act2.id)
kpi3 = KPI(name="Farmers Trained", unit="farmers", current_value=25, target_value=100, activity_id=act3.id)
db.add_all([kpi1, kpi2, kpi3])
db.commit()
db.refresh(kpi1)
db.refresh(kpi2)
db.refresh(kpi3)

print(f"      - Created KPI: {kpi1.name}")
# ... and so on for other KPIs

# --- Create Tasks ---
task1 = Task(description="Drill Well #7", activity_id=act1.id, kpi_id=kpi1.id)
task2 = Task(description="Install pump on Well #5", activity_id=act2.id, kpi_id=kpi2.id)
task3 = Task(description="Run training session in Village A", activity_id=act3.id, kpi_id=kpi3.id)
db.add_all([task1, task2, task3])
db.commit()

print(f"        - Created Task: {task1.description}")
# ... and so on for other tasks

print("Database seeding complete!")

# Close the session
db.close()