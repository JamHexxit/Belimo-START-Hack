'use client';

import { useApp } from '../context/AppContext';
import { useTranslation } from '../lib/i18n';

// Icons
const IconCompany = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18"/></svg>;
const IconBuilding = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="10" width="20" height="12" rx="2"/><path d="M6 10V4a2 2 0 012-2h8a2 2 0 012 2v6"/></svg>;
const IconPlace = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconSensor = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;

export default function StatisticsPage() {
  const { companies, buildings, places, devices } = useApp();
  const t = useTranslation();

  const totalCompanies = companies.length;
  const totalBuildings = buildings.length;
  const totalPlaces = places.length;
  const totalSensors = devices.length;

  // Mocked or calculated health for portfolio overview
  const onlineSensors = totalSensors; // Placeholder until aggregate API is ready
  const warningSensors = 0;
  const errorSensors = 0;

  const healthScore = 100;

  const stats = [
    { label: 'Total Companies', value: totalCompanies, icon: <IconCompany />, color: 'orange' },
    { label: 'Total Buildings', value: totalBuildings, icon: <IconBuilding />, color: 'blue' },
    { label: 'Total Places', value: totalPlaces, icon: <IconPlace />, color: 'green' },
    { label: 'Total Sensors', value: totalSensors, icon: <IconSensor />, color: 'orange' },
  ];

  return (
    <div className="statistics-page">
      <div className="page-header">
        <div>
          <div className="page-title">Portfolio Overview</div>
          <div className="page-subtitle">Aggregate metrics across all customers and locations</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ height: '100%', alignItems: 'center' }}>
            <div className={`stat-icon ${s.color}`} style={{ width: 50, height: 50 }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 32 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
        {/* Portfolio Health */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconActivity />
            <div className="section-title" style={{ margin: 0 }}>Portfolio Health</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '10px 0' }}>
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                <circle 
                  cx="60" cy="60" r="54" fill="none" stroke="var(--belimo-orange)" strokeWidth="8" 
                  strokeDasharray={339.3}
                  strokeDashoffset={339.3 * (1 - healthScore / 100)}
                  strokeLinecap="butt"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{healthScore}%</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Healthy</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, background: 'var(--status-online)' }} />
                  Online
                </div>
                <div style={{ fontWeight: 700 }}>{onlineSensors}</div>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)' }}>
                <div style={{ width: `${(onlineSensors/totalSensors)*100}%`, height: '100%', background: 'var(--status-online)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, background: 'var(--status-warning)' }} />
                  Warning
                </div>
                <div style={{ fontWeight: 700 }}>{warningSensors}</div>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)' }}>
                <div style={{ width: `${(warningSensors/totalSensors)*100}%`, height: '100%', background: 'var(--status-warning)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, background: 'var(--status-error)' }} />
                  Critical / Offline
                </div>
                <div style={{ fontWeight: 700 }}>{errorSensors}</div>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)' }}>
                <div style={{ width: `${(errorSensors/totalSensors)*100}%`, height: '100%', background: 'var(--status-error)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Global Distribution */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div className="section-title">Global Distribution</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, gap: 16, padding: '20px 10px 10px', background: 'var(--bg-primary)' }}>
                {[
                  { label: 'Cos.', value: totalCompanies, color: 'var(--belimo-orange)' },
                  { label: 'Bldgs.', value: totalBuildings, color: '#3b82f6' },
                  { label: 'Places', value: totalPlaces, color: 'var(--status-online)' },
                  { label: 'Sensors', value: totalSensors, color: 'var(--belimo-orange)' },
                ].map(item => {
                  const barHeight = totalSensors > 0 ? (item.value / totalSensors) * 100 : 0;
                  const displayHeight = item.label === 'Sensors' ? 100 : Math.max(15, barHeight);
                  return (
                    <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                       <div style={{ fontSize: 10, fontWeight: 700, color: item.color }}>{item.value}</div>
                       <div style={{ 
                         width: '100%', 
                         height: `${displayHeight}%`, 
                         background: `${item.color}15`, 
                         border: `1.5px solid ${item.color}`,
                         borderBottom: 'none',
                         transition: 'height 0.5s ease-out'
                       }} />
                       <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                    </div>
                  );
                })}
             </div>
             <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The portfolio contains <strong>{totalSensors} sensors</strong> across <strong>{totalCompanies} customers</strong>. 
                On average, each customer has <strong>{totalBuildings > 0 ? (totalSensors/totalBuildings).toFixed(1) : 0} devices</strong> per building.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
