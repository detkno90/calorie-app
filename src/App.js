import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import FoodSearch from './pages/FoodSearch';
import FastingTimer from './pages/FastingTimer';
import WorkoutLog from './pages/WorkoutLog';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import './App.css';

function Nav() {
  const { signOut } = useApp();
  const tabs = [
    { to: '/',        icon: '🏠', label: 'Home' },
    { to: '/food',    icon: '🥗', label: 'Food' },
    { to: '/fasting', icon: '⏱',  label: 'Fast' },
    { to: '/workout', icon: '💪', label: 'Workout' },
    { to: '/settings',icon: '⚙️', label: 'Goals' },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <div className="nav-icon-wrap">
            <span className="nav-icon">{t.icon}</span>
          </div>
          <span className="nav-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppShell() {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🥗</div>
        <div style={{ fontSize: 16, color: 'var(--text2)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <Router>
      <div className="app-shell">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/food" element={<FoodSearch />} />
            <Route path="/fasting" element={<FastingTimer />} />
            <Route path="/workout" element={<WorkoutLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <Nav />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
