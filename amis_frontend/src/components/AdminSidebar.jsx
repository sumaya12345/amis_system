import React, { useState } from 'react';
import { X } from 'lucide-react';
import { sidebarStyle, sidebarCollapsedStyle, navItemStyle, getColors } from '../designSystem';

export default function AdminSidebar({ navigate, onLogout, darkMode = false }) {
  const themeColors = getColors(darkMode);
  const [isExpanded, setIsExpanded] = useState(true);
  const currentSidebarStyle = isExpanded ? sidebarStyle : sidebarCollapsedStyle;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { id: 'h-role-overview', label: 'H‑Role Overview', path: '/admin/h-role-overview' },
    { id: 'users', label: 'Users', path: '/admin/users' },
    { id: 'profile', label: 'Profile', path: '/admin/profile' },
    { id: 'horins', label: 'Horins', path: '/admin/horins' },
    { id: 'personnel', label: 'Personnel', path: '/admin/personnel' },
    { id: 'medical', label: 'Medical', path: '/admin/medical' },
    { id: 'messages', label: 'Messages', path: '/admin/messages' },
    { id: 'reports', label: 'Reports', path: '/admin/reports' },
    { id: 'analytics', label: 'Analytics', path: '/admin/analytics' },
    { id: 'audit-logs', label: 'Audit Logs', path: '/admin/audit-logs' },
    { id: 'database-health', label: 'Database Health', path: '/admin/database-health' },
    { id: 'settings', label: 'Settings', path: '/admin/settings' },
  ];

  const handleNavClick = (path) => navigate(path);

  return (
    <aside style={currentSidebarStyle} className="no-print">
      <div style={{ padding: isExpanded ? '18px 16px 14px' : '18px 8px 14px', display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', borderBottom: `1px solid ${themeColors.sidebarBorder}` }}>
        {isExpanded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: darkMode ? '#2563eb' : '#16365c', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={18} />
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>ADMIN PANEL</div>
          </div>
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: darkMode ? '#2563eb' : '#16365c', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={18} />
          </div>
        )}
        {isExpanded && (
          <button type="button" onClick={() => setIsExpanded(!isExpanded)} title="Collapse sidebar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.sidebarText, padding: '4px' }}>
            <X size={16} />
          </button>
        )}
      </div>
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => handleNavClick(item.path)}
            style={{ ...navItemStyle(false), justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '9px 12px' : '9px 0', cursor: 'pointer' }}
            title={!isExpanded ? item.label : undefined}>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: '10px 0 14px', borderTop: `1px solid ${themeColors.sidebarBorder}` }}>
        <div onClick={onLogout}
          style={{ ...navItemStyle(false), color: '#f87171', justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '9px 12px' : '9px 0', cursor: 'pointer' }}
          title={!isExpanded ? 'Logout' : undefined}>
          Logout
        </div>
      </div>
    </aside>
  );
}
