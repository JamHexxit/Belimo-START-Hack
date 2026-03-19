'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DeviceCard from '../components/card';
import { addDevice } from '../lib/api';

const IconPlus = () => <svg style={{ transform: 'translateY(1.5px)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconEmpty = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;


export default function DeviceManagerPage() {
  const { devices, rooms, refreshDevices, addNotification } = useApp();
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#search-')) {
      return decodeURIComponent(window.location.hash.replace('#search-', ''));
    }
    return '';
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ influxUrl: '', influxToken: '', org: '', bucket: '', roomId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = devices.filter(d =>
    d.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    d.org.toLowerCase().includes(search.toLowerCase()) ||
    d.bucket.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.influxUrl || !form.influxToken || !form.org || !form.bucket) {
      setFormError('URL, Token, Org, and Bucket are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const result = await addDevice({
        influxUrl: form.influxUrl,
        influxToken: form.influxToken,
        org: form.org,
        bucket: form.bucket,
        roomId: form.roomId || undefined,
      });
      addNotification('success', 'Device Added', `New device registered: ${result.deviceId.slice(0, 8)}…`);
      setShowAddModal(false);
      setForm({ influxUrl: '', influxToken: '', org: '', bucket: '', roomId: '' });
      await refreshDevices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFormError(msg);
      addNotification('error', 'Add Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Device Manager</div>
          <div className="page-subtitle">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <IconSearch />
            <input
              placeholder="Search devices…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <IconPlus /> Add Device
          </button>
        </div>
      </div>

      {/* Device Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '60px 40px', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-card)' }}>
          <IconEmpty />
          <div className="empty-state-title">{search ? 'No matching devices' : 'No devices yet'}</div>
          <div className="empty-state-desc">
            {search ? 'Try a different search term.' : 'Add your first Belimo sensor device to get started.'}
          </div>
          {!search && (
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowAddModal(true)}>
              <IconPlus /> Add First Device
            </button>
          )}
        </div>
      ) : (
        <div className="grid-devices">
          {filtered.map(device => (
            <DeviceCard
              key={device.deviceId}
              device={device}
              rooms={rooms}
              onDeleted={refreshDevices}
            />
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add New Device</span>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><IconX /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--belimo-orange-light)', fontSize: 12, color: 'var(--belimo-orange)', borderLeft: '3px solid var(--belimo-orange)' }}>
                  Connect a Belimo sensor via its InfluxDB data source.
                </div>
                <div className="form-group">
                  <label className="form-label">InfluxDB URL *</label>
                  <input className="form-input" placeholder="http://localhost:8086" value={form.influxUrl} onChange={e => setForm(f => ({ ...f, influxUrl: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">API Token *</label>
                  <input className="form-input" type="password" placeholder="your-influx-token" value={form.influxToken} onChange={e => setForm(f => ({ ...f, influxToken: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Organization *</label>
                    <input className="form-input" placeholder="my-org" value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bucket *</label>
                    <input className="form-input" placeholder="actuator-data" value={form.bucket} onChange={e => setForm(f => ({ ...f, bucket: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to Room (optional)</label>
                  <select className="form-select" value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}>
                    <option value="">— No room —</option>
                    {rooms.map(r => <option key={r.roomId} value={r.roomId}>{r.name}</option>)}
                  </select>
                </div>
                {formError && (
                  <div style={{ color: 'var(--status-error)', fontSize: 12, background: 'var(--status-error-bg)', padding: '8px 12px' }}>
                    {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <IconPlus />}
                  {submitting ? 'Adding…' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
