'use client';

import { useState } from 'react';
import Sidebar from './components/sidebar';
import Navbar from './components/navbar';
import ToastContainer from './components/notification';
import ParticleBackground from './components/particle_background';
import DashboardPage from './views/DashboardPage';
import CompaniesPage from './views/CompaniesPage';
import NotificationsPage from './views/NotificationsPage';
import { AppProvider } from './context/AppContext';
import { Page } from './lib/types';

function AppShell() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage onNavigate={setActivePage} />;
      case 'companies': return <CompaniesPage onNavigate={setActivePage} />;
      case 'notifications': return <NotificationsPage />;
    }
  };

  return (
    <div className="app-layout">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content */}
      <div className="main-area">
        <Navbar activePage={activePage} />
        <main className="page-content">
          {renderPage()}
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
