'use client';

import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { useRef, useEffect, useState } from 'react';

type Page = 'dashboard' | 'devices' | 'rooms' | 'notifications';

// Detect light/dark mode for logo filter
const useTheme = () => {
  const { theme } = useApp();
  return theme;
};

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const IconDevices = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
  </svg>
);
const IconRooms = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { devices, unreadCount } = useApp();
  const theme = useTheme();

  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('.sidebar-nav-item.active') as HTMLElement;
    if (activeEl) {
      setIndicatorStyle({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        opacity: 1
      });
    }
  }, [activePage, devices.length, unreadCount]);

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'devices' as Page, label: 'Device Manager', icon: <IconDevices />, badge: devices.length > 0 ? String(devices.length) : undefined },
    { id: 'rooms' as Page, label: 'Rooms', icon: <IconRooms /> },
    { id: 'notifications' as Page, label: 'Notifications', icon: <IconBell />, badge: unreadCount > 0 ? String(unreadCount) : undefined },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div 
        className="sidebar-logo" 
        onClick={() => {
          onNavigate('dashboard');
          document.querySelector('.page-content')?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{ cursor: 'pointer' }}
      >
        <Image
          src="/logo-1x.png"
          alt="Belimo Logo"
          width={110}
          height={36}
          style={{ objectFit: 'contain', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" ref={navRef} style={{ position: 'relative' }}>
        <div className="sidebar-section-label">Monitor</div>
        <div 
          style={{
            position: 'absolute',
            left: 8,
            width: 3,
            background: 'var(--belimo-orange)',
            transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            ...indicatorStyle
          }}
        />
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
          </button>
        ))}

      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: 'var(--sidebar-text-muted)', padding: '4px 12px' }}>
          <div style={{ fontWeight: 600, color: 'var(--sidebar-text-secondary)', marginBottom: 2 }}>Sensor Monitor</div>
          <div>v1.0.0 · START Hack 2026</div>
        </div>
      </div>
    </aside>
  );
}
