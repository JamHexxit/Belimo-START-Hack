'use client';

import { useState } from 'react';
import Sidebar from './components/sidebar';
import Navbar from './components/navbar';
import ToastContainer from './components/notification';
import DashboardPage from './views/DashboardPage';
import DeviceManagerPage from './views/DeviceManagerPage';
import RoomsPage from './views/RoomsPage';
import NotificationsPage from './views/NotificationsPage';
import { AppProvider } from './context/AppContext';

type Page = 'dashboard' | 'devices' | 'rooms' | 'notifications';

function AppShell() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'devices': return <DeviceManagerPage />;
      case 'rooms': return <RoomsPage />;
      case 'notifications': return <NotificationsPage />;
    }
  };

  return (
    <div className="app-layout">
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
