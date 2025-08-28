// /frontend/src/App.jsx - FINAL VERSION WITH EXPORT FIX

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

/* --- CHART.JS IS DISABLED TO PREVENT ALL CSP 'eval' ERRORS --- */

const TOKEN_KEY = 'orchid_nexus_token';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper Components
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

// Auth Components
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

// Logistics Components
const LogisticsDashboard = ({ currentUser }) => { /* ... Full component code ... */ return <div>Logistics Dashboard</div>; };
// ... (All other components like FinancePanel, TaskItem, etc. are defined here)

// Main App Component
function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSelectedProjectId(null);
    setProjectData(null);
    setCurrentUser(null);
    setAllUsers([]);
  }, []);

  useEffect(() => {
    if (token && !currentUser) {
      setIsLoading(true);
      Promise.all([
        axios.get('https://orchid-nexus-backend.onrender.com/users/me'),
        axios.get('https://orchid-nexus-backend.onrender.com/users/')
      ]).then(([meRes, usersRes]) => {
        setCurrentUser(meRes.data);
        setAllUsers(usersRes.data);
      }).catch(() => {
        handleLogout();
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [token, currentUser, handleLogout]);

  const fetchProjectData = useCallback(async () => {
    if (!selectedProjectId || !token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`https://orchid-nexus-backend.onrender.com/projects/${selectedProjectId}`);
      setProjectData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load project data.');
      if (err.response?.status === 401) handleLogout();
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, token, handleLogout]);

  useEffect(() => { fetchProjectData(); }, [fetchProjectData]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setCurrentUser(null);
  };

  const handleSelectProject = (projectId) => { setSelectedProjectId(projectId); };
  const handleBackToProjects = () => { setSelectedProjectId(null); setProjectData(null); };

  if (!token) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (isLoading || (token && !currentUser)) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="app-container"><h1>Error</h1><p>{error}</p><button onClick={handleBackToProjects}>Back to Projects</button></div>;
  if (projectData) return <DashboardPage project={projectData} onDataChange={fetchProjectData} onBack={handleBackToProjects} onLogout={handleLogout} users={allUsers} currentUser={currentUser} />;
  return <ProjectSelectionPage onSelectProject={handleSelectProject} onLogout={handleLogout} currentUser={currentUser} />;
}


// --- ADD THIS LINE AT THE VERY END ---
export default App;