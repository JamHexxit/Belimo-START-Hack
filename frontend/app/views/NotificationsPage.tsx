'use client';

import React from 'react';
import { useApp, Notification } from '../context/AppContext';
import { useTranslation } from '../lib/i18n';

const IconInfo = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
const IconCheck = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IconWarn = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconError = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>;
const IconBellOff = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const ICONS = { info: <IconInfo />, success: <IconCheck />, warning: <IconWarn />, error: <IconError /> };
const TYPE_COLORS: Record<string, string> = {
  info: '#60a5fa',
  success: 'var(--status-online)',
  warning: 'var(--status-warning)',
  error: 'var(--status-error)',
};
const TYPE_BG: Record<string, string> = {
  info: 'rgba(59,130,246,0.12)',
  success: 'var(--status-online-bg)',
  warning: 'var(--status-warning-bg)',
  error: 'var(--status-error-bg)',
};

function formatTime(d: Date) {
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
  placeholder: string;
}

function FilterSelect({ label, value, options, onChange, placeholder }: FilterSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);
  const displayValue = selectedOption ? selectedOption.name : placeholder;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="filter-dropdown" ref={containerRef} onClick={() => setIsOpen(!isOpen)}>
      <div className="filter-label">{label}</div>
      <div className="filter-value">
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 8 }}>
          {displayValue}
        </span>
        <span className="filter-chevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', display: 'flex' }}>
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {isOpen && (
        <div className="filter-menu">
          <button 
            className={`filter-menu-item ${!value ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
          >
            {placeholder}
            {!value && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
          {options.map(opt => (
            <button 
              key={opt.id}
              className={`filter-menu-item ${value === opt.id ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onChange(opt.id); setIsOpen(false); }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 8 }}>{opt.name}</span>
              {value === opt.id && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, markAllRead, clearNotification, unreadCount, companies, buildings, places } = useApp();
  const t = useTranslation();

  const [companyFilter, setCompanyFilter] = React.useState<string>('');
  const [buildingFilter, setBuildingFilter] = React.useState<string>('');
  const [placeFilter, setPlaceFilter] = React.useState<string>('');

  const filteredNotifications = notifications.filter(n => {
    if (companyFilter && n.companyId !== companyFilter) return false;
    if (buildingFilter && n.buildingId !== buildingFilter) return false;
    if (placeFilter && n.placeId !== placeFilter) return false;
    return true;
  });

  const byType = (type: string) => filteredNotifications.filter(n => n.type === type);

  const companyBuildings = buildings.filter(b => !companyFilter || b.companyId === companyFilter);
  const buildingPlaces = places.filter(p => !buildingFilter || p.buildingId === buildingFilter);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="page-title">{t.notifications.title}</div>
          <div className="page-subtitle">{filteredNotifications.length}/{notifications.length} {t.notifications.total} · {unreadCount} {t.notifications.unread}</div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Compact Filters */}
          <div style={{ display: 'flex', gap: 10 }}>
            <FilterSelect 
              label="Company"
              value={companyFilter}
              options={companies.map(c => ({ id: c.companyId, name: c.name }))}
              placeholder="All Companies"
              onChange={(val: string) => { setCompanyFilter(val); setBuildingFilter(''); setPlaceFilter(''); }}
            />

            <FilterSelect 
              label="Building"
              value={buildingFilter}
              options={companyBuildings.map(b => ({ id: b.buildingId, name: b.name }))}
              placeholder="All Buildings"
              onChange={(val: string) => { setBuildingFilter(val); setPlaceFilter(''); }}
            />

            <FilterSelect 
              label="Room"
              value={placeFilter}
              options={buildingPlaces.map(p => ({ id: p.placeId, name: p.name }))}
              placeholder="All Rooms"
              onChange={(val: string) => setPlaceFilter(val)}
            />
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 4px' }} />

          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead} style={{ height: 42 }}>{t.notifications.markAllRead}</button>
          )}
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['error', 'warning', 'success', 'info'] as const).map(type => (
          <div key={type} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: TYPE_BG[type],
            color: TYPE_COLORS[type],
            fontSize: 12, fontWeight: 600,
            border: `1px solid ${TYPE_COLORS[type]}33`,
          }}>
            {ICONS[type]}
            {byType(type).length} {type}
          </div>
        ))}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="empty-state">
          <IconBellOff />
          <div className="empty-state-title">{t.notifications.noNotifs}</div>
          <div className="empty-state-desc">{t.notifications.noNotifsDesc}</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>{t.notifications.event}</th>
                <th>{t.notifications.message}</th>
                <th>{t.notifications.time}</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((n: Notification) => (
                <tr key={n.id} style={{ opacity: n.read ? 0.6 : 1 }}>
                  <td>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: TYPE_BG[n.type], color: TYPE_COLORS[n.type],
                    }}>
                      {ICONS[n.type]}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{n.message}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{formatTime(n.timestamp)}</td>
                  <td>
                    <div style={{ position: 'relative', width: 28, height: 28, display: 'inline-block' }}>
                      <button
                        className="btn-icon danger"
                        style={{ width: 28, height: 28, borderRadius: 6 }}
                        onClick={() => clearNotification(n.id)}
                        title="Dismiss"
                      >
                        <IconTrash />
                      </button>
                      {!n.read && (
                        <span style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 7, height: 7, borderRadius: '50%',
                          background: 'var(--belimo-orange)',
                          pointerEvents: 'none',
                        }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
