'use client';

import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Notification } from '../context/AppContext';

const ICONS = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
};

const ICON_COLORS = {
  success: 'var(--status-online)',
  error: 'var(--status-error)',
  warning: 'var(--status-warning)',
  info: '#60a5fa',
};

interface ToastItem {
  notif: Notification;
  exiting: boolean;
}

export default function ToastContainer() {
  const { notifications } = useApp();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seen = new Set<string>();

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (seen.has(latest.id)) return;
    seen.add(latest.id);

    setToasts(prev => [...prev, { notif: latest, exiting: false }]);

    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.notif.id === latest.id ? { ...t, exiting: true } : t)
      );
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.notif.id !== latest.id));
      }, 350);
    }, 4500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(({ notif, exiting }) => (
        <div
          key={notif.id}
          className={`toast ${notif.type}`}
          style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? 'translateX(100%)' : 'translateX(0)',
            transition: 'all 0.35s ease',
          }}
        >
          <span style={{ color: ICON_COLORS[notif.type], flexShrink: 0 }}>
            {ICONS[notif.type]}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{notif.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{notif.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
