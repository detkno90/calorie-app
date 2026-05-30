import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import FoodSearch from './pages/FoodSearch';
import FastingTimer from './pages/FastingTimer';
import WorkoutLog from './pages/WorkoutLog';
import Settings from './pages/Settings';
import './App.css';

function Nav() {
  const tabs = [
    { to: '/', icon: '🏠', label: 'Home' },
    { to: '/food', icon: '🥗', label: 'Food' },
    { to: '/fasting', icon: '⏱', label: 'Fast' },
    { to: '/workout', icon: '💪', label: 'Workout' },
    { to: '/settings', icon: '⚙️', label: 'Goals' },
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

export default function App() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}
