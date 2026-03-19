'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../lib/i18n';
import { createCompany, updateCompany, deleteCompany } from '../lib/api';
import { Page } from '../lib/types';

const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCompany = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;

interface CompaniesPageProps {
  onNavigate: (page: Page) => void;
}

export default function CompaniesPage({ onNavigate }: CompaniesPageProps) {
  const { companies, buildings, refreshHierarchy, setSelectedCompanyId, setSelectedBuildingId, setSelectedPlaceId } = useApp();
  const t = useTranslation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (id: string) => {
    setSelectedCompanyId(id);
    setSelectedBuildingId(null);
    setSelectedPlaceId(null);
    onNavigate('dashboard');
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

  const openEdit = (c: { companyId: string, name: string }) => {
    setEditId(c.companyId);
    setName(c.name);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditId(null);
    setName('');
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

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', width: '300px' }}>
             <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                <IconSearch />
             </span>
             <input 
               type="text" 
               placeholder={t.companies.searchPlaceholder}
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               style={{ 
                 width: '100%', 
                 padding: '10px 12px 10px 40px', 
                 background: 'var(--bg-card)', 
                 border: '1px solid var(--border-subtle)',
                 fontSize: 14,
                 color: 'var(--text-primary)'
               }}
             />
          </div>
       </div>

       <div className="selection-grid">
          {filtered.map(company => {
            const bCount = buildings.filter(b => b.companyId === company.companyId).length;
            return (
              <div key={company.companyId} className="selection-card" onClick={() => handleSelect(company.companyId)}>
                 <div className="selection-actions">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(company); }} className="btn-icon" title={t.companies.editCompany}><IconEdit /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(company.companyId, company.name); }} className="btn-icon delete" title={t.companies.deleteTitle}><IconTrash /></button>
                 </div>
                 <div className="selection-icon">
                    <IconCompany />
                 </div>
                 <div className="selection-name">{company.name}</div>
                 <div className="selection-meta">
                   {bCount} {bCount === 1 ? 'Building' : 'Buildings'}
                 </div>
              </div>
            );
          })}
          
          <div className="selection-card add" onClick={openAdd}>
             <IconPlus />
             <div style={{ marginTop: 8, fontWeight: 600 }}>{t.companies.addCompany}</div>
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
                        <label className="form-label">
                           Company Name *
                        </label>
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
         .btn-icon {
           background: none;
           border: none;
           color: var(--text-muted);
           cursor: pointer;
           padding: 6px;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: color 0.2s;
         }
         .btn-icon:hover {
           color: var(--text-primary);
           background: var(--bg-primary);
         }
         .btn-icon.delete:hover {
           color: var(--status-error);
         }
       `}</style>
    </div>
  );
}
