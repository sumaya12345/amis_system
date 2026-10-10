/**
 * AMIS Design System
 * Strict Enterprise Healthcare Palette: Dark Navy Blue + White + Dark Neutral Slate/Gray
 */

// ─── COLOR TOKENS ────────────────────────────────────────────────────────────
export const colors = {
  // Dark Navy Blue (Primary Brand Identity)
  primary:       '#0f2744', // Deep enterprise navy
  primaryHover:  '#16365c',
  primaryActive: '#0a1b30',
  primaryLight:  '#f0f5fa', // Very subtle navy tint for active/selected surfaces
  primaryBorder: '#cbd9e8',
  primaryText:   '#ffffff',

  // Sidebar (Dark Navy Blue)
  sidebar:           '#0b1d33', // Refined deep navy
  sidebarHover:      '#132b4a',
  sidebarActive:     '#1a385f', // Elegant active highlight
  sidebarBorder:     'rgba(255, 255, 255, 0.08)',
  sidebarText:       '#94a9c4', // Clean muted text
  sidebarTextActive: '#ffffff',

  // Canvas & Surfaces (Dominated by White & Light Neutral Gray)
  background:    '#f4f6f9', // Clean neutral dashboard background
  backgroundAlt: '#f8fafc',
  white:         '#ffffff',
  surface:       '#ffffff',

  // Borders & Dividers
  border:        '#e2e8f0', // Clean crisp slate border
  borderLight:   '#edf2f7',
  borderDark:    '#cbd5e1',

  // Text & Typography
  text:          '#0f172a', // Slate 900 - High contrast, readable
  textSecondary: '#334155', // Slate 700 - Body & subheadings
  textMuted:     '#64748b', // Slate 500 - Secondary captions & metadata
  textLight:     '#94a3b8', // Slate 400 - Placeholders & subtle icons

  // Status Indicators (Muted & Restrained)
  success:       '#0f766e', // Deep teal instead of neon green
  successBg:     '#f0fdf4',
  successBorder: '#bbf7d0',
  warning:       '#b45309', // Deep amber
  warningBg:     '#fffbeb',
  warningBorder: '#fde68a',
  error:         '#be123c', // Deep crimson/rose
  errorBg:       '#fff1f2',
  errorBorder:   '#fecdd3',
  info:          '#0f2744', // Navy info
  infoBg:        '#f0f5fa',
  infoBorder:    '#cbd9e8',

  // Subtle Shadows
  shadowSm: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  shadow:   '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
  shadowMd: '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
  shadowLg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
  shadowXl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
};

// ─── DARK MODE COLORS ─────────────────────────────────────────────────────────
export const darkColors = {
  // Dark Navy Blue (Primary Brand Identity)
  primary:       '#60a5fa', // Lighter blue for dark mode
  primaryHover:  '#93c5fd',
  primaryActive: '#3b82f6',
  primaryLight:  '#1e3a5f', // Darker tint for active/selected surfaces
  primaryBorder: '#1e40af',
  primaryText:   '#ffffff',

  // Sidebar (Darker Navy)
  sidebar:           '#0a0f1a', // Very dark navy
  sidebarHover:      '#1a2332',
  sidebarActive:     '#2563eb', // Bright blue highlight
  sidebarBorder:     'rgba(255, 255, 255, 0.1)',
  sidebarText:       '#94a3b8',
  sidebarTextActive: '#ffffff',

  // Canvas & Surfaces (Dark)
  background:    '#0f172a', // Dark slate background
  backgroundAlt: '#1e293b',
  white:         '#1e293b', // Cards are dark in dark mode
  surface:       '#1e293b',

  // Borders & Dividers
  border:        '#334155',
  borderLight:   '#475569',
  borderDark:    '#64748b',

  // Text & Typography
  text:          '#f1f5f9', // Light slate for readability
  textSecondary: '#cbd5e1',
  textMuted:     '#94a3b8',
  textLight:     '#64748b',

  // Status Indicators (Adjusted for dark mode)
  success:       '#34d399',
  successBg:     '#064e3b',
  successBorder: '#059669',
  warning:       '#fbbf24',
  warningBg:     '#78350f',
  warningBorder: '#d97706',
  error:         '#f87171',
  errorBg:       '#7f1d1d',
  errorBorder:   '#dc2626',
  info:          '#60a5fa',
  infoBg:        '#1e3a8a',
  infoBorder:    '#2563eb',

  // Subtle Shadows (darker for dark mode)
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  shadow:   '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
};

// ─── GET COLORS BASED ON THEME ──────────────────────────────────────────────────
export const getColors = (isDarkMode = false) => isDarkMode ? darkColors : colors;

// ─── SPACING ─────────────────────────────────────────────────────────────────
export const spacing = {
  xs:   '4px',
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '20px',
  '2xl':'24px',
  '3xl':'32px',
  '4xl':'40px',
};

// ─── BORDER RADIUS ───────────────────────────────────────────────────────────
export const borderRadius = {
  xs:   '4px',
  sm:   '6px',
  md:   '8px',
  lg:   '10px',
  xl:   '12px',
  full: '9999px',
};

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: {
    xs:    '11px',
    sm:    '12px',
    base:  '13.5px',
    md:    '14px',
    lg:    '16px',
    xl:    '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    extrabold:'800',
  },
};

// ─── SIDEBAR STYLES ──────────────────────────────────────────────────────────
export const sidebarStyle = {
  width: '240px',
  height: '100vh',
  backgroundColor: colors.sidebar,
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  flexShrink: 0,
  borderRight: `1px solid ${colors.sidebarBorder}`,
  userSelect: 'none',
};

export const sidebarCollapsedStyle = {
  width: '72px',
  height: '100vh',
  backgroundColor: colors.sidebar,
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  flexShrink: 0,
  borderRight: `1px solid ${colors.sidebarBorder}`,
  userSelect: 'none',
};

// ─── PROFILE SECTION ─────────────────────────────────────────────────────────
export const profileSectionStyle = {
  padding: '16px 14px',
  borderBottom: `1px solid ${colors.sidebarBorder}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
};

export const profileImageStyle = {
  width: '36px',
  height: '36px',
  borderRadius: borderRadius.full,
  border: '2px solid rgba(255, 255, 255, 0.2)',
  objectFit: 'cover',
  backgroundColor: colors.sidebarHover,
  flexShrink: 0,
};

// ─── NAV ITEMS ───────────────────────────────────────────────────────────────
export const navItemStyle = (isActive = false) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '9px 12px',
  margin: '2px 8px',
  borderRadius: borderRadius.md,
  cursor: 'pointer',
  gap: '11px',
  transition: 'all 0.18s ease',
  color:           isActive ? colors.sidebarTextActive : colors.sidebarText,
  backgroundColor: isActive ? colors.sidebarActive     : 'transparent',
  fontWeight:      isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
  fontSize:        typography.fontSize.base,
  textDecoration: 'none',
  userSelect: 'none',
  borderLeft:      isActive ? '3px solid #60a5fa' : '3px solid transparent',
});

// ─── CARD ─────────────────────────────────────────────────────────────────────
export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: colors.shadowSm,
  padding: spacing.xl,
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
export const statCardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: colors.shadowSm,
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
};

// ─── TABLE ───────────────────────────────────────────────────────────────────
export const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: colors.white,
  fontSize: typography.fontSize.base,
  textAlign: 'left',
};

export const tableHeaderStyle = {
  backgroundColor: '#f8fafc',
  color: colors.textSecondary,
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '10px 16px',
  borderBottom: `1px solid ${colors.border}`,
};

export const tableCellStyle = {
  padding: '11px 16px',
  borderBottom: `1px solid ${colors.borderLight}`,
  fontSize: typography.fontSize.base,
  color: colors.text,
  verticalAlign: 'middle',
};

// ─── BUTTONS ─────────────────────────────────────────────────────────────────
const buttonBase = {
  padding: '8px 16px',
  borderRadius: borderRadius.md,
  border: '1px solid transparent',
  cursor: 'pointer',
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  transition: 'all 0.18s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  fontFamily: typography.fontFamily,
  lineHeight: '1.25',
  outline: 'none',
};

export const buttonPrimaryStyle = {
  ...buttonBase,
  backgroundColor: colors.primary,
  color: colors.white,
  borderColor: colors.primary,
  boxShadow: '0 1px 2px 0 rgba(15, 39, 68, 0.2)',
};

export const buttonSecondaryStyle = {
  ...buttonBase,
  backgroundColor: colors.white,
  color: colors.textSecondary,
  borderColor: colors.border,
  boxShadow: colors.shadowSm,
};

export const buttonDangerStyle = {
  ...buttonBase,
  backgroundColor: colors.white,
  color: colors.error,
  borderColor: colors.errorBorder,
};

export const buttonGhostStyle = {
  ...buttonBase,
  backgroundColor: 'transparent',
  color: colors.textSecondary,
  borderColor: 'transparent',
};

// ─── FORM CONTROLS ───────────────────────────────────────────────────────────
export const inputStyle = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  fontSize: typography.fontSize.base,
  color: colors.text,
  backgroundColor: colors.white,
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  outline: 'none',
  fontFamily: typography.fontFamily,
  boxSizing: 'border-box',
};

export const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.sm,
  color: colors.textSecondary,
  letterSpacing: '0.01em',
};

// ─── MODAL ───────────────────────────────────────────────────────────────────
export const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(11, 29, 51, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
  padding: spacing.xl,
};

export const modalContentStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.xl,
  boxShadow: colors.shadowXl,
  maxWidth: '560px',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  padding: spacing['2xl'],
  border: `1px solid ${colors.borderLight}`,
};

export const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing.lg,
  paddingBottom: spacing.md,
  borderBottom: `1px solid ${colors.border}`,
};

export const modalTitleStyle = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  color: colors.text,
  margin: 0,
};

// ─── BADGES ──────────────────────────────────────────────────────────────────
export const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: borderRadius.sm,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  letterSpacing: '0.02em',
  lineHeight: '1.4',
};

export const badgePrimaryStyle = {
  ...badgeStyle,
  backgroundColor: colors.primaryLight,
  color: colors.primary,
  border: `1px solid ${colors.primaryBorder}`,
};

export const badgeSuccessStyle = {
  ...badgeStyle,
  backgroundColor: colors.successBg,
  color: colors.success,
  border: `1px solid ${colors.successBorder}`,
};

export const badgeWarningStyle = {
  ...badgeStyle,
  backgroundColor: colors.warningBg,
  color: colors.warning,
  border: `1px solid ${colors.warningBorder}`,
};

export const badgeErrorStyle = {
  ...badgeStyle,
  backgroundColor: colors.errorBg,
  color: colors.error,
  border: `1px solid ${colors.errorBorder}`,
};

export const badgeNeutralStyle = {
  ...badgeStyle,
  backgroundColor: '#f1f5f9',
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing['3xl'],
  textAlign: 'center',
  color: colors.textMuted,
};

// ─── THEME-AWARE STYLE SET ───────────────────────────────────────────────────
// The style constants above are built once from the light palette. Components
// that must follow Dark Mode call this with the current theme instead.
export const getThemedStyles = (isDarkMode = false) => {
  const c = getColors(isDarkMode);
  const primaryButtonBg = isDarkMode ? '#2563eb' : c.primary;
  return {
    colors: c,
    neutralBg: isDarkMode ? c.backgroundAlt : '#f1f5f9',
    subtleBg: isDarkMode ? '#172033' : '#f8fafc',
    cardStyle: { ...cardStyle, backgroundColor: c.white, border: `1px solid ${c.border}`, boxShadow: c.shadowSm },
    tableStyle: { ...tableStyle, backgroundColor: c.white, color: c.text },
    tableHeaderStyle: { ...tableHeaderStyle, backgroundColor: isDarkMode ? c.backgroundAlt : '#f8fafc', color: c.textSecondary, borderBottom: `1px solid ${c.border}` },
    tableCellStyle: { ...tableCellStyle, color: c.text, borderBottom: `1px solid ${isDarkMode ? c.border : c.borderLight}` },
    buttonPrimaryStyle: { ...buttonPrimaryStyle, backgroundColor: primaryButtonBg, borderColor: primaryButtonBg, color: '#ffffff' },
    buttonSecondaryStyle: { ...buttonSecondaryStyle, backgroundColor: c.white, color: c.textSecondary, borderColor: c.border, boxShadow: c.shadowSm },
    inputStyle: { ...inputStyle, backgroundColor: isDarkMode ? c.background : c.white, color: c.text, border: `1px solid ${c.border}` },
    badgeStyle,
  };
};

// ─── GLOBAL SYSTEM-WIDE THEME CONTROLLER ─────────────────────────────────────
export const getGlobalDarkMode = (userId) => {
  const globalSetting = localStorage.getItem('amis_global_theme');
  if (globalSetting !== null) return globalSetting === 'dark';
  if (userId) {
    const userSetting = localStorage.getItem(`amis_theme_${userId}`);
    if (userSetting !== null) return userSetting === 'dark';
  }
  return false;
};

export const setGlobalDarkMode = (isDark, userId) => {
  localStorage.setItem('amis_global_theme', isDark ? 'dark' : 'light');
  if (userId) {
    localStorage.setItem(`amis_theme_${userId}`, isDark ? 'dark' : 'light');
  }
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  window.dispatchEvent(new CustomEvent('amis_theme_change', { detail: { darkMode: isDark } }));
};

export const initGlobalTheme = (userId) => {
  const isDark = getGlobalDarkMode(userId);
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  return isDark;
};
