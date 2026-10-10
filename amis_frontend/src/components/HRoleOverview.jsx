import React from 'react';
import { Clock, CheckCircle2, Users } from 'lucide-react';
import { colors, cardStyle } from '../designSystem';

export default function HRoleOverview({ view, pendingQueue = [], activeRecords = [], personnel = [] }) {
  const stats = [
    { label: 'Safka Sugitaanka (Pending)', value: pendingQueue.length, icon: Clock },
    { label: 'Diiwaanka Baaritaanka ee Firfircoon', value: activeRecords.length, icon: CheckCircle2 },
    { label: 'Wadarta Askarta', value: personnel.length, icon: Users },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: colors.primaryLight, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: colors.primary, flexShrink: 0,
            }}>
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: colors.text, lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
        {view === 'analytics'
          ? 'Faahfaahin dheeraad ah oo Tirakoob ah ayaa dhawaan la heli doonaa.'
          : 'Faahfaahinta buuxda ee warbixinnada waxay ku jirtaa bogga Dashboard-ka.'}
      </div>
    </div>
  );
}
