'use client';

import { useApp, Notification } from '../context/AppContext';

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

export default function NotificationsPage() {
  const { notifications, markAllRead, clearNotification, unreadCount } = useApp();

  const byType = (type: string) => notifications.filter(n => n.type === type);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">{notifications.length} total · {unreadCount} unread</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead}>Mark all read</button>
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
          <div className="empty-state-title">No notifications</div>
          <div className="empty-state-desc">System events and alerts will appear here.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Event</th>
                <th>Message</th>
                <th>Time</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n: Notification) => (
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
                    {!n.read && (
                      <span style={{
                        display: 'inline-block',
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--belimo-orange)',
                        marginLeft: 6, verticalAlign: 'middle',
                      }} />
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{n.message}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{formatTime(n.timestamp)}</td>
                  <td>
                    <button
                      className="btn-icon danger"
                      style={{ width: 28, height: 28, borderRadius: 6 }}
                      onClick={() => clearNotification(n.id)}
                      title="Dismiss"
                    >
                      <IconTrash />
                    </button>
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
