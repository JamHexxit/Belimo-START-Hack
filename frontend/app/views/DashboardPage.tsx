'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  createCompany, updateCompany, deleteCompany,
  createBuilding, updateBuilding, deleteBuilding,
  createPlace, updatePlace, deletePlace,
  addDevice, updateDevice, deleteDevice, isDeviceOnline,
  Device
} from '../lib/api';
import DeviceCard from '../components/card';
import { useTranslation } from '../lib/i18n';
const IconDevices = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
const IconOnline = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>;
const IconRoom = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconEmpty = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
const IconCompany = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>;
const IconBuilding = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="10" width="20" height="12" rx="2"/><path d="M6 10V4a2 2 0 012-2h8a2 2 0 012 2v6"/></svg>;
const IconPlace = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;


import { Page } from '../lib/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({ onNavigate }: DashboardProps) {
  const { 
    devices, places, notifications,
    selectedCompanyId, setSelectedCompanyId,
    selectedBuildingId, setSelectedBuildingId,
    selectedPlaceId, setSelectedPlaceId,
    companies, buildings, refreshHierarchy, refreshDevices
  } = useApp();
  const t = useTranslation();

  const [activeModal, setActiveModal] = useState<{ type: 'company' | 'building' | 'place' | 'sensor', mode: 'add' | 'edit', id?: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [sensorForm, setSensorForm] = useState({ url: 'http://localhost:8086', token: '', org: '', bucket: '' });
  const [deviceSearch, setDeviceSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. Filtering Logic (for final dashboard view)
  const filteredDevices = devices.filter(d => 
    d.placeId === selectedPlaceId && 
    (d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || d.deviceId.toLowerCase().includes(deviceSearch.toLowerCase()))
  );
  const filteredPlaces = places.filter(p => p.buildingId === selectedBuildingId);
  const filteredBuildings = buildings.filter(b => b.companyId === selectedCompanyId);

  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const checkStatuses = async () => {
      if (filteredDevices.length === 0) return;
      const statuses: Record<string, boolean> = {};
      await Promise.all(filteredDevices.map(async d => {
        statuses[d.deviceId] = await isDeviceOnline(d.deviceId);
      }));
      if (active) {
        setDeviceStatuses(statuses);
      }
    };
    checkStatuses();
    return () => { active = false; };
  }, [filteredDevices]);

  const handleAdd = async () => {
    if (!newName.trim() || !activeModal) return;
    setSubmitting(true);
    try {
      const type = activeModal.type;
      if (activeModal.mode === 'add') {
        if (type === 'company') {
          const res = await createCompany(newName.trim());
          setSelectedCompanyId(res.companyId);
        } else if (type === 'building') {
          const res = await createBuilding(newName.trim(), selectedCompanyId!);
          setSelectedBuildingId(res.buildingId);
        } else if (type === 'place') {
          const res = await createPlace({ name: newName.trim(), buildingId: selectedBuildingId! });
          setSelectedPlaceId(res.placeId);
        } else if (type === 'sensor') {
          if (!sensorForm.url || !sensorForm.token || !sensorForm.org || !sensorForm.bucket) {
            setFormError('All asterisk (*) fields are required.');
            setSubmitting(false);
            return;
          }
          await addDevice({
            name: newName.trim(),
            influxUrl: sensorForm.url,
            influxToken: sensorForm.token,
            org: sensorForm.org,
            bucket: sensorForm.bucket,
            placeId: selectedPlaceId!
          });
        }
      } else if (activeModal.mode === 'edit' && activeModal.id) {
        if (type === 'company') await updateCompany(activeModal.id, newName.trim());
        else if (type === 'building') await updateBuilding(activeModal.id, { name: newName.trim() });
        else if (type === 'place') await updatePlace(activeModal.id, { name: newName.trim() });
        else if (type === 'sensor') {
          await updateDevice(activeModal.id, {
            name: newName.trim(),
            influxUrl: sensorForm.url,
            influxToken: sensorForm.token || undefined,
            org: sensorForm.org,
            bucket: sensorForm.bucket,
            placeId: selectedPlaceId!
          });
        }
      }
      setActiveModal(null);
      setNewName('');
      setSensorForm({ url: 'http://localhost:8086', token: '', org: '', bucket: '' });
      setFormError('');
      await Promise.all([refreshHierarchy(), refreshDevices()]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: 'company' | 'building' | 'place', id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${type} "${name}"? This action cannot be undone.`)) return;
    try {
      if (type === 'company') {
        await deleteCompany(id);
        if (selectedCompanyId === id) { setSelectedCompanyId(null); setSelectedBuildingId(null); setSelectedPlaceId(null); }
      } else if (type === 'building') {
        await deleteBuilding(id);
        if (selectedBuildingId === id) { setSelectedBuildingId(null); setSelectedPlaceId(null); }
      } else if (type === 'place') {
        await deletePlace(id);
        if (selectedPlaceId === id) { setSelectedPlaceId(null); }
      }
      await Promise.all([refreshHierarchy(), refreshDevices()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete sensor "${name}"?`)) return;
    try {
      await deleteDevice(id);
      await refreshDevices();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditSensor = (d: Device) => {
    setNewName(d.name);
    setSensorForm({ url: d.url, token: '', org: d.org, bucket: d.bucket });
    setActiveModal({ type: 'sensor', mode: 'edit', id: d.deviceId });
  };

  // 3. Stats Calculation for current level
  const getLevelStats = () => {
    let levelDevices = [];
    if (selectedPlaceId) {
      levelDevices = devices.filter(d => d.placeId === selectedPlaceId);
    } else if (selectedBuildingId) {
      const bPlaces = places.filter(p => p.buildingId === selectedBuildingId!).map(p => p.placeId);
      levelDevices = devices.filter(d => d.placeId && bPlaces.includes(d.placeId));
    } else if (selectedCompanyId) {
      const cBuildings = buildings.filter(b => b.companyId === selectedCompanyId!).map(b => b.buildingId);
      const cPlaces = places.filter(p => cBuildings.includes(p.buildingId)).map(p => p.placeId);
      levelDevices = devices.filter(d => d.placeId && cPlaces.includes(d.placeId));
    } else {
      levelDevices = devices;
    }

    const online = levelDevices.filter(d => deviceStatuses[d.deviceId]).length;
    return {
      total: levelDevices.length,
      online: Object.keys(deviceStatuses).length > 0 ? online : '...',
      alerts: notifications.filter(n => !n.read && n.type === 'error').length
    };
  };

  const stats = getLevelStats();

  const totalDevices = filteredDevices.length;
  const onlineCount = Object.keys(deviceStatuses).length === filteredDevices.length 
    ? Object.values(deviceStatuses).filter(Boolean).length 
    : '...';

  const totalRooms = filteredPlaces.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalErrors = notifications.filter(n => n.type === 'error' && !n.read).length;
  
  const currentCompany = companies.find(c => c.companyId === selectedCompanyId);
  const currentBuilding = buildings.find(b => b.buildingId === selectedBuildingId);
  const currentPlace = places.find(p => p.placeId === selectedPlaceId);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Context Breadcrumbs */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        <button 
          onClick={() => { setSelectedCompanyId(null); setSelectedBuildingId(null); setSelectedPlaceId(null); }}
          className={`breadcrumb-item ${!selectedCompanyId ? 'active' : ''}`}
        >
          Customers
        </button>
        {selectedCompanyId && (
          <>
            <span className="breadcrumb-sep">/</span>
            <button 
              onClick={() => { setSelectedBuildingId(null); setSelectedPlaceId(null); }}
              className={`breadcrumb-item ${selectedCompanyId && !selectedBuildingId ? 'active' : ''}`}
            >
              {currentCompany?.name}
            </button>
          </>
        )}
        {selectedBuildingId && (
          <>
            <span className="breadcrumb-sep">/</span>
            <button 
              onClick={() => setSelectedPlaceId(null)}
              className={`breadcrumb-item ${selectedBuildingId && !selectedPlaceId ? 'active' : ''}`}
            >
              {currentBuilding?.name}
            </button>
          </>
        )}
        {selectedPlaceId && (
          <>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item active">{currentPlace?.name}</span>
          </>
        )}
      </div>

      {/* Level-Wide Stats (Visible once a Company or Building is selected) */}
      {(selectedCompanyId || selectedBuildingId) && (
        <div className="grid-stats" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-icon orange"><IconDevices /></div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Sensors</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><IconOnline /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--status-online)' }}>{stats.online}</div>
              <div className="stat-label">Online</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><IconAlert /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--status-error)' }}>{stats.alerts}</div>
              <div className="stat-label">Alerts</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Company Selection */}
      {!selectedCompanyId && (
        <div className="selection-grid">
           {companies.map(c => (
              <div key={c.companyId} className="selection-card" onClick={() => setSelectedCompanyId(c.companyId)}>
                <div className="selection-actions">
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setActiveModal({ type: 'company', mode: 'edit', id: c.companyId }); setNewName(c.name); }}><IconEdit /></button>
                  <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete('company', c.companyId, c.name); }}><IconTrash /></button>
                </div>
                <div className="selection-icon"><IconCompany /></div>
                <div className="selection-name">{c.name}</div>
                <div className="selection-meta">Buildings: {buildings.filter(b => b.companyId === c.companyId).length}</div>
              </div>
           ))}
           <div className="selection-card add" onClick={() => setActiveModal({ type: 'company', mode: 'add' })}>
              <div className="selection-icon">+</div>
              <div className="selection-name">Add Customer</div>
           </div>
        </div>
      )}

      {/* 2. Building Selection */}
      {selectedCompanyId && !selectedBuildingId && (
        <div className="selection-grid">
           {filteredBuildings.map(b => (
              <div key={b.buildingId} className="selection-card" onClick={() => setSelectedBuildingId(b.buildingId)}>
                <div className="selection-actions">
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setActiveModal({ type: 'building', mode: 'edit', id: b.buildingId }); setNewName(b.name); }}><IconEdit /></button>
                  <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete('building', b.buildingId, b.name); }}><IconTrash /></button>
                </div>
                <div className="selection-icon"><IconBuilding /></div>
                <div className="selection-name">{b.name}</div>
                <div className="selection-meta">Places: {places.filter(p => p.buildingId === b.buildingId).length}</div>
              </div>
           ))}
           <div className="selection-card add" onClick={() => setActiveModal({ type: 'building', mode: 'add' })}>
              <div className="selection-icon">+</div>
              <div className="selection-name">Add Building / Location</div>
           </div>
        </div>
      )}

      {/* 3. Place Selection */}
      {selectedBuildingId && !selectedPlaceId && (
        <div className="selection-grid">
           {filteredPlaces.map(p => (
              <div key={p.placeId} className="selection-card" onClick={() => setSelectedPlaceId(p.placeId)}>
                <div className="selection-actions">
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setActiveModal({ type: 'place', mode: 'edit', id: p.placeId }); setNewName(p.name); }}><IconEdit /></button>
                  <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete('place', p.placeId, p.name); }}><IconTrash /></button>
                </div>
                <div className="selection-icon"><IconPlace /></div>
                <div className="selection-name">{p.name}</div>
                <div className="selection-meta">Devices: {devices.filter(d => d.placeId === p.placeId).length}</div>
              </div>
           ))}
           <div className="selection-card add" onClick={() => setActiveModal({ type: 'place', mode: 'add' })}>
              <div className="selection-icon">+</div>
              <div className="selection-name">Add Room / Place</div>
           </div>
        </div>
      )}

      {/* 4. Final Dashboard (Place Selected) */}
      {selectedPlaceId && (
        <>
          <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(255,102,0,0.05), rgba(255,102,0,0.02))', border: '1px solid rgba(255,102,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--belimo-orange)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Current Context</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{currentPlace?.name}</div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedPlaceId(null)}
              >
                Switch Place
              </button>
            </div>
          </div>

          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 0 }}>Sensors Management</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredDevices.length} sensor{filteredDevices.length !== 1 ? 's' : ''} in this place</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="search-bar" style={{ width: 200, height: 32 }}>
                <IconSearch />
                <input 
                  placeholder="Search sensors..." 
                  value={deviceSearch} 
                  onChange={e => setDeviceSearch(e.target.value)}
                />
                {deviceSearch && <button onClick={() => setDeviceSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><IconX /></button>}
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => { setActiveModal({ type: 'sensor', mode: 'add' }); setNewName(''); setSensorForm({ url: 'http://localhost:8086', token: '', org: '', bucket: '' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32 }}
              >
                <IconPlus /> Add Sensor
              </button>
            </div>
          </div>

          {filteredDevices.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 40px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <IconEmpty />
              <div className="empty-state-title">{deviceSearch ? 'No sensors match your search' : 'No sensors in this room'}</div>
              <div className="empty-state-desc">{deviceSearch ? 'Try a different search term or clear the filter.' : 'Add your first sensor to start monitoring this location.'}</div>
              {!deviceSearch && (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: 20 }}
                  onClick={() => { setActiveModal({ type: 'sensor', mode: 'add' }); setNewName(''); setSensorForm({ url: 'http://localhost:8086', token: '', org: '', bucket: '' }); }}
                >
                  <IconPlus /> Add First Sensor
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filteredDevices.map(d => (
                <DeviceCard 
                  key={d.deviceId} 
                  device={d} 
                  places={places} 
                  onDeleted={refreshDevices}
                  onEdit={() => openEditSensor(d)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Unified Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => { setActiveModal(null); setNewName(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
                <span className="modal-title">
                  {activeModal.mode === 'add' ? 'New' : 'Rename'} {activeModal.type.charAt(0).toUpperCase() + activeModal.type.slice(1)}
                </span>
             </div>
             <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{activeModal.type === 'sensor' ? 'Sensor Name' : 'Name'}</label>
                  <input 
                    className="form-input" 
                    autoFocus 
                    placeholder="Enter name..." 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && activeModal.type !== 'sensor' && handleAdd()}
                  />
                </div>
                {activeModal.type === 'sensor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    <div className="form-group">
                      <label className="form-label">InfluxDB URL *</label>
                      <input className="form-input" value={sensorForm.url} onChange={e => setSensorForm(f => ({...f, url: e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">API Token *</label>
                      <input className="form-input" type="password" value={sensorForm.token} onChange={e => setSensorForm(f => ({...f, token: e.target.value}))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Organization *</label>
                        <input className="form-input" value={sensorForm.org} onChange={e => setSensorForm(f => ({...f, org: e.target.value}))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bucket *</label>
                        <input className="form-input" value={sensorForm.bucket} onChange={e => setSensorForm(f => ({...f, bucket: e.target.value}))} />
                      </div>
                    </div>
                  </div>
                )}
                {formError && (
                  <div style={{ color: 'var(--status-error)', fontSize: 12, marginTop: 12, background: 'var(--status-error-bg)', padding: '8px 12px' }}>
                    {formError}
                  </div>
                )}
             </div>
             <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setActiveModal(null); setNewName(''); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>
                   {submitting ? 'Saving...' : 'Save'}
                </button>
             </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .breadcrumb-item {
          background: none;
          border: none;
          padding: 4px 8px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .breadcrumb-item:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .breadcrumb-item.active {
          color: var(--belimo-orange);
          font-weight: 700;
        }
        .breadcrumb-sep {
          opacity: 0.3;
          color: var(--text-muted);
        }
        .selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .selection-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 32px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          position: relative;
        }
        .selection-card:hover {
          transform: translateY(-4px);
          border-color: var(--belimo-orange);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        .selection-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .selection-card:hover .selection-actions {
          opacity: 1;
        }
        .btn-icon.delete:hover {
          color: var(--status-error);
        }
        .selection-card.add {
          border-style: dashed;
          background: transparent;
          justify-content: center;
        }
        .selection-icon {
          color: var(--belimo-orange);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .selection-name {
          font-weight: 700;
          font-size: 16px;
          color: var(--text-primary);
        }
        .selection-meta {
          font-size: 11px;
          color: var(--text-muted);
        }
        .list-item {
          padding: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
        }
        .list-item:hover {
          border-color: var(--belimo-orange);
        }
        .empty-muted {
          text-align: center;
          padding: 24px;
          color: var(--text-muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
