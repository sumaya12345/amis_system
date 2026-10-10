import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getColors } from '../designSystem';

/**
 * LayoutShell – wraps any role‑specific page with the common application shell.
 * It provides the Sidebar, Header, dark‑mode handling and responsive layout.
 *
 * Props:
 *   role: string – one of 'S1', 'S2', 'S3', 'S4' (used for menu configuration).
 *   activeUser: object – current authenticated user (passed down to Header/Sidebar).
 *   children: ReactNode – role‑specific page content.
 */
const LayoutShell = ({ role, activeUser, children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Preserve per‑user theme selection if stored in localStorage
    const stored = localStorage.getItem(`amis_theme_${activeUser?.id}`);
    return stored === 'dark';
  });
  const [isExpanded, setIsExpanded] = useState(true);

  // Persist theme changes
  useEffect(() => {
    if (activeUser?.id) {
      localStorage.setItem(
        `amis_theme_${activeUser.id}`,
        darkMode ? 'dark' : 'light'
      );
    }
  }, [darkMode, activeUser]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const colors = getColors(darkMode);

  const shellStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.background,
    color: colors.text,
  };

  const mainStyle = {
    flex: 1,
    padding: '24px',
    marginLeft: isExpanded ? '200px' : '80px',
    transition: 'margin-left 0.3s ease',
    backgroundColor: colors.background,
  };

  return (
    <div style={shellStyle}>
      <Sidebar
        role={role}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeUser={activeUser}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <main style={mainStyle}>
        <Header
          role={role}
          activeUser={activeUser}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        {children}
      </main>
    </div>
  );
};

export default LayoutShell;
