'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createRoom, updateRoom, deleteRoom } from '../lib/api';
import { useTranslation } from '../lib/i18n';

// Icons
const IconPlus = () => <svg style={{ transform: 'translateY(1.5px)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconHome = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

interface EditState {
  roomId: string;
  name: string;
  threshold: string;
}

export default function RoomsPage() {
  const { rooms, devices, refreshRooms, refreshDevices, addNotification } = useApp();
  const t = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [form, setForm] = useState({ name: '', threshold: '0' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.roomId.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditState(null);
    setForm({ name: '', threshold: '0' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (roomId: string, name: string, threshold: number) => {
    setEditState({ roomId, name, threshold: String(threshold) });
    setForm({ name, threshold: String(threshold) });
    setFormError('');
    setShowModal(true);
  };

  // POST /api/rooms (create or update via roomId)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Room name is required.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      if (editState) {
        // Update existing — POST /api/rooms with roomId
        await updateRoom(editState.roomId, form.name.trim(), Number(form.threshold));
        addNotification('success', 'Room Updated', `Room "${form.name}" has been updated.`);
      } else {
        // Create new — POST /api/rooms without roomId
        await createRoom(form.name.trim(), Number(form.threshold));
        addNotification('success', 'Room Created', `Room "${form.name}" has been created.`);
      }
      setShowModal(false);
      await refreshRooms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE /api/rooms/:roomId
  const handleDelete = async (roomId: string, name: string) => {
    if (!confirm(`Delete room "${name}"? Assigned sensors will be unassigned.`)) return;
    try {
      await deleteRoom(roomId);
      addNotification('info', 'Room Deleted', `Room "${name}" removed.`);
      await Promise.all([refreshRooms(), refreshDevices()]);
    } catch {
      addNotification('error', 'Delete Failed', 'Could not delete the room.');
    }
  };

  const getDeviceCount = (roomId: string) => devices.filter(d => d.roomId === roomId).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{t.rooms.title}</div>
          <div className="page-subtitle">{rooms.length} room{rooms.length !== 1 ? 's' : ''} {t.rooms.configured}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <IconSearch />
            <input
              placeholder={t.rooms.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <IconPlus /> {t.rooms.addRoom}
          </button>
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '60px 40px', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-card)' }}>
          <IconHome />
          <div className="empty-state-title">{search ? t.rooms.noMatch : t.rooms.noRooms}</div>
          <div className="empty-state-desc">
            {search ? t.rooms.noMatchDesc : t.rooms.noRoomsDesc}
          </div>
          {!search && (
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={openCreate}>
              <IconPlus /> {t.rooms.createFirst}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filteredRooms.map(room => {
            const count = getDeviceCount(room.roomId);
            const devicesInRoom = devices.filter(d => d.roomId === room.roomId);
            return (
              <div className="card room-card" key={room.roomId} style={{ padding: 20, position: 'relative', overflow: 'hidden', borderRadius: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{room.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{room.roomId.slice(0, 14)}…</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Edit — POST /api/rooms (with roomId) */}
                      <button className="btn-icon" title="Edit room" onClick={() => openEdit(room.roomId, room.name, room.threshold)}>
                        <IconEdit />
                      </button>
                      {/* Delete — DELETE /api/rooms/:id */}
                      <button className="btn-icon danger" title="Delete room" onClick={() => handleDelete(room.roomId, room.name)}>
                        <IconTrash />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div className="device-metric">
                      <div className="device-metric-label">{t.rooms.sensors}</div>
                      <div className="device-metric-value">{count}</div>
                    </div>
                    <div className="device-metric">
                      <div className="device-metric-label">{t.rooms.threshold}</div>
                      <div className="device-metric-value">{room.threshold}<span className="device-metric-unit"> %</span></div>
                    </div>
                  </div>

                  {devicesInRoom.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        {t.rooms.assignedSensors}
                      </div>
                      {devicesInRoom.map(d => (
                        <div key={d.deviceId} style={{
                          fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace',
                          padding: '4px 8px', background: 'var(--bg-primary)',
                          marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <span style={{ color: 'var(--status-online)', fontSize: 8 }}>●</span>
                          {d.deviceId.slice(0, 18)}…
                          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{d.bucket}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Room Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editState ? t.rooms.editModalTitle : t.rooms.addModalTitle}</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}><IconX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t.rooms.nameLabel}</label>
                  <input
                    className="form-input"
                    placeholder={t.rooms.namePlaceholder}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.rooms.thresholdLabel}</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0"
                    min="0" max="100"
                    value={form.threshold}
                    onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t.rooms.thresholdDesc}
                  </div>
                </div>
                {formError && (
                  <div style={{ color: 'var(--status-error)', fontSize: 12, background: 'var(--status-error-bg)', padding: '8px 12px' }}>
                    {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.devices.cancel}</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : editState ? <IconEdit /> : <IconPlus />}
                  {submitting ? t.devices.saving : editState ? t.devices.saveBtn : t.rooms.createBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
