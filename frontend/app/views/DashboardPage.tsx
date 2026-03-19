'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { isDeviceOnline } from '../lib/api';

const IconDevices = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
const IconOnline = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>;
const IconRoom = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;

type Page = 'dashboard' | 'devices' | 'rooms' | 'notifications';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({ onNavigate }: DashboardProps) {
  const { devices, rooms, notifications } = useApp();

  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const checkStatuses = async () => {
      if (devices.length === 0) return;
      const statuses: Record<string, boolean> = {};
      await Promise.all(devices.map(async d => {
        statuses[d.deviceId] = await isDeviceOnline(d.deviceId);
      }));
      if (active) {
        setDeviceStatuses(statuses);
      }
    };
    checkStatuses();
    return () => { active = false; };
  }, [devices]);

  const totalDevices = devices.length;
  const onlineCount = Object.keys(deviceStatuses).length === devices.length 
    ? Object.values(deviceStatuses).filter(Boolean).length 
    : '...';

  const totalRooms = rooms.length;
  const unread = notifications.filter(n => !n.read).length;
  const errors = notifications.filter(n => n.type === 'error' && !n.read).length;

  const systemOk = errors === 0;
  const statusText = totalDevices === 0
    ? 'No devices connected'
    : errors > 0
    ? `${errors} error${errors > 1 ? 's' : ''} detected`
    : 'All systems operational';

  return (
    <div>
      {/* Global Status Banner */}
      <div style={{
        background: systemOk
          ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.03))',
        border: `1px solid ${systemOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)'}`,
        padding: '20px 24px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 48,
          height: 48,
          background: systemOk ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: systemOk ? 'var(--status-online)' : 'var(--status-error)',
          flexShrink: 0,
        }}>
          <IconActivity />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Global System Status
          </div>
          <div style={{ fontSize: 13, color: systemOk ? 'var(--status-online)' : 'var(--status-error)', marginTop: 3 }}>
            {statusText}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          padding: '6px 12px',
          background: systemOk ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: systemOk ? 'var(--status-online)' : 'var(--status-error)',
        }}>
          <span style={{ width: 8, height: 8, background: 'currentColor', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          {systemOk ? 'HEALTHY' : 'DEGRADED'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-stats" style={{ marginBottom: 28 }}>
        <div className="stat-card" onClick={() => onNavigate('devices')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon orange"><IconDevices /></div>
          <div>
            <div className="stat-value">{totalDevices}</div>
            <div className="stat-label">Total Devices</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('devices')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon green"><IconOnline /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--status-online)' }}>{onlineCount}</div>
            <div className="stat-label">Online</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('rooms')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><IconRoom /></div>
          <div>
            <div className="stat-value">{totalRooms}</div>
            <div className="stat-label">Rooms</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('notifications')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon red"><IconAlert /></div>
          <div>
            <div className="stat-value" style={{ color: errors > 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>{unread}</div>
            <div className="stat-label">Unread Alerts</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Devices */}
        <div className="card">
          <div className="section-title">Recent Devices</div>
          {devices.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
              No devices registered yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {devices.slice(0, 5).map(d => {
                const isOnline = deviceStatuses[d.deviceId];
                const statusColor = isOnline === undefined ? 'var(--text-muted)' : (isOnline ? 'var(--status-online)' : 'var(--status-error)');
                return (
                  <div 
                    key={d.deviceId}
                    onClick={() => {
                      window.location.hash = `#search-${encodeURIComponent(d.deviceId)}`;
                      onNavigate('devices');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: statusColor, display: 'flex' }}>
                      {isOnline === undefined ? <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <IconOnline />}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Belimo Sensor</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.deviceId.slice(0, 12)}…</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.bucket}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="section-title">Recent Alerts</div>
          {notifications.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
              No notifications
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.slice(0, 5).map(n => (
                <div 
                  key={n.id} 
                  onClick={() => onNavigate('notifications')}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    opacity: n.read ? 0.55 : 1,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    color: n.type === 'error' ? 'var(--status-error)' : n.type === 'warning' ? 'var(--status-warning)' : n.type === 'success' ? 'var(--status-online)' : '#60a5fa',
                    fontSize: 11,
                    marginTop: 1,
                  }}>●</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{n.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
