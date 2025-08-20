// /frontend/src/App.jsx - FINAL, VERIFIED, COMPLETE VERSION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// --- Axios & Helper Components ---
axios.interceptors.request.use(config => { const token = localStorage.getItem('orchid_nexus_token'); if (token) { config.headers.Authorization = `Bearer ${token}`; } return config; });
function Notification({ message, onDismiss }) { useEffect(() => { const timer = setTimeout(() => { onDismiss(); }, 5000); return () => clearTimeout(timer); }, [onDismiss]); return ( <div className="notification-toast"><p>{message}</p><button onClick={onDismiss} className="notification-dismiss">×</button></div> ); }
function SimpleAddForm({ placeholder, onSubmit, cta }) { const [name, setName] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); if (!name.trim()) return; await onSubmit(name); setName(''); }; return ( <form onSubmit={handleSubmit} className="simple-add-form"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} required/><button type="submit">{cta}</button></form> ); }

// --- AUTHENTICATION & PROJECT SELECTION ---
function LoginPage({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [role, setRole] = useState('Field Officer'); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);
  const handleAuth = async (event) => {
    event.preventDefault(); setIsLoading(true); setError('');
    if (isLoginView) {
      const formData = new URLSearchParams(); formData.append('username', email); formData.append('password', password);
      try { const response = await axios.post('https://orchid-nexus-backend.onrender.com/token', formData); onLoginSuccess(response.data.access_token); }
      catch (err) { setError('Login failed. Please check credentials.'); } finally { setIsLoading(false); }
    } else {
      try { await axios.post('https://orchid-nexus-backend.onrender.com/users/', { email, password, role }); setError('Account created! Please log in.'); setIsLoginView(true); }
      catch (err) { setError(err.response?.data?.detail || 'Signup failed.'); } finally { setIsLoading(false); }
    }
  };
  return ( <div className="login-container"><div className="login-box"><h2>{isLoginView ? 'Orchid Nexus' : 'Create Account'}</h2><form onSubmit={handleAuth}>{error && <p className={error.includes('created!') ? 'success-message' : 'error-message'}>{error}</p>}<div className="input-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="input-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>{!isLoginView && ( <div className="input-group"><label>Role</label><select value={role} onChange={(e) => setRole(e.target.value)}><option>Field Officer</option><option>Monitoring Officer</option><option>Project Manager</option></select></div> )}<button type="submit" disabled={isLoading}>{isLoading ? '...' : (isLoginView ? 'Log In' : 'Sign Up')}</button></form><button className="toggle-auth" onClick={() => { setIsLoginView(!isLoginView); setError(''); }}>{isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Log In'}</button></div></div> );
}
function ProjectSelectionPage({ onSelectProject, onLogout, currentUser }) {
  const [projects, setProjects] = useState([]);
  const fetchProjects = useCallback(async () => { try { const res = await axios.get('https://orchid-nexus-backend.onrender.com/projects/'); setProjects(res.data); } catch (err) { console.error(err); } }, []);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  const handleCreateProject = async (name) => { try { await axios.post('https://orchid-nexus-backend.onrender.com/projects/', { name }); fetchProjects(); } catch (err) { console.error('Failed to create project', err); } };
  return ( <div className="app-container"><header><h1>Select a Project</h1><button onClick={onLogout} className="logout-button">Log Out</button></header><main className="project-selection-main"><div className="project-list">{projects.map(p => ( <button key={p.id} onClick={() => onSelectProject(p.id)} className="project-card">{p.name}</button> ))}</div>{ (currentUser && currentUser.role === 'Project Manager') && <div className="project-add-form-container"><h3>Create New Project</h3><SimpleAddForm placeholder="Enter project name..." onSubmit={handleCreateProject} cta="+ Create"/></div>} </main></div> );
}

// --- DASHBOARD COMPONENTS ---
function KpiHistoryModal({ kpi, onClose }) {
    const [history, setHistory] = useState([]);
    useEffect(() => { axios.get(`https://orchid-nexus-backend.onrender.com/kpis/${kpi.id}/history`).then(res => setHistory(res.data)); }, [kpi.id]);
    const chartData = { labels: history.map(h => new Date(h.timestamp).toLocaleDateString()), datasets: [{ label: kpi.name, data: history.map(h => h.value), fill: false, borderColor: '#3b82f6' }] };
    return ( <div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>History for {kpi.name}</h3><button onClick={onClose} className="modal-close-button">&times;</button></div><Line data={chartData} /></div></div> );
}
function KpiIndicator({ kpi, currentUser }) {
    const [showHistory, setShowHistory] = useState(false);
    const progress = kpi.target_value > 0 ? ((kpi.current_value || 0) / kpi.target_value) * 100 : 0;
    const handleDelete = async () => { if (window.confirm(`Delete KPI: "${kpi.name}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/kpis/${kpi.id}`); } catch (err) { console.error(err); } } };
    const isPrivileged = currentUser.role === 'Project Manager' || currentUser.role === 'Monitoring Officer';
    return (
        <div className="kpi-indicator">
            {showHistory && <KpiHistoryModal kpi={kpi} onClose={() => setShowHistory(false)} />}
            <div className="kpi-info"><span>{kpi.name} {kpi.unit && `(${kpi.unit})`}</span><span>{kpi.current_value || 0} / {kpi.target_value}</span></div>
            <div className="progress-bar-background"><div className="progress-bar-foreground" style={{ width: `${Math.min(progress, 100)}%` }}></div></div>
            <div className="kpi-actions"><button onClick={() => setShowHistory(true)}>📈</button>{isPrivileged && <button onClick={handleDelete} className="delete-button-kpi">🗑️</button>}</div>
        </div>
    );
}
function KpiEntryForm({ kpi }) {
    const [value, setValue] = useState('');
    const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post(`https://orchid-nexus-backend.onrender.com/kpis/${kpi.id}/entries`, { value: parseInt(value, 10) }); setValue(''); } catch (err) { console.error(err); } };
    return (<form onSubmit={handleSubmit} className="kpi-entry-form"><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Add value..." required/><button type="submit">+</button></form>);
}
function AddKpiForm({ activityId }) {
    const [name, setName] = useState(''); const [unit, setUnit] = useState(''); const [target, setTarget] = useState(100);
    const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post('https://orchid-nexus-backend.onrender.com/kpis/', { name, unit, target_value: parseInt(target, 10) || 0, activity_id: activityId }); setName(''); setUnit(''); setTarget(100); } catch (err) { console.error(err); } };
    return ( <form onSubmit={handleSubmit} className="kpi-add-form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Indicator Name" required/><input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="Unit"/><input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target" required/><button type="submit">+</button></form> );
}
function DeliverableForm({ task }) {
    const [textContent, setTextContent] = useState(''); const [proofFile, setProofFile] = useState(null);
    const handleSubmit = async (e) => { e.preventDefault(); const formData = new FormData(); formData.append('task_id', task.id); if (textContent) formData.append('text_content', textContent); if (proofFile) formData.append('proof_file', proofFile); try { await axios.post('https://orchid-nexus-backend.onrender.com/deliverables/', formData); setTextContent(''); setProofFile(null); e.target.reset(); } catch (err) { console.error(err); } };
    return ( <div className="deliverable-section"><h5>Deliverables for "{task.description}"</h5><ul className="deliverable-list">{task.deliverables.map(d => <li key={d.id}>{d.text_content || 'File submitted'} by {d.submitter.email}</li>)}</ul><form onSubmit={handleSubmit} className="deliverable-form"><textarea value={textContent} onChange={e=>setTextContent(e.target.value)} placeholder="Add a report or notes..."></textarea><input type="file" onChange={e=>setProofFile(e.target.files[0])} /><button type="submit">Submit</button></form></div>);
}
function TaskItem({ task, currentUser }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const today = new Date(); today.setHours(0,0,0,0); const endDate = task.end_date ? new Date(task.end_date) : null;
    const isOverdue = endDate && endDate < today && task.status !== 'Complete';
    const isDueSoon = endDate && !isOverdue && (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 3 && task.status !== 'Complete';
    let dateClass = '';
    if (task.status === 'Complete') dateClass = 'complete'; else if (isOverdue) dateClass = 'overdue'; else if (isDueSoon) dateClass = 'due-soon';
    const handleToggleStatus = async () => { try { await axios.patch(`https://orchid-nexus-backend.onrender.com/tasks/${task.id}/status`); } catch (err) { console.error(err); } };
    const handleDelete = async () => { if (window.confirm(`Delete task: "${task.description}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/tasks/${task.id}`); } catch (err) { console.error(err); } } };
    const isManager = currentUser.role === 'Project Manager';
    return (
        <div className="task-item">
            <div className="task-main-row" onClick={() => setIsExpanded(!isExpanded)}>
                <div className={`status-ring ${dateClass}`}></div><div className={`status-checkbox ${task.status.toLowerCase()}`} onClick={(e) => { e.stopPropagation(); handleToggleStatus(); }}></div>
                <div className="task-details"><p>{task.description}</p>{task.end_date && <span className={`task-date ${dateClass}`}>{new Date(task.end_date).toLocaleDateString()}</span>}</div>
                {task.assignee && <div className="task-assignee" title={task.assignee.email}>{task.assignee.email.charAt(0).toUpperCase()}</div>}
                {isManager && <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="delete-button">🗑️</button>}
                <span className={`chevron ${isExpanded ? 'open' : ''}`}>▼</span>
            </div>
            {isExpanded && <div className="task-expanded-content"><DeliverableForm task={task} /></div>}
        </div>
    );
}
function AddTaskForm({ activityId, users }) {
    const [description, setDescription] = useState(''); const [assigneeId, setAssigneeId] = useState(''); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');
    const handleSubmit = async (e) => { e.preventDefault(); const taskData = { description, activity_id: activityId, assignee_id: assigneeId ? parseInt(assigneeId, 10) : null, start_date: startDate || null, end_date: endDate || null }; try { await axios.post('https://orchid-nexus-backend.onrender.com/tasks/', taskData); setDescription(''); setAssigneeId(''); setStartDate(''); setEndDate(''); } catch (err) { console.error(err); } };
    return ( <form onSubmit={handleSubmit} className="add-task-form"><input value={description} onChange={e => setDescription(e.target.value)} placeholder="New task..." required /><select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}</select><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="Start Date"/><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="End Date"/><button type="submit">+</button></form> );
}
function ActivityPanel({ activity, users, currentUser, filter }) {
    const [isOpen, setIsOpen] = useState(false);
    const isManager = currentUser.role === 'Project Manager';
    const isPrivileged = isManager || currentUser.role === 'Monitoring Officer';
    const filteredTasks = activity.tasks.filter(task => filter.type === 'all' || (task.assignee && task.assignee.id === filter.id));
    const handleDelete = async (e) => { e.stopPropagation(); if (window.confirm(`Delete Activity: "${activity.name}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/activities/${activity.id}`); } catch (err) { console.error(err); } } };
    return (
        <div className="activity-panel">
            <div className="panel-header" onClick={() => setIsOpen(!isOpen)}><span>{activity.name}</span><div className="panel-actions">{isManager && <button onClick={handleDelete} className="delete-button-header mini">🗑️</button>}<span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span></div></div>
            {isOpen && <div className="activity-content">
                <div className="activity-grid">
                    <div><h4>Tasks</h4>{filteredTasks.map(task => <TaskItem key={task.id} task={task} currentUser={currentUser} />)}{isPrivileged && <AddTaskForm activityId={activity.id} users={users} />}</div>
                    <div><h4>Activity Indicators</h4>{activity.kpis.map(kpi => <div key={kpi.id}><KpiIndicator kpi={kpi} currentUser={currentUser} /><KpiEntryForm kpi={kpi}/></div>)}{isPrivileged && <AddKpiForm activityId={activity.id} />}</div>
                </div>
            </div>}
        </div>
    );
}
function ObjectivePanel({ objective, users, currentUser, filter }) {
    const [isOpen, setIsOpen] = useState(true);
    const isManager = currentUser.role === 'Project Manager';
    const handleActivitySubmit = async (name) => { try { await axios.post('https://orchid-nexus-backend.onrender.com/activities/', { name, objective_id: objective.id }); } catch(err) { console.error(err); } };
    const handleDelete = async (e) => { e.stopPropagation(); if(window.confirm(`Delete Objective: "${objective.name}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/objectives/${objective.id}`); } catch (err) { console.error(err); } } };
    return (
        <div className="objective-panel">
            <div className="panel-header-objective" onClick={() => setIsOpen(!isOpen)}><h3><span>{objective.name}</span></h3><div className="panel-actions">{isManager && <button onClick={handleDelete} className="delete-button-header">🗑️</button>}<span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span></div></div>
            {isOpen && <div className="objective-content">
                {objective.activities.map(activity => <ActivityPanel key={activity.id} activity={activity} users={users} currentUser={currentUser} filter={filter} />)}
                {isManager && <SimpleAddForm placeholder="New activity..." onSubmit={handleActivitySubmit} cta="+ Add Activity" />}
            </div>}
        </div>
    );
}
function DashboardPage({ project, onDataChange, onBack, onLogout, users, currentUser }) {
    const [notification, setNotification] = useState(null); const [summaryData, setSummaryData] = useState(null); const [filter, setFilter] = useState({ type: 'all' });
    const ws = useRef(null);
    const fetchSummaryData = useCallback(async () => { try { const res = await axios.get(`https://orchid-nexus-backend.onrender.com/projects/${project.id}/summary`); setSummaryData(res.data); } catch (error) { console.error(error); } }, [project.id]);
    useEffect(() => { fetchSummaryData(); ws.current = new WebSocket(`wss://orchid-nexus-backend.onrender.com/ws/${project.id}`); ws.current.onmessage = (event) => { const data = JSON.parse(event.data); if (data.type === 'notification') { setNotification(data.message); onDataChange(); }}; return () => { ws.current.close(); }; }, [project.id, onDataChange, fetchSummaryData]);
    const handleObjectiveSubmit = async (name) => { try { await axios.post('https://orchid-nexus-backend.onrender.com/objectives/', { name, project_id: project.id }); } catch (err) { console.error(err); } };
    const DashboardHud = ({ summary }) => ( <div className="hud-container"><div className="hud-card"><span className="hud-value">{summary ? `${summary.total_tasks - summary.completed_tasks}`:'-'}</span><span className="hud-label">Pending</span></div><div className="hud-card"><span className="hud-value overdue">{summary ? summary.overdue_tasks:'-'}</span><span className="hud-label">Overdue</span></div><div className="hud-card"><span className="hud-value">{summary ? `${summary.completed_tasks}/${summary.total_tasks}`:'-'}</span><span className="hud-label">Completed</span></div></div> );
    const TaskChart = ({ summary }) => { if (!summary || summary.total_tasks === 0) return <div className="chart-container"><h3>Task Status</h3><p>No task data.</p></div>; const data = { labels: ['Completed', 'Pending'], datasets: [{ data: [summary.completed_tasks, summary.total_tasks - summary.completed_tasks], backgroundColor: ['#3b82f6', '#e5e7eb']}]}; return <div className="chart-container"><h3>Task Status</h3><Pie data={data} /></div>; };
    const isManager = currentUser.role === 'Project Manager';
    return (
        <div className="app-container">
            {notification && <Notification message={notification} onDismiss={() => setNotification(null)} />}
            <header className="dashboard-header"><button onClick={onBack} className="back-button">← Projects</button><h1>{project.name}</h1><button onClick={onLogout} className="logout-button">Log Out</button></header>
            <div className="dashboard-grid">
                <div className="dashboard-main-content">
                    <DashboardHud summary={summaryData} />
                    <div className="filter-bar"><button onClick={() => setFilter({ type: 'all'})} className={filter.type === 'all' ? 'active' : ''}>All Tasks</button><button onClick={() => setFilter({ type: 'user', id: currentUser.id})} className={filter.type === 'user' ? 'active' : ''}>My Tasks</button></div>
                    {project.objectives.map(objective => <ObjectivePanel key={objective.id} objective={objective} users={users} currentUser={currentUser} filter={filter} />)}
                    {isManager && <div className="objective-add-form-container"><h3>Create New Objective</h3><SimpleAddForm placeholder="Enter objective name..." onSubmit={handleObjectiveSubmit} cta="+ Create" /></div>}
                </div>
                <aside className="dashboard-sidebar"><TaskChart summary={summaryData} /></aside>
            </div>
        </div>
    );
}
function App() {
  const [token, setToken] = useState(localStorage.getItem('orchid_nexus_token')); const [currentUser, setCurrentUser] = useState(null); const [allUsers, setAllUsers] = useState([]); const [selectedProjectId, setSelectedProjectId] = useState(null); const [projectData, setProjectData] = useState(null); const [isLoading, setIsLoading] = useState(false); const [error, setError] = useState('');
  const handleLogout = useCallback(() => { localStorage.removeItem('orchid_nexus_token'); setToken(null); setSelectedProjectId(null); setProjectData(null); setCurrentUser(null); setAllUsers([]); }, []);
  useEffect(() => { if (token && !currentUser) { setIsLoading(true); Promise.all([axios.get('https://orchid-nexus-backend.onrender.com/users/me'), axios.get('https://orchid-nexus-backend.onrender.com/users/')]).then(([meRes, usersRes]) => { setCurrentUser(meRes.data); setAllUsers(usersRes.data); }).catch(() => handleLogout()).finally(() => setIsLoading(false)); } }, [token, currentUser, handleLogout]);
  const fetchProjectData = useCallback(async () => { if (!selectedProjectId || !token) return; setIsLoading(true); try { const response = await axios.get(`https://orchid-nexus-backend.onrender.com/projects/${selectedProjectId}`); setProjectData(response.data); setError(''); } catch (err) { setError('Failed to load project data.'); if (err.response?.status === 401) handleLogout(); } finally { setIsLoading(false); } }, [selectedProjectId, token, handleLogout]);
  useEffect(() => { fetchProjectData(); }, [fetchProjectData]);
  const handleLoginSuccess = (newToken) => { localStorage.setItem('orchid_nexus_token', newToken); setToken(newToken); };
  const handleSelectProject = (projectId) => { setSelectedProjectId(projectId); };
  const handleBackToProjects = () => { setSelectedProjectId(null); setProjectData(null); };
  if (!token) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (isLoading || (token && !currentUser)) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="app-container"><h1>Error</h1><p>{error}</p><button onClick={handleBackToProjects}>Back to Projects</button></div>;
  if (projectData) return <DashboardPage project={projectData} onDataChange={fetchProjectData} onBack={handleBackToProjects} onLogout={handleLogout} users={allUsers} currentUser={currentUser} />;
  return <ProjectSelectionPage onSelectProject={handleSelectProject} onLogout={handleLogout} currentUser={currentUser} />;
}

export default App;