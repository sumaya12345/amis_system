import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  X,
  Send,
  Paperclip,
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  Download,
  ExternalLink
} from 'lucide-react';
import { getAuthUser } from './authSync';
import {
  getThemedStyles,
  modalOverlayStyle,
  modalContentStyle,
  borderRadius,
} from './designSystem';

const messagingText = {
  so: {
    title: 'Fariimaha', subtitle: 'Official Messaging', close: 'Xir', search: 'Raadi sarkaal ama horin...',
    noMembers: 'Lama helin xubno kale.', online: 'Online', offline: 'Offline',
    lastSeenMin: (n) => `Last seen ${n} min ago`, lastSeenHr: (n) => `Last seen ${n} hr${n === 1 ? '' : 's'} ago`, lastSeenDay: (n) => `Last seen ${n} day${n === 1 ? '' : 's'} ago`,
    closeChat: 'Xir Qoraalka', noMessages: 'Wali farriin lama wadaagin.', startHint: 'Ku qor farriinta hoose si aad u bilowdo wadahadalka.',
    open: 'Open', saveAs: 'Save As', attach: 'Lifaaq file', filePlaceholder: (name) => `File: ${name} (Geli qoraal...)`,
    messagePlaceholder: 'Qor farriin rasmi ah...', send: 'Dir', centerTitle: 'Xarunta Fariimaha AMIS',
    centerHint: 'Fadlan dhinaca bidix ka dooro qofka aad doonayso inaad la xiriirto.',
    sendError: 'Farriinta lama diri karin. Fadlan hubi xiriirka server-ka.',
    fileTooLarge: 'File size exceeds 15MB limit. Please choose a smaller file.', fileBlocked: 'This file type is not allowed for security reasons.',
    ururCommander: 'Taliyaha Urur', medicalOfficer: 'Sarkaalka Caafimaadka', image: 'Image',
    fileTypes: { pdf: 'PDF Document', word: 'Word Document', excel: 'Excel Spreadsheet', ppt: 'PowerPoint Presentation', archive: 'Archive', text: 'Text File', doc: 'Document' },
  },
  en: {
    title: 'Messages', subtitle: 'Official Messaging', close: 'Close', search: 'Search officer or division...',
    noMembers: 'No other members found.', online: 'Online', offline: 'Offline',
    lastSeenMin: (n) => `Last seen ${n} min ago`, lastSeenHr: (n) => `Last seen ${n} hr${n === 1 ? '' : 's'} ago`, lastSeenDay: (n) => `Last seen ${n} day${n === 1 ? '' : 's'} ago`,
    closeChat: 'Close Chat', noMessages: 'No messages shared yet.', startHint: 'Type a message below to start the conversation.',
    open: 'Open', saveAs: 'Save As', attach: 'Attach file', filePlaceholder: (name) => `File: ${name} (Add a message...)`,
    messagePlaceholder: 'Write an official message...', send: 'Send', centerTitle: 'AMIS Message Center',
    centerHint: 'Please select the person you want to contact from the left panel.',
    sendError: 'The message could not be sent. Please check the server connection.',
    fileTooLarge: 'File size exceeds 15MB limit. Please choose a smaller file.', fileBlocked: 'This file type is not allowed for security reasons.',
    ururCommander: 'Taliyaha Urur', medicalOfficer: 'Medical Officer', image: 'Image',
    fileTypes: { pdf: 'PDF Document', word: 'Word Document', excel: 'Excel Spreadsheet', ppt: 'PowerPoint Presentation', archive: 'Archive', text: 'Text File', doc: 'Document' },
  },
  tr: {
    title: 'Mesajlar', subtitle: 'Resmi Mesajlaşma', close: 'Kapat', search: 'Subay veya birim ara...',
    noMembers: 'Başka üye bulunamadı.', online: 'Çevrimiçi', offline: 'Çevrimdışı',
    lastSeenMin: (n) => `${n} dk önce görüldü`, lastSeenHr: (n) => `${n} saat önce görüldü`, lastSeenDay: (n) => `${n} gün önce görüldü`,
    closeChat: 'Sohbeti Kapat', noMessages: 'Henüz mesaj paylaşılmadı.', startHint: 'Konuşmayı başlatmak için aşağıya bir mesaj yazın.',
    open: 'Aç', saveAs: 'Farklı Kaydet', attach: 'Dosya ekle', filePlaceholder: (name) => `Dosya: ${name} (Mesaj ekleyin...)`,
    messagePlaceholder: 'Resmi bir mesaj yazın...', send: 'Gönder', centerTitle: 'AMIS Mesaj Merkezi',
    centerHint: 'Lütfen sol panelden iletişim kurmak istediğiniz kişiyi seçin.',
    sendError: 'Mesaj gönderilemedi. Lütfen sunucu bağlantısını kontrol edin.',
    fileTooLarge: 'Dosya boyutu 15MB sınırını aşıyor. Lütfen daha küçük bir dosya seçin.', fileBlocked: 'Bu dosya türüne güvenlik nedeniyle izin verilmiyor.',
    ururCommander: 'Urur Komutanı', medicalOfficer: 'Sağlık Subayı', image: 'Resim',
    fileTypes: { pdf: 'PDF Belgesi', word: 'Word Belgesi', excel: 'Excel Tablosu', ppt: 'PowerPoint Sunumu', archive: 'Arşiv', text: 'Metin Dosyası', doc: 'Belge' },
  },
};

export default function FariimahaModal({ isOpen, onClose, currentUser, darkMode = false, language = 'so' }) {
  const { colors, buttonPrimaryStyle, neutralBg, subtleBg } = getThemedStyles(darkMode);
  const mt = messagingText[language] || messagingText.so;
  const accentBg = buttonPrimaryStyle.backgroundColor;
  const activeUser = currentUser || getAuthUser();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [focusedUserIndex, setFocusedUserIndex] = useState(-1);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [unreadBySender, setUnreadBySender] = useState({});
  const [animateMessageId, setAnimateMessageId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({
    urur: true,
    sarkaal: true,
    horinta: true,
    medical: true
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const attachmentUrl = (filename) => `http://localhost:5000/uploads/${filename}`;

  const isImageAttachment = (msg) => {
    const mime = String(msg.attachment_mime_type || '').toLowerCase();
    const type = String(msg.message_type || '').toLowerCase();
    const name = String(msg.attachment_original_name || msg.attachment || '').toLowerCase();
    return type === 'image' || mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(name);
  };

  const getFileIcon = (msg) => {
    const mime = String(msg.attachment_mime_type || '').toLowerCase();
    const name = String(msg.attachment_original_name || msg.attachment || '').toLowerCase();

    if (mime.includes('pdf') || name.endsWith('.pdf')) return '📄';
    if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return '📝';
    if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return '📊';
    if (mime.includes('powerpoint') || mime.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return '📽️';
    if (mime.includes('zip') || mime.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) return '📦';
    if (mime.includes('text') || name.endsWith('.txt')) return '📃';
    return '📎';
  };

  const getFileTypeLabel = (msg) => {
    const mime = String(msg.attachment_mime_type || '').toLowerCase();
    const name = String(msg.attachment_original_name || msg.attachment || '').toLowerCase();

    if (mime.includes('pdf') || name.endsWith('.pdf')) return mt.fileTypes.pdf;
    if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return mt.fileTypes.word;
    if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return mt.fileTypes.excel;
    if (mime.includes('powerpoint') || mime.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return mt.fileTypes.ppt;
    if (mime.includes('zip') || mime.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) return mt.fileTypes.archive;
    if (mime.includes('text') || name.endsWith('.txt')) return mt.fileTypes.text;
    return mt.fileTypes.doc;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getMessageStatusIcon = (msg) => {
    const status = String(msg.status || 'sent').toLowerCase();
    const isMine = Number(msg.sender_id || msg.sender) === Number(activeUser?.id);

    if (!isMine) return null;

    if (status === 'read') {
      return <CheckCheck size={14} color="#4ade80" />;
    } else if (status === 'delivered') {
      return <CheckCheck size={14} color="#94a3b8" />;
    } else {
      return <Check size={14} color="#94a3b8" />;
    }
  };

  const formatLastSeen = (user) => {
    if (user?.is_online) return mt.online;
    if (!user?.last_seen) return mt.offline;
    const seen = new Date(user.last_seen);
    if (Number.isNaN(seen.getTime())) return mt.offline;
    const diffMs = Date.now() - seen.getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return mt.lastSeenMin(minutes);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return mt.lastSeenHr(hours);
    const days = Math.floor(hours / 24);
    return mt.lastSeenDay(days);
  };

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch available users when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setFocusedUserIndex(-1);
      setMessageText('');
      setAttachment(null);
      setMessages([]);
      setUnreadBySender({});
      return undefined;
    }

    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users');

        // Role-based filtering for messaging permissions
        let allowedRoles = [];
        if (activeUser?.role === 'S1') {
          allowedRoles = ['H1', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'S2') {
          allowedRoles = ['H2', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'S3') {
          allowedRoles = ['H3', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'S4') {
          allowedRoles = ['H4', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'H1') {
          allowedRoles = ['S1', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'H2') {
          allowedRoles = ['S2', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'H3') {
          allowedRoles = ['S3', 'Urur', 'medic', 'admin'];
        } else if (activeUser?.role === 'H4') {
          allowedRoles = ['S4', 'Urur', 'medic', 'admin'];
        } else {
          // For Urur, medic, admin, show all users
          allowedRoles = [];
        }

        const mapped = (res.data || [])
          .filter((u) => {
            // Don't show self
            if (u.id === activeUser?.id) return false;
            // Apply role-based filtering if allowedRoles is set
            if (allowedRoles.length > 0) {
              return allowedRoles.includes(u.role);
            }
            return true;
          })
          .map((u) => {
            let displayName = u.username;
            if (u.role === 'Urur') displayName = mt.ururCommander;
            else if (u.role === 'medic') displayName = u.username || mt.medicalOfficer;

            return {
              ...u,
              displayName,
            };
          });

        setAvailableUsers(mapped);

        const pendingId = Number(sessionStorage.getItem('amis_open_chat_user_id'));
        if (pendingId) {
          const match = mapped.find((user) => Number(user.id) === pendingId);
          if (match) {
            setSelectedUser(match);
            sessionStorage.removeItem('amis_open_chat_user_id');
          }
        }
      } catch (err) {
        console.error('Error fetching messaging users:', err);
      }
    };

    fetchUsers();
    const presenceInterval = setInterval(fetchUsers, 10000);
    return () => clearInterval(presenceInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeUser?.role, language]);

  useEffect(() => {
    if (!selectedUser) return;
    const fresh = availableUsers.find((user) => Number(user.id) === Number(selectedUser.id));
    if (!fresh) return;
    if (fresh.is_online !== selectedUser.is_online || fresh.last_seen !== selectedUser.last_seen) {
      setSelectedUser((prev) => ({ ...prev, is_online: fresh.is_online, last_seen: fresh.last_seen }));
    }
  }, [availableUsers, selectedUser]);

  // Poll chat messages for selected user
  useEffect(() => {
    if (!isOpen || !selectedUser || !activeUser?.id) return;

    let isMounted = true;

    const fetchChat = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/chat/${activeUser.id}/${selectedUser.id}`
        );
        if (isMounted) {
          setMessages(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchChat();
    // Mark messages as read when opening conversation
    const sessionId = sessionStorage.getItem('sessionId');
    const requestOptions = sessionId ? { headers: { 'X-Session-ID': sessionId } } : {};
    axios.post('http://localhost:5000/api/messages/mark-read', { senderId: selectedUser.id }, requestOptions)
      .then(() => window.dispatchEvent(new Event('amis_messages_read')))
      .catch(() => {});
    const interval = setInterval(fetchChat, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, selectedUser, activeUser?.id]);

  useEffect(() => {
    if (!isOpen || !activeUser?.id) return undefined;
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const sessionId = sessionStorage.getItem('sessionId');
        const requestOptions = sessionId ? { headers: { 'X-Session-ID': sessionId } } : {};
        const res = await axios.get('http://localhost:5000/api/messages/unread-summary', requestOptions);
        if (isMounted) {
          setUnreadBySender(res.data?.bySender || {});
        }
      } catch (err) {
        console.error('Error fetching unread summary:', err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, activeUser?.id, selectedUser?.id, messages.length]);

  // Mark messages as delivered when recipient comes online
  useEffect(() => {
    if (!isOpen || !activeUser?.id || !selectedUser) return;

    const markAsDelivered = async () => {
      if (selectedUser.is_online) {
        try {
          await axios.post('http://localhost:5000/api/messages/mark-delivered', { senderId: activeUser.id });
        } catch (err) {
          console.error('Error marking messages as delivered:', err);
        }
      }
    };

    markAsDelivered();
    const interval = setInterval(markAsDelivered, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, activeUser?.id, selectedUser, selectedUser?.is_online]);

  // Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!messageText.trim() && !attachment) || !selectedUser || !activeUser?.id || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('message', messageText.trim());
      formData.append('sender', String(activeUser.id));
      formData.append('receiver', String(selectedUser.id));
      if (attachment) {
        formData.append('attachment', attachment);
      }

      await axios.post('http://localhost:5000/api/messages', formData);
      setMessageText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Immediately refresh messages
      const res = await axios.get(
        `http://localhost:5000/api/messages/chat/${activeUser.id}/${selectedUser.id}`
      );
      const nextMessages = res.data || [];
      setMessages(nextMessages);
      const lastMine = [...nextMessages].reverse().find((msg) => Number(msg.sender) === Number(activeUser.id));
      if (lastMine?.id) {
        setAnimateMessageId(lastMine.id);
        setTimeout(() => setAnimateMessageId((current) => (current === lastMine.id ? null : current)), 700);
      }
    } catch (err) {
      console.error('Send message error:', err);
      alert(mt.sendError);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setMessageText('');
    setAttachment(null);
    setMessages([]);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  // Filter users by search
  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const ururUsers = filteredUsers.filter((u) => ['Urur', 'admin'].includes(u.role));
  const sarkaalUsers = filteredUsers.filter((u) => ['S1', 'S2', 'S3', 'S4'].includes(u.role));
  const horintaUsers = filteredUsers.filter((u) => ['H1', 'H2', 'H3', 'H4'].includes(u.role));
  const medicUsers = filteredUsers.filter((u) => u.role === 'medic');
  const focusableUsers = [...ururUsers, ...sarkaalUsers, ...horintaUsers, ...medicUsers];

  const handleDirectoryKeyDown = (event) => {
    if (!focusableUsers.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setFocusedUserIndex((currentIndex) => (currentIndex + direction + focusableUsers.length) % focusableUsers.length);
      return;
    }

    if (event.key === 'Enter' && focusedUserIndex >= 0) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedUser(focusableUsers[focusedUserIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setExpandedGroups({ urur: false, sarkaal: false, horinta: false, medical: false });
    }
  };

  const renderUserItem = (u) => {
    const isSelected = selectedUser?.id === u.id;
    const userIndex = focusableUsers.findIndex((user) => user.id === u.id);
    const isFocused = focusedUserIndex === userIndex;
    const unreadCount = Number(unreadBySender[String(u.id)] || 0);
    const isUnread = unreadCount > 0;

    return (
      <div
        key={u.id}
        onClick={() => {
          setSelectedUser(u);
          setFocusedUserIndex(focusableUsers.findIndex((user) => user.id === u.id));
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            setSelectedUser(u);
          }
        }}
        tabIndex={0}
        role="option"
        aria-selected={isSelected}
        style={{
          padding: '8px 12px',
          marginBottom: '4px',
          borderRadius: borderRadius.md,
          cursor: 'pointer',
          backgroundColor: isSelected ? colors.primaryLight : (isUnread ? subtleBg : colors.white),
          borderLeft: isSelected ? `3px solid ${colors.primary}` : (isUnread ? `3px solid ${colors.primary}` : '3px solid transparent'),
          borderTop: `1px solid ${colors.borderLight}`,
          borderRight: `1px solid ${colors.borderLight}`,
          borderBottom: `1px solid ${colors.borderLight}`,
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          outline: isFocused ? `2px solid ${colors.primary}` : 'none',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isSelected || isUnread ? accentBg : neutralBg,
            color: isSelected || isUnread ? '#ffffff' : colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '12px',
            flexShrink: 0,
          }}
        >
          {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: (isUnread || isSelected) ? '700' : '600',
              color: isSelected ? colors.primary : (isUnread ? colors.primary : colors.text),
              fontSize: '13px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {u.displayName}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: colors.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                backgroundColor: isSelected ? colors.primaryLight : neutralBg,
                color: isSelected ? colors.primary : colors.textSecondary,
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '9.5px',
                fontWeight: '600',
              }}
            >
              {u.role}
            </span>
            <span style={{ color: u.is_online ? '#16a34a' : colors.textMuted }}>
              {u.is_online ? mt.online : mt.offline}
            </span>
          </div>
        </div>
        {unreadCount > 0 && (
          <span
            style={{
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
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={modalOverlayStyle}
      className="no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <style>
        {`@keyframes amisSendPop { from { transform: translateY(10px) scale(0.94); opacity: 0; } to { transform: none; opacity: 1; } }`}
      </style>
      <div
        style={{
          ...modalContentStyle,
          backgroundColor: colors.white,
          color: colors.text,
          width: '920px',
          maxWidth: '100%',
          height: '620px',
          maxHeight: '92vh',
          padding: 0,
          display: 'flex',
          overflow: 'hidden',
          borderRadius: borderRadius.xl,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* ── LEFT DIRECTORY PANEL ── */}
        <div
          style={{
            width: '300px',
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: subtleBg,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.white,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: accentBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <MessageSquare size={15} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: colors.text }}>
                  {mt.title}
                </h3>
                <span style={{ fontSize: '10.5px', color: colors.textMuted }}>
                  {mt.subtitle}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              title={mt.close}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: colors.textMuted,
                padding: '4px',
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Search bar */}
          <div style={{ padding: '10px 14px', backgroundColor: subtleBg }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                padding: '6px 10px',
              }}
            >
              <Search size={14} color={colors.textMuted} />
              <input
                type="text"
                placeholder={mt.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '12px',
                  color: colors.text,
                }}
              />
              {searchQuery && (
                <X
                  size={14}
                  style={{ cursor: 'pointer', color: colors.textMuted }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>
          </div>

          {/* Continuous User Directory List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* GROUP: TALIYAHA URUR */}
            {ururUsers.length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} onKeyDown={handleDirectoryKeyDown}>
                  {ururUsers.map(renderUserItem)}
                </div>
              </div>
            )}

            {/* GROUP: SARKAALKA (S1-S4) */}
            {sarkaalUsers.length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} onKeyDown={handleDirectoryKeyDown}>
                  {sarkaalUsers.map(renderUserItem)}
                </div>
              </div>
            )}

            {/* GROUP: TALIYAHA HORINTA (H1-H4) */}
            {horintaUsers.length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} onKeyDown={handleDirectoryKeyDown}>
                  {horintaUsers.map(renderUserItem)}
                </div>
              </div>
            )}

            {/* GROUP: CAAFIMAADKA (medic) */}
            {medicUsers.length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} onKeyDown={handleDirectoryKeyDown}>
                  {medicUsers.map(renderUserItem)}
                </div>
              </div>
            )}

            {availableUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: colors.textMuted, fontSize: '12px' }}>
                {mt.noMembers}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT CHAT CONVERSATION PANEL ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.white,
            position: 'relative',
          }}
        >
          {selectedUser ? (
            <>
              {/* Active Header */}
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: colors.white,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: accentBg,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                    }}
                  >
                    {selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: colors.text }}>
                      {selectedUser.displayName}
                    </h4>
                    <span style={{ fontSize: '11px', color: selectedUser.is_online ? '#16a34a' : colors.textMuted }}>
                      {formatLastSeen(selectedUser)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{
                      background: neutralBg,
                      border: 'none',
                      borderRadius: borderRadius.sm,
                      padding: '5px 9px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: colors.textSecondary,
                      fontWeight: '600',
                    }}
                  >
                    {mt.closeChat}
                  </button>
                </div>
              </div>

              {/* Messages stream */}
              <div
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: subtleBg,
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{mt.noMessages}</p>
                    <p style={{ margin: 0, fontSize: '12px' }}>{mt.startHint}</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = Number(msg.sender_id || msg.sender) === Number(activeUser?.id);
                    const shouldAnimate = isMine && animateMessageId && Number(msg.id) === Number(animateMessageId);
                    const fileLabel = msg.attachment_original_name || msg.attachment;
                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '72%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                          animation: shouldAnimate ? 'amisSendPop 0.45s ease' : 'none',
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: isMine ? accentBg : colors.white,
                            color: isMine ? '#ffffff' : colors.text,
                            padding: '9px 14px',
                            borderRadius: isMine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                            fontSize: '13px',
                            lineHeight: '1.45',
                            boxShadow: colors.shadowSm,
                            border: isMine ? 'none' : `1px solid ${colors.border}`,
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.message && <div>{msg.message}</div>}

                          {msg.attachment && (
                            <div style={{ marginTop: msg.message ? '6px' : 0 }}>
                              {isImageAttachment(msg) ? (
                                <a
                                  href={attachmentUrl(msg.attachment)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'block' }}
                                >
                                  <img
                                    src={attachmentUrl(msg.attachment)}
                                    alt={fileLabel || mt.image}
                                    style={{
                                      maxWidth: '180px',
                                      maxHeight: '140px',
                                      borderRadius: '6px',
                                      display: 'block',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </a>
                              ) : (
                                <div
                                  style={{
                                    backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : subtleBg,
                                    border: isMine ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${colors.border}`,
                                    borderRadius: '6px',
                                    padding: '8px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    maxWidth: '200px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>{getFileIcon(msg)}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: '600',
                                          color: isMine ? '#ffffff' : colors.text,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {fileLabel}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: '9px',
                                          color: isMine ? 'rgba(255,255,255,0.8)' : colors.textMuted,
                                        }}
                                      >
                                        {getFileTypeLabel(msg)} {formatFileSize(msg.attachment_size)}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                    <a
                                      href={attachmentUrl(msg.attachment)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '9px',
                                        fontWeight: '600',
                                        color: isMine ? '#ffffff' : colors.primary,
                                        textDecoration: 'none',
                                        padding: '3px 6px',
                                        backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primaryLight,
                                        borderRadius: '3px',
                                      }}
                                    >
                                      <ExternalLink size={8} />
                                      {mt.open}
                                    </a>
                                    <a
                                      href={attachmentUrl(msg.attachment)}
                                      download={fileLabel}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '9px',
                                        fontWeight: '600',
                                        color: isMine ? '#ffffff' : colors.primary,
                                        textDecoration: 'none',
                                        padding: '3px 6px',
                                        backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primaryLight,
                                        borderRadius: '3px',
                                      }}
                                    >
                                      <Download size={8} />
                                      {mt.saveAs}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', padding: '0 4px' }}>
                          {msg.created_at && (
                            <span style={{ fontSize: '9.5px', color: colors.textLight }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {getMessageStatusIcon(msg)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${colors.border}`,
                  backgroundColor: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      // File size validation (15MB max)
                      if (file.size > 15 * 1024 * 1024) {
                        alert(mt.fileTooLarge);
                        e.target.value = '';
                        return;
                      }
                      // File type validation
                      const ext = file.name.split('.').pop().toLowerCase();
                      const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'js', 'jar', 'app', 'deb', 'rpm', 'dmg'];
                      if (dangerousExtensions.includes(ext)) {
                        alert(mt.fileBlocked);
                        e.target.value = '';
                        return;
                      }
                      setAttachment(file);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={mt.attach}
                  style={{
                    background: attachment ? colors.primaryLight : neutralBg,
                    color: attachment ? colors.primary : colors.textMuted,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Paperclip size={16} />
                </button>

                <input
                  type="text"
                  placeholder={attachment ? mt.filePlaceholder(attachment.name) : mt.messagePlaceholder}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{
                    flex: 1,
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.border}`,
                    fontSize: '13px',
                    color: colors.text,
                    outline: 'none',
                    backgroundColor: colors.white,
                  }}
                />

                <button
                  type="submit"
                  disabled={isSending || (!messageText.trim() && !attachment)}
                  style={{
                    ...buttonPrimaryStyle,
                    height: '36px',
                    padding: '0 14px',
                    fontSize: '13px',
                    opacity: (!messageText.trim() && !attachment) ? 0.6 : 1,
                  }}
                >
                  <Send size={15} />
                  <span>{mt.send}</span>
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                textAlign: 'center',
                color: colors.textMuted,
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: neutralBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary,
                  marginBottom: '14px',
                }}
              >
                <MessageSquare size={24} />
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: colors.text, fontWeight: '700' }}>
                {mt.centerTitle}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '300px', lineHeight: 1.5 }}>
                {mt.centerHint}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
