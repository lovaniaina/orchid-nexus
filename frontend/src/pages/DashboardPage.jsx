// /frontend/src/pages/DashboardPage.jsx - FINAL CORRECTED VERSION

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ObjectivePanel from '../components/dashboard/ObjectivePanel';
import FieldDataForm from '../components/dashboard/FieldDataForm';
import AddObjectiveForm from '../components/dashboard/AddObjectiveForm';

function DashboardPage() {
  // State for the project data and loading status
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs once to fetch the initial data from the backend
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/projects/1');
        setProjectData(response.data);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectData();
  }, []);

  // This is the function that handles the form submission
  const handleDataSubmit = async (submission) => {
    // This is the "Checkpoint" log you asked for.
    console.log("Step 1: handleDataSubmit was called with:", submission);

    try {
      // This 'await' works because the function is now correctly marked as 'async'
      const response = await axios.post('http://127.0.0.1:8000/data-entry', submission);
      
      console.log("Step 2: Data received from backend:", response.data);
      
      // Update the frontend state with the fresh data from the backend
      setProjectData(response.data);

    } catch (error) {
      console.error("Step 3: Failed to submit data:", error);
      alert("There was an error submitting your data. Please try again.");
    }
  };

  // Add this inside the DashboardPage component
// In /frontend/src/pages/DashboardPage.jsx, replace the old handleCreateObjective

const handleCreateObjective = async (objectiveName) => {
  // We assume we are always working with project_id: 1 for now.
  const projectId = projectData.id; 

  try {
    // This is the new API call to our backend endpoint.
    // We send the new objective's name in the request body.
    const response = await axios.post(
      `http://127.0.0.1:8000/projects/${projectId}/objectives`, 
      { name: objectiveName }
    );

    // The backend responds with the newly created objective object.
    const newObjective = response.data;

    // --- Update the Frontend State ---
    // It's a best practice to never modify state directly.
    // We create a deep copy of the current project data.
    const newProjectData = JSON.parse(JSON.stringify(projectData));

    // Add the new objective to our copied data.
    // We need to ensure the new objective has an empty 'activities' array
    // so the frontend can render it correctly.
    newProjectData.objectives.push({ ...newObjective, activities: [] });

    // Update the state with the new project data, triggering a re-render.
    setProjectData(newProjectData);

  } catch (error) {
    console.error("Failed to create objective:", error);
    alert("There was an error creating the objective. Please try again.");
  }
};

// Add this new function inside the DashboardPage component

const handleDeleteObjective = async (objectiveId) => {
  // Ask the user for confirmation before deleting
  if (!window.confirm("Are you sure you want to delete this objective and all its contents?")) {
    return; // Stop if the user clicks "Cancel"
  }

  try {
    // Make the new API call to our DELETE endpoint
    await axios.delete(`http://127.0.0.1:8000/objectives/${objectiveId}`);

    // --- Update the Frontend State ---
    // Create a new projectData object with the deleted objective filtered out.
    const newProjectData = {
      ...projectData,
      objectives: projectData.objectives.filter(
        (objective) => objective.id !== objectiveId
      ),
    };

    // Update the state to trigger a re-render
    setProjectData(newProjectData);

  } catch (error) {
    console.error("Failed to delete objective:", error);
    alert("There was an error deleting the objective. Please try again.");
  }
};

// Add this new function inside the DashboardPage component

const handleUpdateObjective = async (objectiveId, newName) => {
  try {
    // Make the PUT request to our update endpoint
    await axios.put(`http://127.0.0.1:8000/objectives/${objectiveId}`, {
      name: newName,
    });

    // --- Update the Frontend State ---
    const newProjectData = JSON.parse(JSON.stringify(projectData));
    const objectiveToUpdate = newProjectData.objectives.find(
      (obj) => obj.id === objectiveId
    );
    if (objectiveToUpdate) {
      objectiveToUpdate.name = newName;
    }
    setProjectData(newProjectData);

  } catch (error) {
    console.error("Failed to update objective:", error);
    alert("There was an error updating the objective.");
  }
};

// Add this new function inside the DashboardPage component

const handleCreateActivity = async (objectiveId, activityName) => {
  try {
    const response = await axios.post(
      `http://127.0.0.1:8000/objectives/${objectiveId}/activities`,
      { name: activityName }
    );

    const newActivity = response.data;

    // --- Update Frontend State ---
    const newProjectData = JSON.parse(JSON.stringify(projectData));
    const targetObjective = newProjectData.objectives.find(
      (obj) => obj.id === objectiveId
    );

    if (targetObjective) {
      // Add the new activity to the correct objective, ensuring it has empty
      // arrays for its own children (kpis and tasks)
      targetObjective.activities.push({ ...newActivity, kpis: [], tasks: [] });
      setProjectData(newProjectData);
    }
  } catch (error) {
    console.error("Failed to create activity:", error);
    alert("There was an error creating the activity.");
  }
};

// Add these new functions inside the DashboardPage component

const handleDeleteActivity = async (activityId) => {
  if (!window.confirm("Are you sure you want to delete this activity?")) return;
  try {
    await axios.delete(`http://127.0.0.1:8000/activities/${activityId}`);
    // To update the state, we need to refresh the whole project
    // This is simpler for now than manually removing the nested activity
    const response = await axios.get(`http://127.0.0.1:8000/projects/${projectData.id}`);
    setProjectData(response.data);
  } catch (error) {
    console.error("Failed to delete activity:", error);
  }
};

const handleUpdateActivity = async (activityId, newName) => {
  try {
    await axios.put(`http://127.0.0.1:8000/activities/${activityId}`, { name: newName });
    const response = await axios.get(`http://127.0.0.1:8000/projects/${projectData.id}`);
    setProjectData(response.data);
  } catch (error) {
    console.error("Failed to update activity:", error);
  }
};

  // Handle the loading state
  if (isLoading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }

  // Handle the case where data failed to load
  if (!projectData) {
    return <div className="app-container"><h1>Error</h1><p>Could not load project data. Is the backend server running?</p></div>;
  }

  // We can only calculate allTasks after projectData has been loaded
  const allTasks = projectData.objectives.flatMap(obj => 
    obj.activities.flatMap(act => act.tasks)
  );

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <h1>{projectData.name}</h1>
      </header>
      <main className="dashboard-grid">
        <div className="dashboard-main-content">
          <h2>Project Objectives</h2>
          {projectData.objectives.map(objective => (
            <ObjectivePanel key={objective.id} objective={objective} onDelete={handleDeleteObjective} onUpdate={handleUpdateObjective} onCreateActivity={handleCreateActivity} onDeleteActivity={handleDeleteActivity} onUpdateActivity={handleUpdateActivity} />
          ))}
            <AddObjectiveForm onSubmit={handleCreateObjective} />
        </div>
        <aside className="dashboard-sidebar">
          <h2>Field Data Entry</h2>
          <FieldDataForm 
            tasks={allTasks} 
            onDataSubmit={handleDataSubmit} 
          />
        </aside>
      </main>
    </div>
  );
}

export default DashboardPage;