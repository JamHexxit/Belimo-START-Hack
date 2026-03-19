'use client';

import { useState, useEffect } from 'react';
import { Device, Room, DeviceInfo, getDeviceInfo, deleteDevice, updateDevice, isDeviceOnline } from '../lib/api';
import { useApp } from '../context/AppContext';

// Icons
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCPU = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>;
const IconData = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconHome = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconWifi = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>;
const IconChevron = ({ up }: { up: boolean }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>;

function shortId(id: string) { return id.slice(0, 8) + '…'; }

interface DeviceCardProps {
  device: Device;
  rooms: Room[];
  onDeleted: () => void;
  onEdit?: (device: Device) => void;
}

export default function DeviceCard({ device, rooms, onDeleted, onEdit }: DeviceCardProps) {
  const { addNotification, refreshDevices } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(device.roomId || '');
  const [updatingRoom, setUpdatingRoom] = useState(false);

  // New state for dynamic status
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const room = rooms.find(r => r.roomId === device.roomId);

  // ── Fetch device status on mount and interval
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const isOnline = await isDeviceOnline(device.deviceId);
        if (isMounted) {
          setStatus(isOnline ? 'online' : 'offline');
        }
      } catch (err) {
        if (isMounted) setStatus('offline');
      }
    };

    // Check immediately
    checkStatus();

    // Poll status every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [device.deviceId]);

  // ── Fetch last telemetry (GET /api/devices/:id/getInformations)
  const handleExpandToggle = async () => {
    if (!expanded && !deviceInfo) {
      setLoadingData(true);
      try {
        const info = await getDeviceInfo(device.deviceId);
        setDeviceInfo(info);
      } catch {
        addNotification('warning', 'Query Failed', `No telemetry for ${shortId(device.deviceId)}`);
        setDeviceInfo([]);
      } finally {
        setLoadingData(false);
      }
    }
    setExpanded(v => !v);
  };

  // ── Delete device (DELETE /api/devices/:id)
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove device ${shortId(device.deviceId)}?`)) return;
    setDeleting(true);
    try {
      await deleteDevice(device.deviceId);
      addNotification('success', 'Device Removed', `Device ${shortId(device.deviceId)} removed.`);
      onDeleted();
    } catch {
      addNotification('error', 'Delete Failed', 'Could not remove the device.');
      setDeleting(false);
    }
  };

  // ── Update room (PATCH /api/devices/:id)
  const handleRoomChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoom = e.target.value;
    setSelectedRoom(newRoom);
    setUpdatingRoom(true);
    try {
      await updateDevice(device.deviceId, { roomId: newRoom || null });
      const roomName = newRoom ? rooms.find(r => r.roomId === newRoom)?.name ?? newRoom : 'No Room';
      addNotification('success', 'Room Updated', `Device assigned to ${roomName}`);
      await refreshDevices();
    } catch {
      addNotification('error', 'Update Failed', 'Could not update room assignment.');
    } finally {
      setUpdatingRoom(false);
    }
  };

  // ── Render telemetry rows (from getInformations)
  const renderTelemetry = () => {
    if (!deviceInfo || deviceInfo.length === 0) {
      return <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0', textAlign: 'center' }}>No telemetry data in last 10 min</div>;
    }

    const fields = new Map<string, { value: unknown; time?: string }>();
    for (const row of deviceInfo) {
      if (row._field && row._value !== undefined) {
        fields.set(String(row._field), { value: row._value, time: row._time ? String(row._time) : undefined });
      }
    }

    if (fields.size === 0) {
      return <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0', textAlign: 'center' }}>No structured fields found</div>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginTop: 10 }}>
          {Array.from(fields.entries()).map(([field, data]) => (
              <div key={field} className="device-metric">
                <div className="device-metric-label">{field.replace(/_/g, ' ')}</div>
                <div className="device-metric-value">
                  {typeof data.value === 'number' ? data.value.toFixed(2) : String(data.value)}
                </div>
                {data.time && (
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(data.time).toLocaleTimeString()}
                    </div>
                )}
              </div>
          ))}
        </div>
    );
  };

  // Determine the display string for the status badge
  const statusText = status === 'checking' ? 'Checking...' : status === 'online' ? 'Online' : 'Offline';

  return (
      <div className={`device-card ${status === 'checking' ? 'offline' : status}`}>
        {/* Header */}
        <div className="device-header">
          <div>
            <div className="device-name">
              <IconCPU />
              Belimo Sensor
            </div>
            <div className="device-id">{shortId(device.deviceId)}</div>
          </div>
          <span className={`device-status-badge ${status === 'checking' ? 'offline' : status}`}>
          {status !== 'checking' && <IconWifi />}
            {statusText}
        </span>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div className="device-metric">
            <div className="device-metric-label">Org</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.org}</div>
          </div>
          <div className="device-metric">
            <div className="device-metric-label">Bucket</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.bucket}</div>
          </div>
        </div>

        {/* Room Assignment — PATCH /api/devices/:id */}
        <div style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            Assign Room
            {updatingRoom && <span className="loading-spinner" style={{ width: 10, height: 10 }} />}
          </label>
          <select
              className="form-select"
              style={{ fontSize: 12, padding: '6px 10px' }}
              value={selectedRoom}
              onChange={handleRoomChange}
              onClick={e => e.stopPropagation()}
              disabled={updatingRoom}
          >
            <option value="">— Unassigned —</option>
            {rooms.map(r => (
                <option key={r.roomId} value={r.roomId}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Footer */}
        <div className="device-footer">
          <div className="device-room-tag">
            <IconHome />
            {room ? room.name : 'Unassigned'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onEdit && (
              <button className="btn-icon" title="Edit Connection" onClick={() => onEdit(device)}>
                <IconEdit />
              </button>
            )}
            {/* GET /api/devices/:id/getInformations */}
            <button className="btn-icon" title="View live telemetry" onClick={handleExpandToggle}>
              {loadingData ? <span className="loading-spinner" /> : expanded ? <><IconData /> <IconChevron up={true} /></> : <><IconData /> <IconChevron up={false} /></>}
            </button>
            {/* DELETE /api/devices/:id */}
            <button className="btn-icon danger" title="Remove device" onClick={handleDelete} disabled={deleting}>
              {deleting ? <span className="loading-spinner" /> : <IconTrash />}
            </button>
          </div>
        </div>

        {/* Expanded Telemetry */}
        {expanded && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div className="section-title" style={{ fontSize: 10, marginBottom: 6 }}>
                Live Telemetry · last 10 min
              </div>
              {renderTelemetry()}
              <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                <span style={{ fontWeight: 600 }}>URL:</span> {device.url}
              </div>
            </div>
        )}
      </div>
  );
}