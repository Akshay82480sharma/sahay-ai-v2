import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import ReportIntake from './pages/ReportIntake';
import { LiveDataProvider } from './context/LiveDataProvider';

function App() {
  return (
    <LiveDataProvider>
      <Router>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<ReportIntake />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </Router>
    </LiveDataProvider>
  );
}

export default App;
