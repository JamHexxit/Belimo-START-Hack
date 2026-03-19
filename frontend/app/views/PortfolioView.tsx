'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../lib/i18n';
import { createCompany, updateCompany, deleteCompany } from '../lib/api';

// Icons
const IconCompany = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>;
const IconAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconWarning = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconOnline = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>;
const IconPlus = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;


export function PortfolioView() {
  const { 
    companies, buildings, places, devices,
    setSelectedCompanyId, setSelectedBuildingId, setSelectedPlaceId,
    deviceHealth, deviceStatuses, refreshHierarchy
  } = useApp();
  
  const t = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    setSelectedBuildingId(null);
    setSelectedPlaceId(null);
  };

  const openAdd = () => {
    setEditId(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEdit = (c: { companyId: string, name: string }) => {
    setEditId(c.companyId);
    setName(c.name);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t.companies.deleteConfirm)) return;
    try {
      await deleteCompany(id);
      await refreshHierarchy();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateCompany(editId, name.trim());
      } else {
        await createCompany(name.trim());
      }
      await refreshHierarchy();
      setIsModalOpen(false);
      setName('');
      setEditId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="section-header" style={{ marginBottom: 24 }}>
        <h1 className="section-title" style={{ fontSize: 24, margin: 0 }}>Portfolio Overview</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Select a customer to view their facilities.</div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 20 
      }}>
        {companies.map(company => {
          const compBuildings = buildings.filter(b => b.companyId === company.companyId);
          const compPlaces = places.filter(p => compBuildings.some(b => b.buildingId === p.buildingId));
          const compDevices = devices.filter(d => compPlaces.some(p => p.placeId === d.placeId));
          
          // Calculate health aggregates for this company using the background-polled state
          let errorCount = 0;
          let warningCount = 0;
          let onlineCount = 0;

          compDevices.forEach(d => {
             const health = deviceHealth[d.deviceId];
             if (health) {
                 if (health.status === 'error') errorCount++;
                 if (health.status === 'warning') warningCount++;
             }
             if (deviceStatuses[d.deviceId]) {
                 onlineCount++;
             }
          });

          return (
            <div 
              key={company.companyId} 
              className="card portfolio-card"
              onClick={() => handleSelectCompany(company.companyId)}
            >
              <div className="portfolio-actions">
                <button onClick={(e) => { e.stopPropagation(); openEdit(company); }} className="btn-icon" title={t.companies.editCompany}><IconEdit /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(company.companyId, company.name); }} className="btn-icon delete" title={t.companies.deleteTitle}><IconTrash /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{ 
                  width: 48, height: 48, 
                  background: 'rgba(255,102,0,0.1)', 
                  color: 'var(--belimo-orange)', 
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconCompany />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {company.name}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span><strong style={{ color: 'var(--text-primary)' }}>{compBuildings.length}</strong> Buildings</span>
                    <span><strong style={{ color: 'var(--text-primary)' }}>{compDevices.length}</strong> Sensors</span>
                  </div>
                </div>
              </div>

              {/* Health Summary Bar */}
              <div style={{ 
                background: 'var(--bg-primary)', 
                borderRadius: 6, 
                padding: '12px',
                display: 'flex',
                gap: 16,
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Status</div>
                   <div style={{ fontSize: 14, fontWeight: 600, color: (errorCount === 0 && warningCount === 0) ? 'var(--status-online)' : 'var(--text-primary)' }}>
                     {errorCount > 0 ? 'Critical Attention Required' : warningCount > 0 ? 'Warnings Detected' : 'All Systems Nominal'}
                   </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--status-online)', fontSize: 13, fontWeight: 600, marginRight: 8 }} title="Online Sensors">
                    <IconOnline /> {onlineCount}/{compDevices.length}
                  </div>
                  {errorCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-error)', background: 'var(--status-error-bg)', padding: '4px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13 }}>
                      <IconAlert /> {errorCount}
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-warning)', background: 'var(--status-warning-bg)', padding: '4px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13 }}>
                      <IconWarning /> {warningCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="card portfolio-card add" onClick={openAdd}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 140, gap: 12 }}>
            <div style={{ 
              width: 56, height: 56, 
              background: 'rgba(255,102,0,0.05)', 
              color: 'var(--belimo-orange)', 
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed var(--belimo-orange)',
              opacity: 0.8
            }}>
              <IconPlus />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {t.companies.addCompany}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
           <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                 <span className="modal-title">{editId ? t.companies.editCompany : t.companies.addCompany}</span>
              </div>
              <form onSubmit={handleSubmit}>
                 <div className="modal-body">
                    <div className="form-group">
                       <label className="form-label">Company Name *</label>
                       <input 
                         type="text" 
                         className="form-input"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         autoFocus
                         placeholder="e.g. Belimo AG"
                       />
                    </div>
                 </div>
                 <div className="modal-footer">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={isSubmitting || !name.trim()} className="btn btn-primary">
                       {isSubmitting ? '...' : (editId ? 'Save' : 'Add')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <style jsx>{`
        .portfolio-card {
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-subtle);
          position: relative;
        }
        .portfolio-card:hover {
          transform: translateY(-4px);
          border-color: var(--belimo-orange);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
        .portfolio-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;
        }
        .portfolio-card:hover .portfolio-actions {
          opacity: 1;
        }
        .portfolio-card.add {
          border-style: dashed;
          background: transparent;
          opacity: 0.7;
        }
        .portfolio-card.add:hover {
          opacity: 1;
          background: rgba(255,102,0,0.02);
        }
        .btn-icon {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border-radius: 6px;
        }
        .btn-icon:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
          background: var(--bg-primary);
        }
        .btn-icon.delete:hover {
          color: var(--status-error);
          border-color: var(--status-error);
          background: var(--status-error-bg);
        }
      `}</style>
    </div>
  );
}