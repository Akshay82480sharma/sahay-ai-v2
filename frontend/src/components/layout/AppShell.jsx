import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function AppShell({ children }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Sahay AI</h1>
            </Link>
            
            <nav className="flex items-center gap-3 sm:gap-4 border-l border-gray-200 pl-4 sm:pl-6 h-8 text-sm sm:text-base">
              <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
              <Link to="/report" className={isActive('/report')}>New Report</Link>
              <Link to="/analytics" className={isActive('/analytics')}>Analytics</Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
