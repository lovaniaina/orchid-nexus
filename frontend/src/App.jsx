// /frontend/src/App.jsx - FINAL COMPLETE STABLE VERSION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

/* --- CHART.JS IS DISABLED TO PREVENT ALL CSP 'eval' ERRORS --- */

const TOKEN_KEY = 'orchid_nexus_token';

// --- Axios Interceptor ---
axios.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Helper Components ---
function Notification({ message, onDismiss }) { useEffect(() => { const timer = setTimeout(() => { onDismiss(); }, 5000); return () => clearTimeout(timer); }, [onDismiss]); return ( <div className="notification-toast">{message}</div> ); }
function SimpleAddForm({ placeholder, onSubmit, cta }) { const [name, setName] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); if (!name.trim()) return; await onSubmit(name); setName(''); }; return ( <form onSubmit={handleSubmit} className="simple-add-form"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} required/><button type="submit">{cta}</button></form> ); }
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const changeLanguage = (lng) => i18n.changeLanguage(lng);
  return (
    <div className="language-switcher" style={{display: 'flex', gap: '0.5rem', marginRight: '1rem'}}>
      <button style={{padding: '0.2rem 0.5rem'}} onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>EN</button>
      <button style={{padding: '0.2rem 0.5rem'}} onClick={() => changeLanguage('fr')} disabled={i18n.language === 'fr'}>FR</button>
    </div>
  );
}

// --- AUTHENTICATION & PROJECT SELECTION ---
function LoginPage({ onLoginSuccess }) {
  const { t, i18n } = useTranslation();
  const [isLoginView, setIsLoginView] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [role, setRole] = useState('Field Officer'); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);
  const handleAuth = async (event) => {
    event.preventDefault(); setIsLoading(true); setError('');
    const apiUrl = isLoginView ? 'https://orchid-nexus-backend.onrender.com/token' : 'https://orchid-nexus-backend.onrender.com/users/';
    try {
        if (isLoginView) {
            const formData = new URLSearchParams(); formData.append('username', email); formData.append('password', password);
            const response = await axios.post(apiUrl, formData); onLoginSuccess(response.data.access_token);
        } else {
            await axios.post(apiUrl, { email, password, role });
            const loginSuccessMessage = i18n.language === 'fr' ? 'Compte créé! Veuillez vous connecter.' : 'Account created! Please log in.';
            setError(loginSuccessMessage);
            setIsLoginView(true);
        }
    } catch (err) {
        const detail = err.response?.data?.detail;
        if (isLoginView) { setError(t('login.loginFailed')); }
        else { setError(detail || t('login.signupFailed')); }
    } finally { setIsLoading(false); }
  };
  return ( <div className="login-container"><div className="login-box"><h2>{isLoginView ? t('login.title') : t('login.createAccountTitle')}</h2><form onSubmit={handleAuth}>{error && <p className={error.includes('created!') || error.includes('créé!') ? 'success-message' : 'error-message'}>{error}</p>}<div className="input-group"><label>{t('login.emailLabel')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="input-group"><label>{t('login.passwordLabel')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>{!isLoginView && ( <div className="input-group"><label>{t('login.roleLabel')}</label><select value={role} onChange={(e) => setRole(e.target.value)}><option>Field Officer</option><option>Monitoring Officer</option><option>Project Manager</option></select></div> )}<button type="submit" disabled={isLoading}>{isLoading ? '...' : (isLoginView ? t('login.loginButton') : t('login.signupButton'))}</button></form><button className="toggle-auth" onClick={() => { setIsLoginView(!isLoginView); setError(''); }}>{isLoginView ? t('login.toggleToSignup') : t('login.toggleToLogin')}</button></div></div> );
}
function ProjectSelectionPage({ onSelectProject, onLogout, currentUser }) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const fetchProjects = useCallback(async () => { try { const res = await axios.get('https://orchid-nexus-backend.onrender.com/projects/'); setProjects(res.data); } catch (err) { console.error(err); } }, []);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  const handleCreateProject = async (name) => { try { await axios.post('https://orchid-nexus-backend.onrender.com/projects/', { name }); fetchProjects(); } catch (err) { console.error('Failed to create project', err); } };
  return ( <div className="app-container"><header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><h1>{t('projectSelection.title')}</h1><div style={{display: 'flex', alignItems: 'center'}}><LanguageSwitcher /><button onClick={onLogout} className="logout-button">{t('projectSelection.logoutButton')}</button></div></header><main className="project-selection-main"><div className="project-list">{projects.map(p => ( <button key={p.id} onClick={() => onSelectProject(p.id)} className="project-card">{p.name}</button> ))}</div>{ (currentUser && currentUser.role === 'Project Manager') && <div className="project-add-form-container"><h3>Create New Project</h3><SimpleAddForm placeholder="Enter project name..." onSubmit={handleCreateProject} cta="+ Create"/></div>} </main></div> );
}

// --- ALL COMPONENTS ARE DEFINED HERE ---
const LogisticsDashboard = ({ currentUser }) => { 
    const [inventory, setInventory] = useState([]);
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fetchData = useCallback(async () => {
        try {
            setError('');
            const [invRes, itemsRes, locsRes] = await Promise.all([
                axios.get('https://orchid-nexus-backend.onrender.com/inventory/'),
                axios.get('https://orchid-nexus-backend.onrender.com/items/'),
                axios.get('https://orchid-nexus-backend.onrender.com/locations/')
            ]);
            setInventory(invRes.data);
            setItems(itemsRes.data);
            setLocations(locsRes.data);
        } catch (err) { console.error(err); setError("Failed to fetch logistics data."); }
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);
    const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
    const isManager = currentUser.role === 'Project Manager';
    return ( <div className="logistics-container"> {error && <p className="error-message">{error}</p>} {success && <p className="success-message">{success}</p>} <LowStockAlerts /> <div className="dashboard-grid"> <div className="dashboard-main-content"> <div className="objective-panel"> <div className="panel-header-objective"><h3>Current Inventory</h3></div> <div className="objective-content" style={{ padding: 0 }}> <table style={{ width: '100%', borderCollapse: 'collapse' }}> <thead style={{ backgroundColor: 'var(--surface-subtle)' }}> <tr> <th style={{ padding: '1rem', textAlign: 'left' }}>Item</th> <th style={{ padding: '1rem', textAlign: 'left' }}>Location</th> <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity</th> <th style={{ padding: '1rem', textAlign: 'right' }}>Threshold</th> </tr> </thead> <tbody> {inventory.map(inv => ( <tr key={inv.id} style={{ borderBottom: '1px solid var(--surface-border)' }}> <td style={{ padding: '1rem' }}>{inv.item.name}</td> <td style={{ padding: '1rem' }}>{inv.location.name}</td> <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{inv.quantity}</td> <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{inv.low_stock_threshold > 0 ? inv.low_stock_threshold : 'N/A'}</td> </tr> ))} {inventory.length === 0 && ( <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No inventory records found.</td></tr> )} </tbody> </table> </div> </div> </div> <aside className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}> <DistributionForm items={items} locations={locations} onDistribute={() => {fetchData(); showSuccess("Distribution logged successfully!");}} onError={setError} /> <StockingForm items={items} locations={locations} onStock={() => {fetchData(); showSuccess("Stock added successfully!");}} onError={setError} isManager={isManager} /> {isManager && <ItemLocationCreator onCreate={() => {fetchData(); showSuccess("New item/location created!");}} onError={setError} />} </aside> </div> </div> );
};
const LowStockAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    useEffect(() => {
        axios.get('https://orchid-nexus-backend.onrender.com/inventory/low-stock-alerts')
            .then(res => setAlerts(res.data))
            .catch(err => console.error("Failed to fetch low stock alerts", err))
    }, []);
    if (alerts.length === 0) return null;
    return ( <div className="objective-panel" style={{ borderColor: 'var(--danger-red)', marginBottom: '1.5rem' }}> <div className="panel-header-objective" style={{ backgroundColor: '#fee2e2' }}> <h3 style={{ color: 'var(--danger-red-dark)' }}>⚠️ Low Stock Alerts</h3> </div> <div className="objective-content"> {alerts.map(alert => ( <div key={alert.id} className="task-item" style={{ borderBottom: '1px solid #fecaca' }}> <div className="task-details"> <p style={{ fontWeight: 'bold' }}>{alert.item.name} at {alert.location.name}</p> <span className="task-date overdue">Current: {alert.quantity} | Threshold: {alert.low_stock_threshold}</span> </div> </div> ))} </div> </div> );
};
const DistributionForm = ({ items, locations, onDistribute, onError }) => {
    const [itemId, setItemId] = useState(''); const [locationId, setLocationId] = useState(''); const [quantity, setQuantity] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault(); onError('');
        try {
            await axios.post('https://orchid-nexus-backend.onrender.com/inventory/distribute', { item_id: parseInt(itemId), location_id: parseInt(locationId), quantity: parseInt(quantity) });
            onDistribute(); setItemId(''); setLocationId(''); setQuantity('');
        } catch (err) { onError(err.response?.data?.detail || "Distribution failed."); }
    };
    return ( <div className="hud-card"> <h4>Log Distribution</h4> <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}> <select value={itemId} onChange={e => setItemId(e.target.value)} required><option value="">Select Item</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select> <select value={locationId} onChange={e => setLocationId(e.target.value)} required><option value="">Select Location</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select> <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" required /> <button type="submit" className="simple-add-form button">Distribute</button> </form> </div> );
};
const StockingForm = ({ items, locations, onStock, onError, isManager }) => {
    const [itemId, setItemId] = useState(''); const [locationId, setLocationId] = useState(''); const [quantity, setQuantity] = useState(''); const [threshold, setThreshold] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault(); onError('');
        try {
            const payload = { item_id: parseInt(itemId), location_id: parseInt(locationId), quantity: parseInt(quantity) };
            if (isManager && threshold) { payload.low_stock_threshold = parseInt(threshold); }
            await axios.post('https://orchid-nexus-backend.onrender.com/inventory/stock', payload);
            onStock(); setItemId(''); setLocationId(''); setQuantity(''); setThreshold('');
        } catch (err) { onError(err.response?.data?.detail || "Adding stock failed."); }
    };
    return ( <div className="hud-card"> <h4>Add Stock</h4> <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}> <select value={itemId} onChange={e => setItemId(e.target.value)} required><option value="">Select Item</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select> <select value={locationId} onChange={e => setLocationId(e.target.value)} required><option value="">Select Location</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select> <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity to Add" required /> {isManager && ( <input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="Low Stock Threshold (optional)" title="Set a number to get alerts when stock is low."/> )} <button type="submit" className="simple-add-form button">Add Stock</button> </form> </div> );
};
const ItemLocationCreator = ({ onCreate, onError }) => {
    const handleCreate = async (type, name) => {
        try { await axios.post(`https://orchid-nexus-backend.onrender.com/${type}/`, { name }); onCreate(); }
        catch (err) { onError(`Failed to create ${type}. Name might already exist.`); }
    };
    return ( <div className="hud-card"> <h4>Create Master Data</h4> <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}> <SimpleAddForm placeholder="New Item Name..." onSubmit={(name) => handleCreate('items', name)} cta="+ Add Item" /> <SimpleAddForm placeholder="New Location Name..." onSubmit={(name) => handleCreate('locations', name)} cta="+ Add Location" /> </div> </div> );
};
const FinancePanel = ({ activity, currentUser, onDataChange }) => {
    const [expenseAmount, setExpenseAmount] = useState(''); const [expenseDesc, setExpenseDesc] = useState(''); const [budgetAmount, setBudgetAmount] = useState(activity.budget?.total_amount || ''); const isManager = currentUser.role === 'Project Manager'; const budget = activity.budget; const totalExpenses = budget ? budget.expenses.reduce((acc, curr) => acc + curr.amount, 0) : 0; const burnRatePercentage = (budget && budget.total_amount > 0) ? (totalExpenses / budget.total_amount) * 100 : 0;
    const handleSetBudget = async (e) => { e.preventDefault(); try { await axios.post('https://orchid-nexus-backend.onrender.com/budgets/', { activity_id: activity.id, total_amount: parseFloat(budgetAmount) }); onDataChange(); } catch (err) { console.error("Failed to set budget", err); } };
    const handleLogExpense = async (e) => { e.preventDefault(); if (!budget) { alert("Please set a budget for this activity before logging expenses."); return; } try { await axios.post('https://orchid-nexus-backend.onrender.com/expenses/', { budget_id: budget.id, amount: parseFloat(expenseAmount), description: expenseDesc }); setExpenseAmount(''); setExpenseDesc(''); onDataChange(); } catch (err) { console.error("Failed to log expense", err); } };
    return ( <div> <h4>Finance</h4> {budget ? ( <div className="kpi-indicator"> <div className="kpi-info"> <span>Spent / Budget</span> <span>${totalExpenses.toFixed(2)} / ${budget.total_amount.toFixed(2)}</span> </div> <div className="progress-bar-background"><div className="progress-bar-foreground" style={{ width: `${Math.min(burnRatePercentage, 100)}%` }}></div></div> </div> ) : ( <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>No budget set for this activity.</p> )} {isManager && ( <form onSubmit={handleSetBudget} className="simple-add-form" style={{marginBottom: '1rem'}}> <input type="number" step="0.01" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} placeholder="Set Total Budget..." required /> <button type="submit">{budget ? 'Update' : 'Set'}</button> </form> )} <form onSubmit={handleLogExpense} className="add-task-form" style={{borderTop: '1px solid var(--surface-border)', paddingTop: '1rem'}}> <input type="number" step="0.01" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="Expense Amount" required /> <input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} placeholder="Expense Description" required /> <button type="submit" style={{gridColumn: 'span 2'}}>+ Log Expense</button> </form> {budget && budget.expenses.length > 0 && ( <ul className="deliverable-list" style={{marginTop: '1rem'}}> {budget.expenses.slice(0).reverse().map(exp => ( <li key={exp.id}> ${exp.amount.toFixed(2)} - {exp.description} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', float: 'right'}}> {new Date(exp.timestamp).toLocaleDateString()} </span> </li> ))} </ul> )} </div> );
};
const KpiHistoryModal = ({ kpi, onClose }) => { return ( <div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>History for {kpi.name}</h3><button onClick={onClose} className="modal-close-button">&times;</button></div><p>Chart is temporarily disabled.</p></div></div> ); };
const KpiIndicator = ({ kpi, currentUser, onDataChange }) => { const [showHistory, setShowHistory] = useState(false); const progress = kpi.target_value > 0 ? ((kpi.current_value || 0) / kpi.target_value) * 100 : 0; const handleDelete = async () => { if (window.confirm(`Delete KPI: "${kpi.name}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/kpis/${kpi.id}`); onDataChange(); } catch (err) { console.error(err); } } }; const isPrivileged = currentUser.role === 'Project Manager' || currentUser.role === 'Monitoring Officer'; return ( <div className="kpi-indicator"> {showHistory && <KpiHistoryModal kpi={kpi} onClose={() => setShowHistory(false)} />} <div className="kpi-info"><span>{kpi.name} {kpi.unit && `(${kpi.unit})`}</span><span>{kpi.current_value || 0} / {kpi.target_value}</span></div> <div className="progress-bar-background"><div className="progress-bar-foreground" style={{ width: `${Math.min(progress, 100)}%` }}></div></div> <div className="kpi-actions"><button onClick={() => setShowHistory(true)}>📈</button>{isPrivileged && <button onClick={handleDelete} className="delete-button-kpi">🗑️</button>}</div> </div> ); };
const KpiEntryForm = ({ kpi, onDataChange }) => { const [value, setValue] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post(`https://orchid-nexus-backend.onrender.com/kpis/${kpi.id}/entries`, { value: parseInt(value, 10) }); setValue(''); onDataChange(); } catch (err) { console.error(err); } }; return (<form onSubmit={handleSubmit} className="kpi-entry-form"><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Add value..." required/><button type="submit">+</button></form>); };
const AddKpiForm = ({ activityId, onDataChange }) => { const [name, setName] = useState(''); const [unit, setUnit] = useState(''); const [target, setTarget] = useState(100); const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post('https://orchid-nexus-backend.onrender.com/kpis/', { name, unit, target_value: parseInt(target, 10) || 0, activity_id: activityId }); setName(''); setUnit(''); setTarget(100); onDataChange(); } catch (err) { console.error(err); } }; return ( <form onSubmit={handleSubmit} className="kpi-add-form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Indicator Name" required/><input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="Unit"/><input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target" required/><button type="submit">+</button></form> ); };
const DeliverableForm = ({ task, onDataChange }) => { const [textContent, setTextContent] = useState(''); const [proofFile, setProofFile] = useState(null); const handleSubmit = async (e) => { e.preventDefault(); const formData = new FormData(); formData.append('task_id', task.id); if (textContent) formData.append('text_content', textContent); if (proofFile) formData.append('proof_file', proofFile); try { await axios.post('https://orchid-nexus-backend.onrender.com/deliverables/', formData); setTextContent(''); setProofFile(null); e.target.reset(); onDataChange(); } catch (err) { console.error(err); } }; return ( <div className="deliverable-section"><h5>Deliverables for "{task.description}"</h5><ul className="deliverable-list">{task.deliverables.map(d => <li key={d.id}>{d.text_content || `File: ${d.file_path}`} by {d.submitter.email}</li>)}</ul><form onSubmit={handleSubmit} className="deliverable-form"><textarea value={textContent} onChange={e=>setTextContent(e.target.value)} placeholder="Add a report or notes..."></textarea><input type="file" onChange={e=>setProofFile(e.target.files[0])} /><button type="submit">Submit</button></form></div>); };
const TaskItem = ({ task, currentUser, onDataChange }) => { const [isExpanded, setIsExpanded] = useState(false); const today = new Date(); today.setHours(0,0,0,0); const endDate = task.end_date ? new Date(task.end_date) : null; const isOverdue = endDate && endDate < today && task.status !== 'Complete'; const isDueSoon = endDate && !isOverdue && (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 3 && task.status !== 'Complete'; let dateClass = ''; if (task.status === 'Complete') dateClass = 'complete'; else if (isOverdue) dateClass = 'overdue'; else if (isDueSoon) dateClass = 'due-soon'; const handleToggleStatus = async (e) => { e.stopPropagation(); try { await axios.patch(`https://orchid-nexus-backend.onrender.com/tasks/${task.id}/status`); onDataChange(); } catch (err) { console.error(err); } }; const handleDelete = async (e) => { e.stopPropagation(); if (window.confirm(`Delete task: "${task.description}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/tasks/${task.id}`); onDataChange(); } catch (err) { console.error(err); } } }; const isManager = currentUser.role === 'Project Manager'; return ( <div className="task-item"> <div className="task-main-row" onClick={() => setIsExpanded(!isExpanded)}> <div className={`status-ring ${dateClass}`}></div><div className={`status-checkbox ${task.status.toLowerCase()}`} onClick={handleToggleStatus}></div> <div className="task-details"><p>{task.description}</p>{task.end_date && <span className={`task-date ${dateClass}`}>{new Date(task.end_date).toLocaleDateString()}</span>}</div> {task.assignee && <div className="task-assignee" title={task.assignee.email}>{task.assignee.email.charAt(0).toUpperCase()}</div>} {isManager && <button onClick={handleDelete} className="delete-button">🗑️</button>} <span className={`chevron ${isExpanded ? 'open' : ''}`}>▼</span> </div> {isExpanded && <div className="task-expanded-content"><DeliverableForm task={task} onDataChange={onDataChange} /></div>} </div> ); };
const AddTaskForm = ({ activityId, users, onDataChange }) => { const [description, setDescription] = useState(''); const [assigneeId, setAssigneeId] = useState(''); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); const taskData = { description, activity_id: activityId, assignee_id: assigneeId ? parseInt(assigneeId, 10) : null, start_date: startDate || null, end_date: endDate || null }; try { await axios.post('https://orchid-nexus-backend.onrender.com/tasks/', taskData); setDescription(''); setAssigneeId(''); setStartDate(''); setEndDate(''); onDataChange(); } catch (err) { console.error(err); } }; return ( <form onSubmit={handleSubmit} className="add-task-form"><input value={description} onChange={e => setDescription(e.target.value)} placeholder="New task..." required /><select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}</select><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="Start Date"/><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="End Date"/><button type="submit">+</button></form> ); };
const ActivityPanel = ({ activity, users, currentUser, filter, onDataChange }) => { const [isOpen, setIsOpen] = useState(false); const isManager = currentUser.role === 'Project Manager'; const isPrivileged = isManager || currentUser.role === 'Monitoring Officer'; const filteredTasks = activity.tasks.filter(task => filter.type === 'all' || (task.assignee && task.assignee.id === filter.id)); const handleDelete = async (e) => { e.stopPropagation(); if (window.confirm(`Delete Activity: "${activity.name}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/activities/${activity.id}`); onDataChange(); } catch (err) { console.error(err); } } }; return ( <div className="activity-panel"> <div className="panel-header" onClick={() => setIsOpen(!isOpen)}><span>{activity.name}</span><div className="panel-actions">{isManager && <button onClick={handleDelete} className="delete-button-header mini">🗑️</button>}<span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span></div></div> {isOpen && <div className="activity-content"><div className="activity-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'}}> <div><h4>Tasks</h4>{filteredTasks.map(task => <TaskItem key={task.id} task={task} currentUser={currentUser} onDataChange={onDataChange}/>)}{isPrivileged && <AddTaskForm activityId={activity.id} users={users} onDataChange={onDataChange}/>}</div> <div><h4>Activity Indicators</h4>{activity.kpis.map(kpi => <div key={kpi.id}><KpiIndicator kpi={kpi} currentUser={currentUser} onDataChange={onDataChange}/><KpiEntryForm kpi={kpi} onDataChange={onDataChange}/></div>)}{isPrivileged && <AddKpiForm activityId={activity.id} onDataChange={onDataChange}/>}</div> <FinancePanel activity={activity} currentUser={currentUser} onDataChange={onDataChange} /> </div></div>} </div> ); };
const ObjectivePanel = ({ objective, users, currentUser, filter, onDataChange }) => { const [isOpen, setIsOpen] = useState(true); const isManager = currentUser.role === 'Project Manager'; const handleActivitySubmit = async (name) => { try { await axios.post('https://orchid-nexus-backend.onrender.com/activities/', { name, objective_id: objective.id }); onDataChange(); } catch(err) { console.error(err); } }; const handleDelete = async (e) => { e.stopPropagation(); if(window.confirm(`Delete Objective: "${objective.name}"?`)) { try { await axios.delete(`https://orchid-nexus-backend.onrender.com/objectives/${objective.id}`); onDataChange(); } catch (err) { console.error(err); } } }; return ( <div className="objective-panel"> <div className="panel-header-objective" onClick={() => setIsOpen(!isOpen)}><h3><span>{objective.name}</span></h3><div className="panel-actions">{isManager && <button onClick={handleDelete} className="delete-button-header">🗑️</button>}<span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span></div></div> {isOpen && <div className="objective-content"> {objective.activities.map(activity => <ActivityPanel key={activity.id} activity={activity} users={users} currentUser={currentUser} filter={filter} onDataChange={onDataChange}/>)} {isManager && <SimpleAddForm placeholder="New activity..." onSubmit={handleActivitySubmit} cta="+ Add Activity" />} </div>} </div> ); };
const DashboardPage = ({ project, onDataChange, onBack, onLogout, users, currentUser }) => {
  const { t } = useTranslation();
  const [notification, setNotification] = useState(null); const [summaryData, setSummaryData] = useState(null); const [filter, setFilter] = useState({ type: 'all' }); const [view, setView] = useState('programs'); const ws = useRef(null);
  const fetchSummaryData = useCallback(async () => { try { const res = await axios.get(`https://orchid-nexus-backend.onrender.com/projects/${project.id}/summary`); setSummaryData(res.data); } catch (error) { console.error(error); } }, [project.id]);
  const combinedDataChange = useCallback(() => { onDataChange(); fetchSummaryData(); }, [onDataChange, fetchSummaryData]);
  useEffect(() => {
    fetchSummaryData();
    const wsUrl = `wss://orchid-nexus-backend.onrender.com/ws/${project.id}`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotification(data.message);
        combinedDataChange();
      }
    };
    return () => { ws.current.close(); };
  }, [project.id, combinedDataChange]);
  const handleObjectiveSubmit = async (name) => { try { await axios.post('https://orchid-nexus-backend.onrender.com/objectives/', { name, project_id: project.id }); onDataChange(); } catch (err) { console.error(err); } };
  const DashboardHud = ({ summary }) => ( <div className="hud-container"><div className="hud-card"><span className="hud-value">{summary ? `${summary.total_tasks - summary.completed_tasks}`:'-'}</span><span className="hud-label">Pending</span></div><div className="hud-card"><span className="hud-value overdue">{summary ? summary.overdue_tasks:'-'}</span><span className="hud-label">Overdue</span></div><div className="hud-card"><span className="hud-value">{summary ? `${summary.completed_tasks}/${summary.total_tasks}`:'-'}</span><span className="hud-label">Completed</span></div></div> );
  const TaskChart = () => <div className="chart-container"><h3>Task Status</h3><p>Chart is temporarily disabled.</p></div>;
  const isManager = currentUser.role === 'Project Manager';
  return ( <div className="app-container"> {notification && <Notification message={notification} onDismiss={() => setNotification(null)} />} <header className="dashboard-header"><button onClick={onBack} className="back-button">← Projects</button><h1>{project.name}</h1><div style={{display: 'flex', alignItems: 'center'}}><LanguageSwitcher /><button onClick={onLogout} className="logout-button">{t('projectSelection.logoutButton')}</button></div></header> <div className="filter-bar" style={{marginBottom: '1.5rem'}}> <button onClick={() => setView('programs')} className={view === 'programs' ? 'active' : ''}>Programs</button> <button onClick={() => setView('logistics')} className={view === 'logistics' ? 'active' : ''}>Logistics</button> </div> {view === 'programs' ? ( <div className="dashboard-grid"> <div className="dashboard-main-content"> <DashboardHud summary={summaryData} /> <div className="filter-bar"><button onClick={() => setFilter({ type: 'all'})} className={filter.type === 'all' ? 'active' : ''}>All Tasks</button><button onClick={() => setFilter({ type: 'user', id: currentUser.id})} className={filter.type === 'user' ? 'active' : ''}>My Tasks</button></div> {project.objectives.map(objective => <ObjectivePanel key={objective.id} objective={objective} users={users} currentUser={currentUser} filter={filter} onDataChange={combinedDataChange} />)} {isManager && <div className="objective-panel" style={{marginTop: '1.5rem'}}><div className="objective-content"><h3>Create New Objective</h3><SimpleAddForm placeholder="Enter objective name..." onSubmit={handleObjectiveSubmit} cta="+ Create" /></div></div>} </div> <aside className="dashboard-sidebar"><TaskChart /></aside> </div> ) : ( <LogisticsDashboard currentUser={currentUser} /> )} </div> );
}

// --- THIS IS THE CRITICAL LINE ---
export default App;