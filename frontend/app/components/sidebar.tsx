'use client';

import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n';

import { Page } from '../lib/types';

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
const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const IconCompany = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="10" width="20" height="12" rx="2"/><path d="M6 10V4a2 2 0 012-2h8a2 2 0 012 2v6"/>
  </svg>
);
const IconPlace = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconPlus = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { 
    devices, unreadCount, 
    companies, buildings, places,
    selectedCompanyId, setSelectedCompanyId,
    selectedBuildingId, setSelectedBuildingId,
    selectedPlaceId, setSelectedPlaceId 
  } = useApp();
  const theme = useTheme();
  const t = useTranslation();

  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    { id: 'dashboard' as Page, label: t.sidebar.dashboard, icon: <IconDashboard /> },
    { id: 'statistics' as Page, label: 'Portfolio', icon: <IconActivity /> },
    { id: 'notifications' as Page, label: t.sidebar.notifications, icon: <IconBell />, badge: unreadCount > 0 ? String(unreadCount) : undefined },
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
          src={theme === 'dark' ? '/logo-white-text.png' : '/logo-black-text.png'}
          alt="Belimo Logo"
          width={110}
          height={36}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" ref={navRef} style={{ position: 'relative' }}>
        <div className="sidebar-section-label">Overview</div>
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

        <div className="sidebar-section-label" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Customers</span>
          {(selectedCompanyId || selectedBuildingId || selectedPlaceId) && (
            <button 
              onClick={() => { setSelectedCompanyId(null); setSelectedBuildingId(null); setSelectedPlaceId(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--belimo-orange)', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}
            >
              Reset
            </button>
          )}
        </div>
        
        <div className="sidebar-hierarchy" style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {companies.map(company => (
            <div key={company.companyId} className="sidebar-tree-node">
              <div 
                className={`sidebar-nav-item hierarchy-item ${selectedCompanyId === company.companyId && !selectedBuildingId ? 'active' : ''}`}
                style={{ fontSize: 13, height: 32, paddingLeft: 8, gap: 4 }}
                onClick={() => {
                  setSelectedCompanyId(company.companyId);
                  setSelectedBuildingId(null);
                  setSelectedPlaceId(null);
                  if (!expandedIds.has(company.companyId)) {
                    setExpandedIds(prev => new Set(prev).add(company.companyId));
                  }
                  onNavigate('dashboard');
                }}
              >
                <button 
                  className="tree-toggle-btn"
                  onClick={(e) => toggleExpand(company.companyId, e)}
                  style={{ transform: expandedIds.has(company.companyId) ? 'rotate(90deg)' : 'none' }}
                >
                  <IconChevronRight />
                </button>
                <IconCompany />
                <span className="tree-label">{company.name}</span>
              </div>
              
              {expandedIds.has(company.companyId) && (
                <div className="sidebar-tree-children" style={{ marginLeft: 16, borderLeft: '1px solid var(--border-subtle)' }}>
                  {buildings.filter(b => b.companyId === company.companyId).map(building => (
                    <div key={building.buildingId} className="sidebar-tree-node">
                      <div 
                        className={`sidebar-nav-item hierarchy-item ${selectedBuildingId === building.buildingId && !selectedPlaceId ? 'active' : ''}`}
                        style={{ fontSize: 12, height: 28, paddingLeft: 8, gap: 4 }}
                        onClick={() => {
                          setSelectedBuildingId(building.buildingId);
                          setSelectedPlaceId(null);
                          if (!expandedIds.has(building.buildingId)) {
                            setExpandedIds(prev => new Set(prev).add(building.buildingId));
                          }
                          onNavigate('dashboard');
                        }}
                      >
                        <button 
                          className="tree-toggle-btn"
                          onClick={(e) => toggleExpand(building.buildingId, e)}
                          style={{ transform: expandedIds.has(building.buildingId) ? 'rotate(90deg)' : 'none' }}
                        >
                          <IconChevronRight />
                        </button>
                        <IconBuilding />
                        <span className="tree-label">{building.name}</span>
                      </div>
                      
                      {expandedIds.has(building.buildingId) && (
                        <div className="sidebar-tree-children" style={{ marginLeft: 16, borderLeft: '1px solid var(--border-subtle)' }}>
                          {places.filter(p => p.buildingId === building.buildingId).map(place => (
                            <button 
                              key={place.placeId}
                              className={`sidebar-nav-item hierarchy-item ${selectedPlaceId === place.placeId ? 'active' : ''}`}
                              style={{ fontSize: 11, height: 24, paddingLeft: 12, gap: 8 }}
                              onClick={() => {
                                setSelectedPlaceId(place.placeId);
                                onNavigate('dashboard');
                              }}
                            >
                              <IconPlace />
                              <span className="tree-label">{place.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

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
