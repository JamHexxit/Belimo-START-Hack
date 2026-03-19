'use client';

import { useApp } from '../context/AppContext';
import { useTranslation } from '../lib/i18n';

// Icons
const IconCompany = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>;
const IconAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconWarning = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconOnline = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>;


export function PortfolioView() {
  const { 
    companies, buildings, places, devices,
    setSelectedCompanyId, setSelectedBuildingId, setSelectedPlaceId,
    deviceHealth, deviceStatuses
  } = useApp();
  
  const t = useTranslation();

  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    setSelectedBuildingId(null);
    setSelectedPlaceId(null);
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
      </div>

      <style jsx>{`
        .portfolio-card {
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-subtle);
        }
        .portfolio-card:hover {
          transform: translateY(-4px);
          border-color: var(--belimo-orange);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}