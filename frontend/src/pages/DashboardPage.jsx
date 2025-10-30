// /frontend/src/pages/DashboardPage.jsx - FINAL CORRECTED VERSION

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ObjectivePanel from '../components/dashboard/ObjectivePanel';
import FieldDataForm from '../components/dashboard/FieldDataForm';

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
            <ObjectivePanel key={objective.id} objective={objective} />
          ))}
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