import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  Activity, 
  Layers, 
  UserCheck 
} from 'lucide-react';
import { getColors, borderRadius, typography } from '../designSystem';

const ROLE_METADATA = {
  S1: { title: 'S1 Division', subtitle: 'Personnel & Administration', icon: Users },
  S2: { title: 'S2 Division', subtitle: 'Intelligence & Security Records', icon: ShieldCheck },
  S3: { title: 'S3 Division', subtitle: 'Operations & Training Records', icon: FileText },
  S4: { title: 'S4 Division', subtitle: 'Logistics & Supply Personnel', icon: Layers },
  H1: { title: 'Horinta 1aad', subtitle: 'Company 1 Medical & Records', icon: UserCheck },
  H2: { title: 'Horinta 2aad', subtitle: 'Company 2 Medical & Records', icon: UserCheck },
  H3: { title: 'Horinta 3aad', subtitle: 'Company 3 Medical & Records', icon: UserCheck },
  H4: { title: 'Horinta 4aad', subtitle: 'Company 4 Medical & Records', icon: UserCheck },
  medic: { title: 'Medical Unit', subtitle: 'Healthcare & Examination', icon: Activity },
  Urur: { title: 'Taliska Ururka', subtitle: 'Battalion Command Overview', icon: ShieldCheck },
  '1': { title: 'Horinta 1aad', subtitle: 'Company 1 Unit Records', icon: UserCheck },
  '2': { title: 'Horinta 2aad', subtitle: 'Company 2 Unit Records', icon: UserCheck },
  '3': { title: 'Horinta 3aad', subtitle: 'Company 3 Unit Records', icon: UserCheck },
  '4': { title: 'Horinta 4aad', subtitle: 'Company 4 Unit Records', icon: UserCheck },
};

export default function RoleCards({
  roles = [],
  selectedRole,
  onSelectRole,
  columns = 'repeat(auto-fit, minmax(200px, 1fr))',
  darkMode = false,
  labels = {},
}) {
  const colors = getColors(darkMode);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: columns,
      gap: '12px',
      width: '100%',
    }}>
      {roles.map((roleKey) => {
        const isSelected = String(selectedRole) === String(roleKey);
        const meta = {
          ...(ROLE_METADATA[roleKey] || {
            title: `Role ${roleKey}`,
            subtitle: 'Unit Access',
            icon: ShieldCheck,
          }),
          ...(labels[roleKey] || {}),
        };
        const IconComponent = meta.icon;

        return (
          <div
            key={roleKey}
            onClick={() => onSelectRole(roleKey)}
            style={{
              backgroundColor: isSelected ? colors.primaryLight : colors.white,
              border: isSelected
                ? `2px solid ${colors.primary}`
                : `1px solid ${colors.border}`,
              borderRadius: borderRadius.lg,
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: isSelected ? '0 2px 8px rgba(15, 39, 68, 0.08)' : colors.shadowSm,
              position: 'relative',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = colors.primaryBorder;
                e.currentTarget.style.backgroundColor = darkMode ? colors.backgroundAlt : '#fafcff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.backgroundColor = colors.white;
              }
            }}
          >
            {/* Consistent Icon container */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: borderRadius.md,
              backgroundColor: isSelected ? (darkMode ? '#2563eb' : colors.primary) : (darkMode ? colors.backgroundAlt : '#f1f5f9'),
              color: isSelected ? '#ffffff' : colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.18s ease',
            }}>
              <IconComponent size={20} strokeWidth={2} />
            </div>

            {/* Role details */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: isSelected ? colors.primary : colors.text,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {meta.title}
              </div>
              <div style={{
                fontSize: '11.5px',
                color: colors.textMuted,
                marginTop: '3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {meta.subtitle}
              </div>
            </div>

            {/* Active bullet */}
            {isSelected && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
