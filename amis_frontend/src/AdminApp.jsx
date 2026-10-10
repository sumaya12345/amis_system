import React, { useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './components/AdminDashboard';
import HRoleOverview from './components/HRoleOverview';
import HRoleDetail from './components/HRoleDetail';
import AdminUsers from './components/AdminUsers';
import AdminProfile from './components/AdminProfile';

export default function AdminApp({ currentPath, navigate, onLogout }) {
  // Determines which admin page to show based on the URL path.
  const renderPage = () => {
    // Detail view – path like /admin/h-role-overview/123
    if (currentPath.startsWith('/admin/h-role-overview/')) {
      const parts = currentPath.split('/');
      const id = parts[parts.length - 1];
      return <HRoleDetail userId={id} onBack={() => navigate('/admin/h-role-overview')} />;
    }
    switch (currentPath) {
      case '/admin/dashboard':
        return <AdminDashboard />;
      case '/admin/h-role-overview':
        return <HRoleOverview />;
      case '/admin/users':
        return <AdminUsers />;
      case '/admin/profile':
        return <AdminProfile />;
      default:
        return <div style={{ padding: '20px' }}>Coming soon…</div>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar navigate={navigate} onLogout={onLogout} />
      <div style={{ flexGrow: 1, padding: '20px' }}>{renderPage()}</div>
    </div>
  );
}
