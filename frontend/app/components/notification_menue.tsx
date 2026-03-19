'use client';

import { useApp, Notification } from '../context/AppContext';

const IconInfo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IconWarn = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconError = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconX = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const ICON_MAP = { info: <IconInfo />, success: <IconCheck />, warning: <IconWarn />, error: <IconError /> };

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationMenuProps {
  onClose: () => void;
}

export default function NotificationMenu({ onClose }: NotificationMenuProps) {
  const { notifications, markAllRead, clearNotification, unreadCount } = useApp();

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <span className="notif-panel-title">
          Notifications {unreadCount > 0 && <span className="sidebar-badge" style={{ marginLeft: 6 }}>{unreadCount}</span>}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={markAllRead}
              style={{ fontSize: 11 }}
            >
              Mark all read
            </button>
          )}
          <button className="btn-icon" onClick={onClose}><IconX /></button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((n: Notification) => (
            <div key={n.id} className="notif-item" style={{ opacity: n.read ? 0.6 : 1 }}>
              <div className={`notif-item-icon ${n.type}`}>
                {ICON_MAP[n.type]}
              </div>
              <div className="notif-item-content">
                <div className="notif-item-title">{n.title}</div>
                <div className="notif-item-message">{n.message}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className="notif-item-time">{timeAgo(n.timestamp)}</span>
                <button
                  className="btn-icon"
                  style={{ width: 22, height: 22, borderRadius: 4, padding: 2 }}
                  onClick={() => clearNotification(n.id)}
                >
                  <IconX />
                </button>
              </div>
              {!n.read && (
                <span style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--belimo-orange)',
                  flexShrink: 0,
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
