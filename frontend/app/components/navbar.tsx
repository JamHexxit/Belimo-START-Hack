'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Language } from '../context/AppContext';
import NotificationMenu from './notification_menue';
import { useTranslation } from '../lib/i18n';

import { Page } from '../lib/types';

// Removed hardcoded PAGE_TITLES since we use translation hook inside the component

// Icons
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const IconSun = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

interface NavbarProps {
  activePage: Page;
}

export default function Navbar({ activePage }: NavbarProps) {
  const { devices, unreadCount, theme, toggleTheme, refreshDevices, refreshHierarchy, language, setLanguage, selectedCompanyId } = useApp();
  const t = useTranslation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const LANGUAGES: { code: Language; flag: string; label: string }[] = [
    { code: 'en', flag: 'EN', label: 'English' },
    { code: 'de', flag: 'DE', label: 'Deutsch' },
    { code: 'fr', flag: 'FR', label: 'Français' },
  ];
  const activeLang = LANGUAGES.find(l => l.code === language)!;

  const info = {
    dashboard: { 
      title: 'Portfolio', 
      subtitle: !selectedCompanyId ? 'Global Portfolio' : 'Customer Overview' 
    },
    companies: {
      title: 'Companies',
      subtitle: 'Manage clients and organizations'
    },
    notifications: { 
      title: t.nav.notificationsTitle, 
      subtitle: t.nav.notificationsSubtitle 
    },
  }[activePage as 'dashboard' | 'companies' | 'notifications'];

  const total = devices.length;
  const statusClass = total === 0 ? '' : 'online';
  const statusLabel = total === 0 ? t.nav.noDevices : `${total} ${total !== 1 ? t.nav.devicesConnected : t.nav.deviceConnected}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDevices(), refreshHierarchy()]);
    setTimeout(() => setRefreshing(false), 700);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    if (showNotifs || showLangMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs, showLangMenu]);

  return (
    <header className="navbar">
      <div>
        <div className="navbar-title">{info.title}</div>
        <div className="navbar-subtitle">{info.subtitle}</div>
      </div>

      <div className="navbar-right">

        {/* Language Switcher */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <button
            className="theme-toggle"
            onClick={() => setShowLangMenu(v => !v)}
            title="Change language"
            style={{ gap: 5, minWidth: 64 }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 4px', border: '1px solid currentColor', borderRadius: 2 }}>{activeLang.flag}</span>
            {activeLang.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showLangMenu && (
            <div className="language-menu">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                  className={`language-menu-item ${language === l.code ? 'active' : ''}`}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 4px', border: '1px solid currentColor', borderRadius: 2 }}>{l.flag}</span>
                  {l.label}
                  {language === l.code && (
                    <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <IconMoon /> : <IconSun />}
          {theme === 'light' ? t.nav.dark : t.nav.light}
        </button>

        {/* Refresh */}
        <button className="navbar-btn" onClick={handleRefresh} title="Refresh">
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
            <IconRefresh />
          </span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="navbar-btn" onClick={() => setShowNotifs(v => !v)} title="Notifications">
            <IconBell />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {showNotifs && <NotificationMenu onClose={() => setShowNotifs(false)} />}
        </div>
      </div>
    </header>
  );
}
