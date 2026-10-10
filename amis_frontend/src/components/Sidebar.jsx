import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  PieChart,
  Settings,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';
import {
  sidebarStyle,
  sidebarCollapsedStyle,
  profileSectionStyle,
  profileImageStyle,
  navItemStyle,
  colors,
  typography,
  getColors,
} from '../designSystem';
import ProfileImage from '../ProfileImage';
import { getProfilePicUrl } from '../authSync';

export default function Sidebar({
  isExpanded,
  language = 'so',
  setIsExpanded,
  activeUser,
  activePage,
  setActivePage,
  onLogout,
  showMsgModal,
  setShowMsgModal,
  role,
  darkMode = false,
}) {
  const themeColors = getColors(darkMode);
  const isHRole = /^H[1-4]$/.test(role || '');
  // H1–H4, Medical (Mo) and Talye Urur share the simplified navigation.
  const usesPersonalRecords = isHRole || role === 'medic' || role === 'Urur';
  const currentSidebarStyle = {
    ...(isExpanded ? sidebarStyle : sidebarCollapsedStyle),
    backgroundColor: themeColors.sidebar,
    borderRight: `1px solid ${themeColors.sidebarBorder}`,
  };
  const themedNavItemStyle = (isActive = false) => ({
    ...navItemStyle(isActive),
    color: isActive ? themeColors.sidebarTextActive : themeColors.sidebarText,
    backgroundColor: isActive ? themeColors.sidebarActive : 'transparent',
  });
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [profilePreviewSrc, setProfilePreviewSrc] = useState(null);
  const [messageNotification, setMessageNotification] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const lastMessageIdRef = React.useRef(0);
  const sidebarTranslations = {
    en: { dashboard: 'Dashboard', reports: 'Reports', askar: 'Personnel Records', personalRecords: 'Personal Records', analytics: 'Analytics', settings: 'Settings', messages: 'Messages', logout: 'Logout', medicalPortal: 'Medical Portal', collapse: 'Collapse sidebar', expand: 'Expand sidebar', newMessage: 'New message', newMessageFrom: 'New message from', unknownSender: 'Unknown sender', dismiss: 'Dismiss message notification', ururCommander: 'Taliyaha Urur' },
    so: { dashboard: 'Dashboard', reports: 'Warbixinada', askar: 'Diiwaangelinta Shaqsiga', personalRecords: 'Personal Records', analytics: 'Tirakoob', settings: 'Dhigmaadka', messages: 'Fariimaha', logout: 'Ka bax', medicalPortal: 'Medical Portal', collapse: 'Yaree menu-ga', expand: 'Ballaari menu-ga', newMessage: 'Fariin cusub', newMessageFrom: 'Fariin cusub oo ka timid', unknownSender: 'Dire aan la aqoon', dismiss: 'Xir ogeysiiska fariinta', ururCommander: 'Taliyaha Urur' },
    tr: { dashboard: 'Panel', reports: 'Raporlar', askar: 'Personel Kayıtları', personalRecords: 'Kişisel Kayıtlar', analytics: 'Analiz', settings: 'Ayarlar', messages: 'Mesajlar', logout: 'Çıkış', medicalPortal: 'Sağlık Portalı', collapse: 'Kenar çubuğunu daralt', expand: 'Kenar çubuğunu genişlet', newMessage: 'Yeni mesaj', newMessageFrom: 'Yeni mesaj:', unknownSender: 'Bilinmeyen gönderici', dismiss: 'Mesaj bildirimini kapat', ururCommander: 'Urur Komutanı' },
  };
  const sidebarText = sidebarTranslations[language] || sidebarTranslations.en;

  useEffect(() => {
    if (!activeUser?.id) return undefined;

    let isMounted = true;
    const pollIncomingMessages = async () => {
      try {
        const sessionId = sessionStorage.getItem('sessionId');
        const requestOptions = sessionId ? { headers: { 'X-Session-ID': sessionId } } : {};
        const [messagesResponse, usersResponse, unreadResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/messages/${activeUser.id}`, requestOptions),
          fetch('http://localhost:5000/api/users', requestOptions),
          fetch('http://localhost:5000/api/messages/unread-summary', requestOptions)
        ]);
        // Senders the user can open a conversation with (the server applies the role rules).
        let openableSenders = null;
        if (unreadResponse.ok) {
          const unread = await unreadResponse.json();
          openableSenders = unread.bySender || {};
          if (isMounted) setUnreadTotal(Number(unread.total) || 0);
        }
        if (!messagesResponse.ok || !usersResponse.ok) return;
        const messages = await messagesResponse.json();
        const users = await usersResponse.json();
        const incoming = (messages || []).filter((message) => Number(message.receiver) === Number(activeUser.id));
        const latestId = incoming.reduce((maxId, message) => Math.max(maxId, Number(message.id) || 0), 0);

        if (lastMessageIdRef.current === 0) {
          lastMessageIdRef.current = latestId;
          return;
        }

        const newMessage = incoming
          .filter((message) => Number(message.id) > lastMessageIdRef.current)
          .filter((message) => Number(message.is_read) === 0
            && (!openableSenders || openableSenders[String(Number(message.sender))]))
          .sort((left, right) => Number(right.id) - Number(left.id))[0];
        lastMessageIdRef.current = Math.max(lastMessageIdRef.current, latestId);

        if (isMounted && newMessage) {
          const sender = (users || []).find((user) => Number(user.id) === Number(newMessage.sender));
          setMessageNotification({
            id: newMessage.id,
            senderId: Number(newMessage.sender),
            senderRole: sender?.role,
            senderUsername: sender?.username,
          });
        }
      } catch (error) {
        // Notification polling must not interrupt navigation or logout.
        console.error('Message notification polling failed:', error);
      }
    };

    pollIncomingMessages();
    const interval = setInterval(pollIncomingMessages, 3000);
    // FariimahaModal fires this after marking a conversation read, so the badge drops at once.
    window.addEventListener('amis_messages_read', pollIncomingMessages);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('amis_messages_read', pollIncomingMessages);
      lastMessageIdRef.current = 0;
    };
  }, [activeUser?.id]);

  const notificationSenderName = messageNotification
    ? (messageNotification.senderRole === 'Urur'
      ? sidebarText.ururCommander
      : (messageNotification.senderUsername || messageNotification.senderRole || sidebarText.unknownSender))
    : '';

  const handleProfileImageClick = () => {
    const pic = activeUser?.pic || activeUser?.profile_pic;
    if (pic) {
      setProfilePreviewSrc(getProfilePicUrl(pic));
      setShowProfilePreview(true);
    }
  };

  const closeProfilePreview = () => {
    setShowProfilePreview(false);
    setProfilePreviewSrc(null);
  };

  const allNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: sidebarText.dashboard },
    { id: 'reports',   icon: FileText,        label: sidebarText.reports },
    { id: 'askar',     icon: Users,           label: usesPersonalRecords ? sidebarText.personalRecords : sidebarText.askar },
    { id: 'settings',  icon: Settings,        label: sidebarText.settings },
  ];
  // These roles have no separate Reports page.
  const navItems = usesPersonalRecords ? allNavItems.filter((item) => item.id !== 'reports') : allNavItems;

  // Only show Analytics for non-S roles (Urur, medic, admin)
  const showAnalytics = role && !role.startsWith('S');
  const settingsIndex = navItems.findIndex((item) => item.id === 'settings');
  const finalNavItems = showAnalytics 
    ? [...navItems.slice(0, settingsIndex), { id: 'analytics', icon: PieChart, label: sidebarText.analytics }, ...navItems.slice(settingsIndex)]
    : navItems;

  const handleNavClick = (id) => {
    setActivePage(id);
  };

  const isNavActive = (id) => activePage === id;

  const hoverEnter = (e, isActive) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = themeColors.sidebarHover;
      e.currentTarget.style.color = themeColors.sidebarTextActive;
    }
  };

  const hoverLeave = (e, isActive) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = themeColors.sidebarText;
    }
  };

  return (
    <>
    <aside style={currentSidebarStyle} className="no-print">
      {/* ── Brand / Header ── */}
      <div style={{
        padding: isExpanded ? '18px 16px 14px' : '18px 8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        borderBottom: `1px solid ${themeColors.sidebarBorder}`,
      }}>
        {isExpanded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#2563eb' : '#16365c',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              <Shield size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
              }}>
                AMIS SYSTEM
              </div>
              <div style={{
                fontSize: '10px',
                color: darkMode ? '#60a5fa' : '#60a5fa',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginTop: '3px',
              }}>
                {sidebarText.medicalPortal}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#2563eb' : '#16365c',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}>
            <Shield size={18} strokeWidth={2.2} />
          </div>
        )}

        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={sidebarText.collapse}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: themeColors.sidebarText,
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── User Profile Section ── */}
      <div style={{...profileSectionStyle, borderBottom: `1px solid ${themeColors.sidebarBorder}`}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', minWidth: 0 }}>
          <div 
            onClick={handleProfileImageClick}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ProfileImage
              pic={activeUser?.pic || activeUser?.profile_pic}
              alt="Profile"
              style={{...profileImageStyle, pointerEvents: 'none'}}
            />
          </div>
          {isExpanded && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: themeColors.sidebarTextActive,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {activeUser?.username || `${role || 'Officer'}`}
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#60a5fa' : '#93c5fd',
                fontWeight: typography.fontWeight.medium,
                marginTop: '1px',
              }}>
                {activeUser?.role || role || 'Officer'}
              </div>
            </div>
          )}
        </div>

        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            title={sidebarText.expand}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: themeColors.sidebarText,
              padding: '2px',
              marginTop: '6px',
            }}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Profile Image Preview Modal */}
      {showProfilePreview && profilePreviewSrc && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            cursor: 'zoom-out'
          }}
          onClick={closeProfilePreview}
        >
          <div 
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={profilePreviewSrc} 
              alt="Profile Preview" 
              style={{ 
                maxWidth: '90%', 
                maxHeight: '90vh', 
                borderRadius: '16px',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
              }} 
            />
            <button 
              onClick={closeProfilePreview}
              style={{
                position: 'absolute',
                top: '-50px',
                right: 0,
                background: 'white',
                color: '#333',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                fontSize: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation Section ── */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {finalNavItems.map((item) => {
          const active = isNavActive(item.id);
          return (
            <div
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                ...themedNavItemStyle(active),
                justifyContent: isExpanded ? 'flex-start' : 'center',
                padding: isExpanded ? '9px 12px' : '9px 0',
              }}
              onMouseEnter={(e) => hoverEnter(e, active)}
              onMouseLeave={(e) => hoverLeave(e, active)}
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon size={17} style={{ flexShrink: 0 }} />
              {isExpanded && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom Section: Messages & Logout ── */}
      <div style={{
        padding: '10px 0 14px',
        borderTop: `1px solid ${themeColors.sidebarBorder}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {/* Messages Action */}
        <div
          onClick={() => setShowMsgModal && setShowMsgModal(true)}
          style={{
            ...themedNavItemStyle(showMsgModal),
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '9px 12px' : '9px 0',
            position: 'relative',
          }}
          onMouseEnter={(e) => hoverEnter(e, showMsgModal)}
          onMouseLeave={(e) => hoverLeave(e, showMsgModal)}
          title={!isExpanded ? sidebarText.messages : undefined}
        >
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <MessageSquare size={17} style={{ flexShrink: 0 }} />
            {unreadTotal > 0 && (
              <span style={{
                position: 'absolute',
                top: '-7px',
                right: '-8px',
                minWidth: '16px',
                height: '16px',
                borderRadius: '999px',
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '9px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </span>
          {isExpanded && <span>{sidebarText.messages}</span>}
          {isExpanded && unreadTotal > 0 && (
            <span style={{
              marginLeft: 'auto',
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
            }}>
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </div>

        {/* Logout Action */}
        <div
          onClick={onLogout}
          style={{
            ...themedNavItemStyle(false),
            color: '#f87171',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '9px 12px' : '9px 0',
            borderLeft: '3px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#f87171';
          }}
          title={!isExpanded ? sidebarText.logout : undefined}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {isExpanded && <span style={{ fontWeight: typography.fontWeight.semibold }}>{sidebarText.logout}</span>}
        </div>
      </div>
    </aside>
    {messageNotification && (
      <div
        className="no-print"
        role="button"
        tabIndex={0}
        onClick={() => {
          if (messageNotification.senderId) {
            sessionStorage.setItem('amis_open_chat_user_id', String(messageNotification.senderId));
          }
          if (setShowMsgModal) setShowMsgModal(true);
          setMessageNotification(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (messageNotification.senderId) {
              sessionStorage.setItem('amis_open_chat_user_id', String(messageNotification.senderId));
            }
            if (setShowMsgModal) setShowMsgModal(true);
            setMessageNotification(null);
          }
        }}
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          zIndex: 11000,
          width: 'min(360px, calc(100vw - 36px))',
          padding: '14px 16px',
          borderRadius: '10px',
          background: themeColors.white,
          color: themeColors.text,
          border: `1px solid ${themeColors.primaryBorder}`,
          boxShadow: themeColors.shadowLg,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <MessageSquare size={18} color={themeColors.primary} />
        <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.4 }}>
          <strong>{sidebarText.newMessage}</strong>
          <div>{sidebarText.newMessageFrom} {notificationSenderName}.</div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMessageNotification(null);
          }}
          aria-label={sidebarText.dismiss}
          style={{ background: 'transparent', border: 'none', color: themeColors.textMuted, cursor: 'pointer', padding: 0 }}
        >
          <X size={16} />
        </button>
      </div>
    )}
    </>
  );
}
