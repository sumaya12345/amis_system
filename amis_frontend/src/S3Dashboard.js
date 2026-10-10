import Swal from 'sweetalert2';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Bell, X, Paperclip, Send, Camera, Check, CheckCheck, Lock, Save, MessageSquare, PieChart, FileText, Users, Settings, LogOut, Menu, Moon, HelpCircle, LayoutDashboard, Clock, Printer } from 'lucide-react';
import FariimahaModal from './FariimahaModal';
import ProfileImage from './ProfileImage';
import { useAuthUser, updateAuthUser, getProfilePicUrl, getAuthConfig } from './authSync';
import Sidebar from './components/Sidebar';
import PasswordInput from './components/PasswordInput';
import { colors, cardStyle, tableStyle, tableHeaderStyle, tableCellStyle, buttonPrimaryStyle, buttonSecondaryStyle, buttonDangerStyle, inputStyle, labelStyle, emptyStateStyle, modalOverlayStyle, modalContentStyle, modalHeaderStyle, modalTitleStyle, borderRadius, badgeStyle, badgeSuccessStyle, badgeWarningStyle, badgeErrorStyle, getColors } from './designSystem';
// --- MESSENGER COMPONENT (REVISED) ---
function MessengerH1({ isOpen, onClose, activeUser}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageFile, setMessageFile] = useState(null);
  const [realUsers, setRealUsers] = useState([]);
  const [expandedUserIds, setExpandedUserIds] = useState([]);

  const getUserDisplayName = (user) => {
    if (user.role === 'Urur') return 'Taliyaha Urur';
    if (user.role === 'medic') return 'Medical / Mo';
    if (user.role === 'admin') return 'Admin';
    return user.role || user.username || 'User';
  };

  useEffect(() => {
    if (!isOpen) return;

    axios.get('http://localhost:5000/api/users')
      .then((res) => {
        // S3 can only message: H1, Talye Urur, Medical, Admin
        const filtered = (res.data || []).filter((user) => 
          ['H1', 'Urur', 'medic', 'admin'].includes(user.role)
        );
        setRealUsers(filtered);
      })
      .catch((err) => console.error('Error loading S3 users:', err));
  }, [isOpen]);

  useEffect(() => {
    if (activeUser?.id && selectedUser?.id) {
      axios.get(`http://localhost:5000/api/messages/chat/${activeUser.id}/${selectedUser.id}`)
        .then((res) => setMessages(res.data || []))
        .catch((err) => console.error('Error loading messages:', err));
    }
  }, [activeUser, selectedUser]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setMessage('');
      setMessages([]);
      setMessageFile(null);
      setExpandedUserIds([]);
    }
  }, [isOpen]);

  const toggleUser = (userId) => {
    setExpandedUserIds((prev) => prev.includes(userId)
      ? prev.filter((id) => id !== userId)
      : [...prev, userId]);
  };

  const openConversation = async (user) => {
    setSelectedUser(user);
    if (!expandedUserIds.includes(user.id)) {
      setExpandedUserIds((prev) => [...prev, user.id]);
    }
    
    // Mark messages as read when opening conversation
    if (activeUser?.id && user?.id) {
      try {
        const sessionId = sessionStorage.getItem('sessionId');
        const requestOptions = sessionId ? { headers: { 'X-Session-ID': sessionId } } : {};
        await axios.post('http://localhost:5000/api/messages/mark-read',
          { senderId: user.id },
          requestOptions
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !messageFile) return;
    if (!selectedUser || !activeUser?.id) return;

    const formData = new FormData();
    formData.append('message', message);
    formData.append('sender', String(activeUser.id));
    formData.append('receiver', String(selectedUser.id));
    if (messageFile) formData.append('attachment', messageFile);

    try {
      await axios.post('http://localhost:5000/api/messages', formData);
      setMessage('');
      setMessageFile(null);
      const res = await axios.get(`http://localhost:5000/api/messages/chat/${activeUser.id}/${selectedUser.id}`);
      setMessages(res.data || []);
    } catch (error) {
      console.error('Message send failed:', error);
      alert('Fariinta ma bixin karto');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
      <div style={{ width: '900px', height: '640px', backgroundColor: '#fff', borderRadius: '20px', display: 'flex', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '300px', borderRight: '1px solid #eee', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
          <div style={{ padding: '25px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Fariimaha</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {realUsers.map((user) => {
              const isSelected = selectedUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => openConversation(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 18px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f5fa' : 'transparent',
                    borderLeft: isSelected ? '4px solid #0f1f38' : '4px solid transparent',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0f1f38', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: '700' }}>
                    {user.role?.slice(0, 2) || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>{getUserDisplayName(user)}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{user.username || user.role}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#555' }}>←</button>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2ecc71' }}></div>
                  <span style={{ fontWeight: '700' }}>{getUserDisplayName(selectedUser)}</span>
                </div>
                <X size={22} style={{ cursor: 'pointer', color: '#999' }} onClick={onClose} />
              </div>

              <div style={{ flex: 1, padding: '20px', backgroundColor: '#f0f2f5', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <div style={{ color: '#777', textAlign: 'center', marginTop: '20px' }}>No messages yet.</div>
                ) : messages.map((msg) => {
                  const isMe = Number(msg.sender_id || msg.sender) === Number(activeUser.id);
                  return (
                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ backgroundColor: isMe ? '#5d5fef' : '#fff', color: isMe ? 'white' : '#333', padding: '10px 15px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Now'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #eee' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input 
                    type="file" 
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        // File size validation (15MB max)
                        if (file.size > 15 * 1024 * 1024) {
                          alert('File size exceeds 15MB limit. Please choose a smaller file.');
                          e.target.value = '';
                          return;
                        }
                        // File type validation
                        const ext = file.name.split('.').pop().toLowerCase();
                        const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'js', 'jar', 'app', 'deb', 'rpm', 'dmg'];
                        if (dangerousExtensions.includes(ext)) {
                          alert('This file type is not allowed for security reasons.');
                          e.target.value = '';
                          return;
                        }
                        setMessageFile(file);
                      }
                    }} 
                  />
                  <Paperclip size={22} style={{ color: messageFile ? '#2ecc71' : '#5d5fef' }} />
                </label>
                <input
                  type="text"
                  placeholder="Qor fariin..."
                  style={{ flex: 1, border: '1px solid #ddd', padding: '12px 15px', borderRadius: '25px', outline: 'none', background: '#f8f9fa' }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} style={{ background: '#5d5fef', border: 'none', width: '45px', height: '45px', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999' }}>Dooro qof aad la hadashid</div>
          )}
        </div>
      </div>
    </div>
  );
}



// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';

// Language translations
export const translations = {
  en: {
    settings: 'Settings',
    manageAccount: 'Manage your account information and security.',
    profile: 'Profile',
    security: 'Security',
    appearance: 'Appearance',
    nightMode: 'Night Mode',
    appearanceDesc: 'Change the appearance for this account.',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    contactInfo: 'Contact info',
    passwordSecurity: 'Password and security',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    updatePassword: 'Update password',
    language: 'Language',
    selectLanguage: 'Select your preferred language',
    username: 'Username',
    // Registration form
    registrationTitle: 'Soldier Registration',
    registrationDesc: 'Please complete the soldier information accurately',
    profileImage: 'Profile Picture',
    selectProfileImage: 'Select soldier image',
    imageSelected: 'Image selected:',
    personalInfo: 'Personal Information',
    physicalInfo: 'Physical Information',
    birthInfo: 'Birth Information',
    sarkaalId: 'Sarkaal ID',
    fullName: 'Full Name',
    weight: 'Weight (kg)',
    bloodType: 'Blood Type',
    height: 'Height (cm)',
    birthPlace: 'Birth Place',
    birthDate: 'Birth Date',
    saveData: 'Save Data',
    closeForm: 'CLOSE FORM',
    // Soldier list
    soldierListTitle: 'Soldier Registration',
    soldierListDesc: 'Manage soldier data here',
    searchPlaceholder: 'Search by name or ID...',
    clear: 'Clear',
    total: 'Total',
    soldiers: 'soldiers',
    noSoldiers: 'No soldiers found',
    noSoldiersDesc: 'Please change search or start new registration',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    dashboard: 'Dashboard',
    reports: 'Reports',
    soldierData: 'Soldier Data',
    analytics: 'Analytics',
    messages: 'Messages',
    logout: 'Logout',
    confirmDeleteTitle: 'Are you sure?',
    confirmDeleteText: 'This soldier record will be permanently deleted.',
    confirmDelete: 'Delete',
    dismiss: 'Cancel',
    deleteSuccess: 'Soldier deleted successfully.',
    deleteError: 'The soldier could not be deleted.',
    updateSuccess: 'Soldier updated successfully.',
    updateError: 'The soldier could not be updated.',
    initiate: 'Initiate',
    sentToMedical: 'Sent to Medical',
    pending: 'Pending'
  },
  so: {
    settings: 'Dhigmaadka',
    manageAccount: 'Maareeyo macluumaadka akoonkaaga iyo amnigaaga.',
    profile: 'Profiilka',
    security: 'Amniga',
    appearance: 'Caddaanka',
    nightMode: 'Hore Noqodka',
    appearanceDesc: 'Beddel caddaanka akoonkan.',
    saveChanges: 'Kaydi Isbeddeldada',
    saving: 'Waa kaydiyaan...',
    contactInfo: 'Macluumaadka Xiriirka',
    passwordSecurity: 'Ereyga sirta iyo amniga',
    currentPassword: 'Ereyga sirta hadda',
    newPassword: 'Ereyga sirta cusub',
    confirmNewPassword: 'Caddan erayga sirta cusub',
    updatePassword: 'Beddel erayga sirta',
    language: 'Luqadda',
    selectLanguage: 'Dooro luqadda aad jeceshahay',
    username: 'Magaca isticmaalka',
    // Registration form
    registrationTitle: 'Diiwaangelinta Layli Saraakiisha',
    registrationDesc: 'Fadlan buuxi xogta sarkaalka si dhab ah',
    profileImage: 'Sawirka Profile-ka',
    selectProfileImage: 'Dooro sawir sarkaalka',
    imageSelected: 'Sawir la dooratay:',
    personalInfo: 'Xogta Shakhsiga',
    physicalInfo: 'Xogta Jirka',
    birthInfo: 'Xogta Dhalashada',
    sarkaalId: 'Sarkaal ID',
    fullName: 'Magaca Dhammaystiran',
    weight: 'Culayska (kg)',
    bloodType: 'Nooca Dhiigga',
    height: 'Dhirirka (cm)',
    birthPlace: 'Goobta Dhalashada',
    birthDate: 'Taariikhda Dhalashada',
    saveData: 'Keydi Xogta',
    closeForm: 'XIR FORMKA',
    // Soldier list
    soldierListTitle: 'Diiwaangelinta Layli Saraakiisha',
    soldierListDesc: 'Halka aad maamasho xogta askarta',
    searchPlaceholder: 'Ku raadi Magaca ama ID-ga...',
    clear: 'Nadiif',
    total: 'Wadarta',
    soldiers: 'askar',
    noSoldiers: 'Lama helin askar',
    noSoldiersDesc: 'Fadlan isbedel raadinta ama bilow diiwaangelinta cusub',
    view: 'Eeg',
    edit: 'Beddel',
    delete: 'Tirtir',
    save: 'Kaydi',
    cancel: 'Jooji',
    dashboard: 'Dashboard',
    reports: 'Warbixinada',
    soldierData: 'Xogta Askarta',
    analytics: 'Tirakoob',
    messages: 'Fariimaha',
    logout: 'Ka bax',
    confirmDeleteTitle: 'Ma hubtaa?',
    confirmDeleteText: 'Xogta sarkaalkan si joogto ah ayaa loo tirtirayaa.',
    confirmDelete: 'Haye, Tirtir',
    dismiss: 'Maya',
    deleteSuccess: 'Sarkaalka si guul leh ayaa loo tirtiray.',
    deleteError: 'Sarkaalkan lama tirtiri karo.',
    updateSuccess: 'Xogta sarkaalkan si guul leh ayaa loo beddelay.',
    updateError: 'Xogta sarkaalkan lama beddeli karo.',
    initiate: 'Bilaab',
    sentToMedical: 'Caafimaadka loo diray',
    pending: 'Sugaya'
  },
  tr: {
    settings: 'Ayarlar',
    manageAccount: 'Hesap bilgilerinizi ve güvenliğinizi yönetin.',
    profile: 'Profil',
    security: 'Güvenlik',
    appearance: 'Görünüm',
    nightMode: 'Gece Modu',
    appearanceDesc: 'Bu hesap için görünümü değiştirin.',
    saveChanges: 'Değişiklikleri Kaydet',
    saving: 'Kaydediliyor...',
    contactInfo: 'İletişim bilgileri',
    passwordSecurity: 'Şifre ve güvenlik',
    currentPassword: 'Mevcut şifre',
    newPassword: 'Yeni şifre',
    confirmNewPassword: 'Yeni şifreyi onayla',
    updatePassword: 'Şifreyi güncelle',
    language: 'Dil',
    selectLanguage: 'Tercih ettiğiniz dili seçin',
    username: 'Kullanıcı adı',
    // Registration form
    registrationTitle: 'Asker Kaydı',
    registrationDesc: 'Lütfen asker bilgilerini doğru şekilde tamamlayın',
    profileImage: 'Profil Resmi',
    selectProfileImage: 'Asker resmi seçin',
    imageSelected: 'Resim seçildi:',
    personalInfo: 'Kişisel Bilgiler',
    physicalInfo: 'Fiziksel Bilgiler',
    birthInfo: 'Doğum Bilgileri',
    sarkaalId: 'Asker ID',
    fullName: 'Tam Ad',
    weight: 'Kilo (kg)',
    bloodType: 'Kan Grubu',
    height: 'Boy (cm)',
    birthPlace: 'Doğum Yeri',
    birthDate: 'Doğum Tarihi',
    saveData: 'Veriyi Kaydet',
    closeForm: 'FORMU KAPAT',
    // Soldier list
    soldierListTitle: 'Asker Kaydı',
    soldierListDesc: 'Asker verilerini buradan yönetin',
    searchPlaceholder: 'İsim veya ID ile ara...',
    clear: 'Temizle',
    total: 'Toplam',
    soldiers: 'asker',
    noSoldiers: 'Asker bulunamadı',
    noSoldiersDesc: 'Lütfen aramayı değiştirin veya yeni kayıt başlatın',
    view: 'Görüntüle',
    edit: 'Düzenle',
    delete: 'Sil',
    save: 'Kaydet',
    cancel: 'İptal',
    dashboard: 'Panel',
    reports: 'Raporlar',
    soldierData: 'Asker Verileri',
    analytics: 'Analiz',
    messages: 'Mesajlar',
    logout: 'Çıkış',
    confirmDeleteTitle: 'Emin misiniz?',
    confirmDeleteText: 'Bu asker kaydı kalıcı olarak silinecek.',
    confirmDelete: 'Sil',
    dismiss: 'İptal',
    deleteSuccess: 'Asker başarıyla silindi.',
    deleteError: 'Asker silinemedi.',
    updateSuccess: 'Asker başarıyla güncellendi.',
    updateError: 'Asker güncellenemedi.',
    initiate: 'Başlat',
    sentToMedical: 'Sağlığa gönderildi',
    pending: 'Bekliyor'
  }
};

export function SettingsPage({ user, onThemeChange, darkMode: parentDarkMode, language: parentLanguage, onLanguageChange }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const authUser = useAuthUser(user);
  const [activeUser, setActiveUser] = useState(authUser || user || null);
  const [modalMode, setModalMode] = useState('add');

  useEffect(() => {
    if (authUser) {
      setActiveUser(authUser);
      setNewUsername(authUser.username || "");
    }
  }, [authUser]);

  useEffect(() => {
    if (parentLanguage) {
      setSelectedLanguage(parentLanguage);
    }
  }, [parentLanguage]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('amis_language');
    if (savedLanguage && !parentLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, [parentLanguage]); 

  // Use parent darkMode state instead of local state
  const isDarkMode = parentDarkMode;
  
  // STATES-KA SETTINGS
  const [isLoading, setIsLoading] = useState(false);
  const [userContacts, setUserContacts] = useState(activeUser?.contacts || []); 
  const [newUsername, setNewUsername] = useState(activeUser?.username || "");
  const [securitySubTab, setSecuritySubTab] = useState('menu'); 
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeProfilePic, setRemoveProfilePic] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return parentLanguage || localStorage.getItem('amis_language') || 'en';
  });

  const t = translations[selectedLanguage] || translations.en;

  // --- STATE-KA XALLINAYA CILADDA UPDATE-KA ---
  const [selectedContactId, setSelectedContactId] = useState(null);

  // --- STATES-KA EMAIL VALIDATION-KA (CUSUB) ---
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Marka la badalo toggle-ka
  const toggleDarkMode = () => {
    const nextDarkMode = !isDarkMode;
    if (activeUser?.id) localStorage.setItem(`amis_theme_${activeUser.id}`, nextDarkMode ? 'dark' : 'light');
    if (onThemeChange) onThemeChange(nextDarkMode);
  };

  // Styles
  const settingsInputStyle  = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '15px' };
  const settingRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f0f2f5' };
  
  const tabButtonStyle = (tab) => ({
    padding: '12px 25px',
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? '#0f1f38' : 'transparent',
    color: activeTab === tab ? '#fff' : '#475569',
    borderRadius: '8px',
    fontWeight: '600',
    transition: '0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  // FUNCTION-KA KASOO QAADISTA CONTACTS-KA
  const fetchUserContacts = (userId) => {
    axios.get(`http://localhost:5000/api/get-contacts/${userId}`)
        .then(res => { 
          if(res.data.success) {
            setUserContacts(res.data.contacts);
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            currentUser.contacts = res.data.contacts;
            localStorage.setItem('user', JSON.stringify(currentUser));
          } 
        }).catch(err => console.error("Error fetching contacts:", err));
  };

  useEffect(() => {
    if (activeUser?.id) {
      fetchUserContacts(activeUser.id);
    }
  }, [activeUser?.id]);

  // --- ISBEDDELKA WEYN: REAL-TIME SECURE BACKEND EMAIL VALIDATION ---
  useEffect(() => {
    if (!newEmail.trim()) {
      setEmailError("");
      setIsEmailValid(false);
      return;
    }

    // Nidaamka Debounce (Wuxuu sugayaa 0.6 ilbiriqsi si uusan Server-ka u mashquulin marka qofku wax qorayo)
    const delayDebounce = setTimeout(async () => {
      setIsCheckingEmail(true);
      setEmailError("");
      try {
        const res = await axios.post('http://localhost:5000/api/validate-and-save-email', {
          email: newEmail,
          userId: activeUser?.id,
          action: 'validate' // Kaliya in la xaqiijiyo dhabnimadiisa
        });

        if (res.data.success) {
          setEmailError("Email verified successfully."); // Farriinta guusha (Qodobka 6)
          setIsEmailValid(true);
        }
      } catch (err) {
        // Farriinta rasmiga ah ee aad dalbatay haddii la waayo iimaylka dhabta ah (Qodobka 5)
          setEmailError(err.response?.data?.message || "Please enter a valid Gmail address with a reachable mail domain.");
        setIsEmailValid(false);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [newEmail, activeUser?.id]);

  // Kaliya input-ka ayaa lala soconayaa marka uu isbeddelo
  const validateEmailRealtime = (email) => {
    setNewEmail(email);
    setEmailOtp('');
    setEmailOtpSent(false);
    setEmailOtpVerified(false);
    setIsEmailValid(false);
    const validFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailError(validFormat ? 'Email format looks valid. Please send and verify the OTP.' : 'Please enter a valid email address format.');
    setIsEmailValid(validFormat);
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Please enter a valid email address first.');
      setIsEmailValid(false);
      return;
    }

    setSendingOtp(true);
    setEmailError('');
    try {
      const res = await axios.post('http://localhost:5000/api/send-contact-otp', {
        userId: activeUser?.id,
        type: 'email',
        value: newEmail
      }, { timeout: 15000 });
      setEmailOtpSent(true);
      setEmailError(res.data.message || 'Verification code sent.');
      setIsEmailValid(true);
    } catch (err) {
      setEmailOtpSent(false);
      setEmailOtpVerified(false);
      setEmailError(err.response?.data?.message || 'Unable to send the verification code.');
      setIsEmailValid(false);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) {
      setEmailError('Please enter the OTP code sent to the email.');
      return;
    }

    setVerifyingOtp(true);
    setEmailError('');
    try {
      const res = await axios.post('http://localhost:5000/api/verify-contact-otp', {
        userId: activeUser?.id,
        type: 'email',
        value: newEmail,
        otp: emailOtp
      }, { timeout: 15000 });
      setEmailOtpVerified(true);
      setEmailError(res.data.message || 'Email verified successfully.');
      setIsEmailValid(true);
    } catch (err) {
      setEmailOtpVerified(false);
      setEmailError(err.response?.data?.message || 'Verification failed.');
      setIsEmailValid(false);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!/^\+[1-9]\d{7,14}$/.test(newPhone.trim())) {
      return alert('Enter a valid phone number in international format.');
    }
    setSendingOtp(true);
    try {
      const res = await axios.post('http://localhost:5000/api/send-contact-otp', { userId: activeUser?.id, type: 'phone', value: newPhone.trim() });
      setPhoneOtpSent(true);
      alert(res.data.message);
    } catch (err) {
      setPhoneOtpSent(false);
      alert(err.response?.data?.message || 'Unable to send the SMS verification code.');
    } finally { setSendingOtp(false); }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) return alert('Enter the verification code sent to your phone.');
    setVerifyingOtp(true);
    try {
      const res = await axios.post('http://localhost:5000/api/verify-contact-otp', { userId: activeUser?.id, type: 'phone', value: newPhone.trim(), otp: phoneOtp });
      setPhoneOtpVerified(true);
      alert(res.data.message);
    } catch (err) {
      setPhoneOtpVerified(false);
      alert(err.response?.data?.message || 'Phone verification failed.');
    } finally { setVerifyingOtp(false); }
  };

  // FUNCTION-KA SAVE PROFILE CHANGES
  const handleSaveSettings = async () => {
    if (!activeUser?.id) return alert('Cilad: User ID lama helin.');
    if (newProfilePic && (!newProfilePic.type.startsWith('image/') || newProfilePic.size > 5 * 1024 * 1024)) {
      return alert('Dooro sawir sax ah oo ka yar 5MB.');
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('username', newUsername);
    formData.append('userId', activeUser.id);
    if (newProfilePic) formData.append('profile_pic', newProfilePic);
    else if (removeProfilePic) formData.append('removeProfilePic', 'true');

    try {
      const response = await axios.post('http://localhost:5000/api/update-profile', formData, getAuthConfig());
      if (response.data.success) {
        const updatedPic = response.data.picRemoved ? null : (response.data.pic || activeUser.pic);
        const updatedUser = updateAuthUser({ username: newUsername.trim(), pic: updatedPic });
        setActiveUser(updatedUser);
        setNewProfilePic(null);
        setPreviewUrl(null);
        setRemoveProfilePic(false);
        alert("Waa la cusboonaysiiyay");
      }
    } catch (err) {
      alert("Cillad ayaa dhacday");
    } finally { setIsLoading(false); }
  };

  // FUNCTION-KA TIRTIRAYA EMAIL-KA AMA NUMBER-KA
  const handleDeleteContact = async (type) => {
    if (!selectedContactId) return alert("Cilad: Xogta la tirtirayo lama aqoonsan!");
    if (!window.confirm(`Ma hubtaa inaad rabto inaad tirtirto ${type}-kaan?`)) return;

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/delete-contact', {
        contactId: selectedContactId,
        userId: activeUser?.id
      });

      if (response.data.success) {
        type === 'email' ? setShowEmailModal(false) : setShowPhoneModal(false);
        setSelectedContactId(null);
        alert(`Si guul leh ayaa loo tirtiray!`);
        fetchUserContacts(activeUser.id);
      } else {
        alert(response.data.message || "Xogta lama tirtiri karo.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Cilad ayaa dhacday intii tirtirista lagu guda jiray.");
    } finally {
      setIsLoading(false);
    }
  };

  // FUNCTION-KA UPDATE CONTACT
  const handleUpdateContact = async (type) => {
    if ((type === 'email' && !emailOtpVerified) || (type === 'phone' && !phoneOtpVerified)) {
      alert(`Please verify the ${type} with its OTP before saving it.`);
      return;
    }

    if (!selectedContactId) return alert("Cilad: Fadlan dooro contact-ka aad rabto inaad wax ka beddesho!");
    const value = type === 'email' ? newEmail : newPhone;
    if (!value) return alert(`Fadlan buuxi meesha banaan!`);

    setIsLoading(true);
    try {
        const response = await axios.post('http://localhost:5000/api/update-contact', {
            contactId: selectedContactId, 
            value: value,
            type: type,
            otpVerified: type === 'email' ? emailOtpVerified : phoneOtpVerified
        });

        if (response.data.success) {
            type === 'email' ? setShowEmailModal(false) : setShowPhoneModal(false);
            setSelectedContactId(null);
            setEmailError("");
            setEmailOtp('');
            setEmailOtpSent(false);
            setEmailOtpVerified(false);
            alert("Xogta si guul leh ayaa loo beddelay!");
            fetchUserContacts(activeUser.id);
        } else {
            alert(response.data.message || "Xogta lama kaydin karo.");
        }
    } catch (error) {
        alert(error.response?.data?.message || "Cilad! Xogta lama kaydin karo.");
    } finally {
        setIsLoading(false);
    }
  };

  // FUNCTION-KA KUSOO DARISTA CONTACT CUSUB
  const handleAddContact = async (type) => {
    if ((type === 'email' && !emailOtpVerified) || (type === 'phone' && !phoneOtpVerified)) {
      alert(`Please verify the ${type} with its OTP before saving it.`);
      return;
    }

    const value = type === 'email' ? newEmail : newPhone;
    if (!value) return alert(`Fadlan buuxi meesha banaan ee ${type}-ka!`);

    setIsLoading(true);
    try {
        const response = await axios.post('http://localhost:5000/api/add-contact', {
            userId: activeUser?.id, 
            type: type,
            value: value,
            otpVerified: type === 'email' ? emailOtpVerified : phoneOtpVerified
        });

        if (response.data.success) {
            type === 'email' ? setShowEmailModal(false) : setShowPhoneModal(false);
            setEmailError("");
            setEmailOtp('');
            setEmailOtpSent(false);
            setEmailOtpVerified(false);
            alert(`Si guul leh ayaa loo daray ${type}-ka cusub!`);
            fetchUserContacts(activeUser.id); 
        } else {
            alert(response.data.message || "Xogta lama dhalin karo.");
        }
    } catch (error) {
        alert(error.response?.data?.message || "Cilad ayaa dhacday intii xogta la kaydinayay.");
    } finally {
        setIsLoading(false);
    }
  };


  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return alert('Buuxi dhammaan meelaha password-ka.');
    if (newPassword !== confirmPassword) return alert('Password-yada cusub isma waafaqayaan.');
    if (newPassword.length < 6) return alert('Password-ka cusub waa inuu ka koobnaadaa ugu yaraan 6 xaraf.');
    setIsLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/user/${activeUser.id}/password`, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password-ka si guul leh ayaa loo beddelay.');
    } catch (err) {
      alert(err.response?.data?.message || 'Password-ka lama beddeli karin.');
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#1a2a6c', marginBottom: '10px' }}>{t.settings}</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>{t.manageAccount}</p>

      {/* TABS MENU */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: '#f0f2f5', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
        <button style={tabButtonStyle('profile')} onClick={() => setActiveTab('profile')}>{t.profile}</button>
        <button style={tabButtonStyle('security')} onClick={() => setActiveTab('security')}>{t.security}</button>
        <button style={tabButtonStyle('display')} onClick={() => setActiveTab('display')}>{t.appearance}</button>
      </div>

      <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
        
        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {previewUrl ? <img src={previewUrl} style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0f1f38' }} alt="Profile" /> : <ProfileImage pic={removeProfilePic ? null : (activeUser?.pic || activeUser?.profile_pic)} style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0f1f38' }} alt="Profile" />}
              <label htmlFor="pic-upload" style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#0f1f38', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>📸</label>
              <input id="pic-upload" type="file" hidden accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) { setNewProfilePic(file); setPreviewUrl(URL.createObjectURL(file)); setRemoveProfilePic(false); }
              }} />
            </div>
            {(previewUrl || (activeUser?.pic || activeUser?.profile_pic)) && !removeProfilePic && (
              <div>
                <button
                  type="button"
                  onClick={() => { setNewProfilePic(null); setPreviewUrl(null); setRemoveProfilePic(true); }}
                  style={{ marginTop: '10px', background: 'none', border: 'none', color: '#b91c1c', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  Remove Picture
                </button>
              </div>
            )}
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              <label>{t.username}</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={inputStyle} />
              <button onClick={handleSaveSettings} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#0f1f38', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{isLoading ? t.saving : t.saveChanges}</button>
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
              <div>
                <strong>{t.nightMode}</strong>
                <p style={{ margin: '6px 0 0', color: '#666', fontSize: '13px' }}>{t.appearanceDesc}</p>
              </div>
              <button type="button" onClick={toggleDarkMode} style={{ width: '48px', height: '26px', border: 'none', borderRadius: '20px', background: isDarkMode ? '#0f1f38' : '#d1d5db', cursor: 'pointer', position: 'relative' }} aria-label="Toggle night mode">
                <span style={{ display: 'block', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: isDarkMode ? '25px' : '3px', transition: 'left 0.2s' }} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', borderTop: '1px solid #f0f2f5' }}>
              <div>
                <strong>{t.language}</strong>
                <p style={{ margin: '6px 0 0', color: '#666', fontSize: '13px' }}>{t.selectLanguage}</p>
              </div>
              <select 
                value={selectedLanguage} 
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLanguage(newLang);
                  localStorage.setItem('amis_language', newLang);
                  if (onLanguageChange) {
                    onLanguageChange(newLang);
                  }
                }}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', cursor: 'pointer' }}
              >
                <option value="en">English</option>
                <option value="so">Somali</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {securitySubTab === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div onClick={() => setSecuritySubTab('contact')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>👤</span> <strong>{t.contactInfo}</strong></div>
                  <span>›</span>
                </div>
                <div onClick={() => setSecuritySubTab('pass')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>🛡️</span> <strong>{t.passwordSecurity}</strong></div>
                  <span>›</span>
                </div>
              </div>
            )}

            {securitySubTab === 'pass' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => setSecuritySubTab('menu')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
                <h3 style={{ margin: 0 }}>{t.passwordSecurity}</h3>
                <PasswordInput placeholder={t.currentPassword} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} />
                <PasswordInput placeholder={t.newPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
                <PasswordInput placeholder={t.confirmNewPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
                <button onClick={handleUpdatePassword} disabled={isLoading} style={{ padding: '12px', border: 'none', borderRadius: '8px', background: '#0f1f38', color: '#fff', cursor: isLoading ? 'wait' : 'pointer', fontWeight: '600' }}>{isLoading ? t.saving : t.updatePassword}</button>
              </div>
            )}

            {securitySubTab === 'contact' && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <button onClick={() => setSecuritySubTab('menu')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', marginRight: '10px' }}>←</button>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Contact information</h3>
                </div>
                
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #ddd', marginBottom: '20px' }}>
                  {/* EMAILS MAP */}
                  {userContacts && userContacts.filter(c => c.contact_type === 'email').map((email) => (
                    <div 
                      key={`email-${email.id}`} 
                      onClick={() => {
                        setModalMode('update'); 
                        setNewEmail(email.contact_value); 
                        setSelectedContactId(email.id); 
                        setIsEmailValid(true); 
                        setEmailError("");
                        setShowEmailModal(true);
                      }}
                      style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box', cursor: 'pointer', borderBottom: '1px solid #f0f2f5' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '20px' }}>✉️</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: '500', fontSize: '15px', wordBreak: 'break-word' }}>{email.contact_value}</div>
                          <div style={{ fontSize: '12px', color: '#65676b' }}>Email address</div>
                        </div>
                      </div>
                      <span style={{ color: '#bcc0c4', fontSize: '18px', paddingLeft: '10px' }}>›</span>
                    </div>
                  ))}

                  {/* PHONE MAP */}
                  {userContacts && userContacts.filter(c => c.contact_type === 'phone').map((phone) => (
                    <div 
                      key={`phone-${phone.id}`}
                      onClick={() => {
                        setModalMode('update'); 
                        setNewPhone(phone.contact_value); 
                        setPhoneOtp('');
                        setPhoneOtpSent(false);
                        setPhoneOtpVerified(false);
                        setSelectedContactId(phone.id); 
                        setShowPhoneModal(true);
                      }}
                      style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box', cursor: 'pointer', borderBottom: '1px solid #f0f2f5' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '20px' }}>📱</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: '500', fontSize: '15px' }}>{phone.contact_value}</div>
                          <div style={{ fontSize: '12px', color: '#65676b' }}>Mobile number</div>
                        </div>
                      </div>
                      <span style={{ color: '#bcc0c4', fontSize: '18px', paddingLeft: '10px' }}>›</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={() => { setModalMode('add'); setNewEmail(""); setIsEmailValid(false); setEmailError(""); setSelectedContactId(null); setShowEmailModal(true); }} style={{ padding: '14px', borderRadius: '10px', background: '#f0f2f5', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Add new email</button>
                  <button onClick={() => { setModalMode('add'); setNewPhone(""); setPhoneOtp(''); setPhoneOtpSent(false); setPhoneOtpVerified(false); setSelectedContactId(null); setShowPhoneModal(true); }} style={{ padding: '14px', borderRadius: '10px', background: '#f0f2f5', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Add new mobile number</button>
                </div>

                {/* --- EMAIL MODAL (WITH REALTIME BACKEND RESPONSIVENESS) --- */}
                {showEmailModal && (
                  <Modal title={modalMode === 'add' ? "Add New Email" : "Update Email"} onClose={() => { setShowEmailModal(false); setSelectedContactId(null); setEmailError(""); }}>
                    <div style={{ textAlign: 'left' }}>
                      <input 
                        type="email" 
                        placeholder="Gali email-kaaga (Tusaale: ahmed@gmail.com)" 
                        style={{
                          ...inputStyle,
                          border: newEmail === "" ? '1px solid #ddd' : (isEmailValid ? '2px solid #28a745' : '2px solid #dc3545'),
                          outline: 'none',
                          transition: 'border 0.2s ease-in-out'
                        }} 
                        value={newEmail} 
                        onChange={(e) => validateEmailRealtime(e.target.value)} 
                      />
                      
                      {/* MUUJINTA JAWAABTA BACKEND-KA */}
                      {emailError && (
                        <div style={{ 
                          color: isEmailValid ? '#28a745' : '#dc3545', 
                          fontSize: '13px', 
                          marginTop: '6px', 
                          fontWeight: '500' 
                        }}>
                          {isEmailValid ? '✅' : '⚠️'} {emailError}
                        </div>
                      )}

                      {isCheckingEmail && (
                        <div style={{ color: '#0f1f38', fontSize: '12px', marginTop: '5px', fontWeight: '600' }}>
                          🔄 Checking email legitimacy...
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button 
                          onClick={handleSendEmailOtp}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#f0f2f5', color: '#1a2a6c', fontWeight: '700', cursor: 'pointer' }}
                          disabled={sendingOtp || !isEmailValid || isCheckingEmail}
                        >
                          {sendingOtp ? 'Sending...' : (emailOtpSent ? 'Resend OTP' : 'Send OTP')}
                        </button>
                      </div>

                      {emailOtpSent && (
                        <div style={{ marginTop: '12px' }}>
                          <input
                            type="text"
                            placeholder="Enter OTP code"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                            style={{ ...inputStyle, marginTop: '0' }}
                          />
                          <button
                            onClick={handleVerifyEmailOtp}
                            style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            disabled={verifyingOtp || !emailOtp}
                          >
                            {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={() => modalMode === 'add' ? handleAddContact('email') : handleUpdateContact('email')} 
                        style={{ 
                          width: '100%', 
                          marginTop: '20px', 
                          padding: '12px', 
                          background: emailOtpVerified ? '#1a2a6c' : '#ccc', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '8px', 
                          fontWeight: '600',
                          cursor: emailOtpVerified ? 'pointer' : 'not-allowed' 
                        }}
                        disabled={isLoading || !emailOtpVerified || isCheckingEmail} 
                      >
                        {isLoading ? "Saving..." : (modalMode === 'add' ? "Save Email" : "Update Email")}
                      </button>

                      {modalMode === 'update' && (
                        <button 
                          onClick={() => handleDeleteContact('email')}
                          style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                          disabled={isLoading}
                        >
                          {isLoading ? "Deleting..." : "Delete Email"}
                        </button>
                      )}
                    </div>
                  </Modal>
                )}

                {/* --- PHONE MODAL --- */}
                {showPhoneModal && (
                  <Modal title={modalMode === 'add' ? "Add Phone Number" : "Update Phone Number"} onClose={() => { setShowPhoneModal(false); setSelectedContactId(null); }}>
                    <input type="text" placeholder="+252..." style={inputStyle} value={newPhone} onChange={(e) => { setNewPhone(e.target.value); setPhoneOtpSent(false); setPhoneOtpVerified(false); }} />
                    <button onClick={handleSendPhoneOtp} disabled={sendingOtp || phoneOtpVerified} style={{ width: '100%', marginTop: '12px', padding: '12px', background: '#f0f2f5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                      {sendingOtp ? 'Sending...' : phoneOtpSent ? 'Resend verification code' : 'Send verification code'}
                    </button>
                    {phoneOtpSent && (
                      <>
                        <input type="text" placeholder="Enter SMS code" style={{ ...inputStyle, marginTop: '12px' }} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                        <button onClick={handleVerifyPhoneOtp} disabled={verifyingOtp || !phoneOtp || phoneOtpVerified} style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                          {phoneOtpVerified ? 'Phone verified' : verifyingOtp ? 'Verifying...' : 'Verify phone'}
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => modalMode === 'add' ? handleAddContact('phone') : handleUpdateContact('phone')} 
                      style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#1a2a6c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      disabled={isLoading || !phoneOtpVerified}
                    >
                      {isLoading ? "Saving..." : (modalMode === 'add' ? "Save Phone" : "Update Phone")}
                    </button>
                    {modalMode === 'update' && (
                      <button onClick={() => handleDeleteContact('phone')} style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }} disabled={isLoading}>
                        {isLoading ? "Deleting..." : "Delete Phone Number"}
                      </button>
                    )}
                  </Modal>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// export default SettingsPage;
// Helper Modal Component
function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '15px', width: '350px' }}>
        <h4>{title}</h4>
        {children}
        <button onClick={onClose} style={{ width: '100%', marginTop: '10px', background: '#eee', border: 'none', padding: '8px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
function S3Dashboard({ user, onLogout,onLogin, setError, username, password }) {
  console.log("Xogta S3Dashboard soo gaartay:", user);
   const [activePage, setActivePage] = useState('dashboard');
   const [loading, setLoading] = useState(true);
   const [userData, setUserData] = useState(null);
   const [currentUser, setCurrentUser] = useState(null);
   const savedUser = JSON.parse(localStorage.getItem('user'));
  const authUser = useAuthUser(user);
  const [activeUser, setActiveUser] = useState(authUser || user || savedUser);
  
  useEffect(() => {
    if (authUser) {
      setActiveUser(authUser);
    }
  }, [authUser]);
  
  const profilePic = getProfilePicUrl(activeUser?.pic);
  const userName = activeUser?.username || "S3 Officer";
  const [isExpanded, setIsExpanded] = useState(true);
  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    cursor: 'pointer',
    gap: '15px',
    color: isActive ? '#5d5fef' : (darkMode ? '#b3b3b3' : '#666'),
    backgroundColor: isActive ? (darkMode ? '#252545' : '#f0f2ff') : 'transparent',
    borderRadius: '12px',
    margin: '4px 10px',
    transition: '0.2s'
  });
     // --- 1. STATES ---
  const [data, setData] = useState([]);
  const [showNotifyList, setShowNotifyList] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [hoverSave, setHoverSave] = useState(false);
  const [hoverCancel, setHoverCancel] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [editingSarkaal, setEditingSarkaal] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    sarkaal_id: '', name: '', culays: '', dhiiga: '', 
    dhirirka: '', goobta_dhalashada: '', tariikhda_dhalashada: ''
  });
  const [medicalReports, setMedicalReports] = useState([]);
  const [file, setFile] = useState(null);
  const [initiatedList, setInitiatedList] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  // const [activePage, setActivePage] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewedSarkaal, setViewedSarkaal] = useState(null); 
 const [darkMode, setDarkMode] = useState(false); 
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('amis_language') || 'en';
  });
  const t = translations[selectedLanguage] || translations.en;

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'amis_language' && e.newValue) {
        setSelectedLanguage(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
 const [selectedUser, setSelectedUser] = useState(null);
 const [message, setMessage] = useState(''); // Kan wuxuu qabataa qoraalka aad hadda qoreysid
 const [messages, setMessages] = useState([]);
 const [showLargeImg, setShowLargeImg] = useState(false);
 const [showCloseFormModal, setShowCloseFormModal] = useState(false);
 const [isFormClosed, setIsFormClosed] = useState(false);
 const [analyticsData, setAnalyticsData] = useState(null);
 const [imagePreviewSrc, setImagePreviewSrc] = useState(null);
 const [showImagePreview, setShowImagePreview] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => new Date());
const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const countdownTimer = setInterval(() => setCountdownNow(new Date()), 60000);
    return () => clearInterval(countdownTimer);
  }, []);

  // Fetch unread messages count
  useEffect(() => {
    if (!activeUser?.id) return;
    
    const fetchUnreadMessages = async () => {
      try {
        const sessionId = sessionStorage.getItem('sessionId');
        const requestOptions = sessionId ? { headers: { 'X-Session-ID': sessionId } } : {};
        const response = await fetch('http://localhost:5000/api/messages/unread-summary', requestOptions);
        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(Number(data.total) || 0);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [activeUser?.id]);

  const openImagePreview = (src) => {
    setImagePreviewSrc(src);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setImagePreviewSrc(null);
    setShowImagePreview(false);
  };
 
// Styles
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' };
const settingRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f0f2f5' };
 

// Ku dar kuwan inta u dhexaysa function S3Dashboard() { ... }
const [showEmailModal, setShowEmailModal] = useState(false);
const [showPhoneModal, setShowPhoneModal] = useState(false);
const [newEmail, setNewEmail] = useState("");
const [newPhone, setNewPhone] = useState("");
// 1. Marka hore ku dar State cusub dusha sare ee function-kaaga
 const [hoveredRow, setHoveredRow] = useState(null); 
 const availableUsers = [
  { id: 'H1', name: 'Hi ', role: 'Taliyaha Horinka', color: '#2ecc71' },
  { id: 'Mo', name: 'taliyaha Caafimadka', role: 'Medical ', color: '#e74c3c' },
  { id: 'ADMIN', name: 'System Admin', role: 'IT Support', color: '#34495e' }
];
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const textAreaStyle = {
  width: '100%',
  height: '120px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  padding: '12px',
  fontSize: '14px',
  fontFamily: 'inherit',
  backgroundColor: '#fff',
  marginBottom: '10px'
};

const sendBtnStyle = {
  background: '#0f1f38',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: '0.2s'
};

// 'false' waxay ka dhigan tahay inuu markii hore yahay Light Mode.
// --- SIMPLE SVG ICONS (Naqshadda Sawirka) ---
const Icons = {
    Dashboard: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
    ),
    Reports: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    ),
    Users: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    ),
    Logout: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
    ),
    Menu: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    )
  };

  const handleEditClick = (item) => {
    setEditingSarkaal({ ...item }); 
    setShowEditForm(true);   
  };
  const handleUpdate = (e) => {
  e.preventDefault();
  let tempErrors = {}; // Waa inay noqoto Object {} si validation-ku u shaqeeyo

  // 1. Hubi in khaanadaha aysan bannaayn (Required)
  const fields = ['sarkaal_id', 'name', 'culays', 'dhiiga', 'dhirirka', 'goobta_dhalashada', 'tariikhda_dhalashada'];
  fields.forEach(field => {
    if (!editingSarkaal[field]) {
      tempErrors[field] = "Khaanaddan waa qasab (Required)";
    }
  });

  // 2. Hubi Magaca
  if (editingSarkaal.name) {
    const nameParts = editingSarkaal.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      tempErrors.name = "Fadlan qor ugu yaraan 2 magac";
    }
  }

  // 3. Hubi Numbers-ka (Digits only)
  if (editingSarkaal.culays && !/^\d+$/.test(editingSarkaal.culays)) {
    tempErrors.culays = "Culayska waa inuu tiro (digits) keliya ahaadaa";
  }
  if (editingSarkaal.dhirirka && !/^\d+$/.test(editingSarkaal.dhirirka)) {
    tempErrors.dhirirka = "Dhirirka waa inuu tiro (digits) keliya ahaadaa";
  }

  // 4. Unique ID Check
  const idExists = data.find(sarkaal => 
    sarkaal.sarkaal_id === editingSarkaal.sarkaal_id && sarkaal.id !== editingSarkaal.id
  );
  if (idExists) {
    tempErrors.sarkaal_id = `ID-gan waxaa horey u lahaa ${idExists.name}`;
  }

  // Haddii ay jiraan khaladaad, ha gudbin foomka
  setErrors(tempErrors);
  
  // Haddii uu leeyahay wax ka badan 0 error, jooji halkan
  if (Object.keys(tempErrors).length > 0) return;

  // Haddii wax walba sax yihiin, sii wad dirista...
  const updateData = new FormData();
  updateData.append('sarkaal_id', editingSarkaal.sarkaal_id);
  updateData.append('name', editingSarkaal.name);
  updateData.append('culays', editingSarkaal.culays);
  updateData.append('dhiiga', editingSarkaal.dhiiga);
  updateData.append('dhirirka', editingSarkaal.dhirirka);
  updateData.append('goobta_dhalashada', editingSarkaal.goobta_dhalashada);
  updateData.append('tariikhda_dhalashada', editingSarkaal.tariikhda_dhalashada);
  
  if (editingSarkaal.profile_pic instanceof File) {
    updateData.append('profile_pic', editingSarkaal.profile_pic);
  }

  axios.put(`http://localhost:5000/api/s3-data/${editingSarkaal.id}`, updateData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  .then(res => {
    showToast(t.updateSuccess);
    fetchTable();           
    setShowEditForm(false); 
    setErrors({}); // Masax khaladaadka foomku markuu xirmo
  })
  .catch(err => {
    console.error("Error:", err);
    showToast(t.updateError + " " + (err.response?.data?.message || err.message), 'error');
  });
};

const [errors, setErrors] = useState({});

const validate = () => {
  let tempErrors = {};
  const nameParts = (formData.name || "").trim().split(/\s+/);
  const onlyLetters = /^[a-zA-Z\s]+$/;
  const onlyNumbers = /^[0-9]+$/;

  // 1. Required: Inaan meel banaan laga tagin
  if (!formData.sarkaal_id) tempErrors.sarkaal_id = "ID-ga waa loo baahanyahay";
  if (!formData.name) tempErrors.name = "Magaca waa loo baahanyahay";
    if (!formData.culays) tempErrors.culays = "Culayska waa loo baahanyahay";
    if (!formData.dhiiga) tempErrors.dhiiga = "Dhiigga waa loo baahanyahay";
    if (!formData.dhirirka) tempErrors.dhirirka = "Dhirirka waa loo baahanyahay";
    if (!formData.goobta_dhalashada) tempErrors.goobta_dhalashada = "Goobta dhalashada waa loo baahanyahay";
      if (!formData.tariikhda_dhalashada) tempErrors.tariikhda_dhalashada = "Tariikhda dhalashada waa loo baahanyahay";


  // 2. Sarkaal ID: 4 digit, nambar kaliya, iyo inaan hore loo isticmaalin
  if (formData.sarkaal_id) {
    if (formData.sarkaal_id.length !== 4 || !onlyNumbers.test(formData.sarkaal_id)) {
      tempErrors.sarkaal_id = "ID-ga waa inuu ahaadaa 4 nambar";
    } else if (filteredData.some(item => item.sarkaal_id === formData.sarkaal_id)) {
      tempErrors.sarkaal_id = "ID-gan horay ayaa loo isticmaalay";
    }
  }

  // 3. Magaca: 3 magac iyo kaliya xarfo
  if (formData.name) {
    if (!onlyLetters.test(formData.name)) {
      tempErrors.name = "Keliya xarfo ayaa la ogolyahay";
    } else if (nameParts.length < 3) {
      tempErrors.name = "Fadlan qor ugu yaraan 3 magac";
    }
  }

  // 4. Dhirirka: Ugu yaraan 3 digit
  if (formData.dhirirka && formData.dhirirka.length < 3) {
    tempErrors.dhirirka = "Dhirirka waa inuu ahaadaa 3 digit (tusaale: 175)";
  }
  if (formData.culays && Number(formData.culays) <= 0) {
    tempErrors.culays = "Culayska waa inuu ka weyn yahay 0!";
  }
  if (formData.dhiiga && !onlyLetters.test(formData.dhiiga)) {
    tempErrors.dhiiga = "Fadlan Dooro dhiig";
  }
    if (formData.goobta_dhalashada && !onlyLetters.test(formData.goobta_dhalashada)) {
    tempErrors.goobta_dhalashada = "Goobta dhalashada waa inay ka kooban tahay xarfo kaliya";
    }
    if (formData.tariikhda_dhalashada && !/^\d{4}-\d{2}-\d{2}$/.test(formData.tariikhda_dhalashada)) {
    }

  setErrors(tempErrors);
  return Object.keys(tempErrors).length === 0; // Haddii ay 0 tahay waa sax
};



  // --- 2. DATA FETCHING ---
  const fetchTable = () => {
    axios.get('http://localhost:5000/api/s3-data').then(res => setData(res.data));
  };

  const fetchMedicalReports = () => {
    axios.get('http://localhost:5000/api/medical-records?user_id=1')
        .then(res => setMedicalReports(res.data))
        .catch(err => console.log("Error fetching reports:", err));
  };
  
  const fetchQueue = () => {
    axios.get('http://localhost:5000/api/ballan/queue?user_id=1').then(res => {
      const filteredData = res.data.filter(item => item.status === 'Pending');
      setInitiatedList(filteredData);
    });
  };

  const fetchAnalytics = () => {
    axios.get('http://localhost:5000/api/analytics')
        .then(res => setAnalyticsData(res.data))
        .catch(err => console.log("Error fetching analytics:", err));
  };

  
  useEffect(() => {
    fetchTable();
    fetchQueue();
    fetchMedicalReports();
    fetchAnalytics();
    checkFormClosureStatus();

    const interval = setInterval(() => {
      fetchTable();
      fetchQueue();
      fetchMedicalReports();
      fetchAnalytics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkFormClosureStatus = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      try {
        const response = await axios.get(`http://localhost:5000/api/form-closure/${user.id}`);
        if (response.data.success) {
          setIsFormClosed(response.data.isClosed);
          if (response.data.isClosed) {
            setShowForm(false);
          }
        }
      } catch (error) {
        console.error("Error checking form closure status:", error);
      }
    }
  };

  const handleCloseForm = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      try {
        const response = await axios.post('http://localhost:5000/api/form-closure/close', {
          userId: user.id,
          role: user.role
        });
        if (response.data.success) {
          setIsFormClosed(true);
          setShowForm(false);
          setShowCloseFormModal(false);
          alert("Form-ka waa la xiray si dhab ah!");
        }
      } catch (error) {
        console.error("Error closing form:", error);
        alert("Cilad ayaa dhacday markii la xirayay form-ka.");
      }
    }
  };

  const handleReopenForm = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    try {
      const response = await axios.post('http://localhost:5000/api/form-closure/reopen', {
        userId: user.id,
        role: user.role
      });
      if (response.data.success) {
        setIsFormClosed(false);
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error reopening form:', error);
      setIsFormClosed(false);
      setShowForm(true);
    }
  };
// Gudaha Component-kaaga MessengerH1
useEffect(() => {
    const fetchMessages = async () => {
        if (!selectedUser) return;

        try {
            // Halkan waxaa muhiim ah in URL-ka uu u qoran yahay: chat/S3/H3
            const res = await axios.get(`http://localhost:5000/api/messages/chat/S3/${selectedUser.id}`);
            
            // Marka ay fariimaha soo dhacaan, ku shub state-ka
            setMessages(res.data);
        } catch (err) {
            console.error("Fariimaha laguma soo aqrin karo:", err);
        }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // 3-dii ilbiriqsiba mar soo aqri
    return () => clearInterval(interval);
}, [selectedUser]);

  const handleSend = async () => {
    if (!message.trim() || !selectedUser) return;

    // 1. Diyaarinta FormData (Madaama Multer la isticmaalayo)
    const formData = new FormData();
    formData.append('message', message);
    formData.append('sender', 'S3'); // Ama 'S3' hadday S3 tahay
    formData.append('receiver', selectedUser.id);
    
    if (messageFile) {
        formData.append('attachment', messageFile);
    }

    try {
        const response = await axios.post('http://localhost:5000/api/messages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            // Halkan ku dar fariinta liiska 'messages' si aad isla markaana ugu aragto shaashadda
            setMessages([...messages, { 
                message: message, 
                sender: 'S3', 
                receiver: selectedUser.id,
                time: new Date().toLocaleTimeString() 
            }]);
            setMessage('');
            setMessageFile(null);
        }
    } catch (error) {
        console.error("Cilad markii la dirayay:", error.response?.data || error.message);
        alert("Fariinta ma gaarin database-ka!");
    }
};
  // --- 3. FUNCTIONS ---
  const toggleInitiate = (item) => {
    const queueData = {
      sarkaal_data_id: item.id
    };
    axios.post('http://localhost:5000/api/ballan', queueData).then((response) => {
        fetchQueue();
      showToast(`${item.name} ${t.sentToMedical} (${t.pending})!`);
    }).catch((error) => {
      showToast(error.response?.data?.message || t.deleteError, 'error');
    });
  };

  const validateForm = (data) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(data.name)) {
      showToast("Khalad: Magaca waa inuu xarfo kaliya noqdaa!");
      return false;
    }
    if (isNaN(data.sarkaal_id)) {
      showToast("Khalad: Sarkaal ID waa inuu nambar noqdaa!");
      return false;
    }
    if (Number(data.culays) <= 0 || Number(data.dhirirka) <= 0) {
      showToast("Khalad: Culayska iyo Dhirirka waa inay ka weyn yihiin 0!");
      return false;
    }
    return true;
  };


const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Hubi in sawirka la doortay
    if (!file) {
        alert("Fadlan sawirka sarkaalka soo geli!");
        return;
    }

    const sendData = new FormData();
    sendData.append('profile_pic', file);

    // 2. Ku dar xogta kale
    Object.keys(formData).forEach(key => {
        if (formData[key]) {
            sendData.append(key, formData[key]);
        }
    });

    try {
        const response = await axios.post('http://localhost:5000/api/s3-data', sendData);
        console.log("Response:", response.data);
        showToast("Xogta S3 waa la keydiyey!");
        fetchTable();
        setFormData({ sarkaal_id: '', name: '', culays: '', dhiiga: '', dhirirka: '', goobta_dhalashada: '', tariikhda_dhalashada: '' });
        setFile(null);
    } catch (err) {
        console.error("Full Error Object:", err);
        alert("Cilad ayaa dhacday: " + (err.response?.data?.error || err.message));
    }
};

  const handleLogout = () => {
    if (onLogout) onLogout();
  };
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // 1. U dir xogta Backend-ka
      const response = await axios.post('http://localhost:5000/api/login', {
        username: username,
        password: password
      });

      // 2. HADDII LOGIN-KU GUULAYSTO (Halkan ayaan ku daray)
      if (response.data.success) {
        setError('');
        
        // --- QAYBTA CUSUB EE AAD I WEYDIISAY HAKAN AYAY GALAYSAA ---
        const userData = {
          id: response.data.id,
          username: response.data.username, 
          pic: response.data.pic,           
          role: response.data.role
        };
        
        // Ku keydi biraawsarka (LocalStorage)
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('currentUser', response.data.role);

        // U dir App.js
        onLogin(response.data.role, userData); 
        // -------------------------------------------------------
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Username ama Password khaldan!');
    }
  };
  const executeDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id; 
    axios.delete(`http://localhost:5000/api/s3-data/${id}`)
      .then(() => {
         showToast(t.deleteSuccess);
         fetchTable();
         setShowDeleteModal(false);
         setItemToDelete(null);
      })
      .catch(err => {
         console.error("Ciladda tirtirista:", err);
         showToast(`${t.deleteError} ${err.message}`, 'error');
      });
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sarkaal_id.toString().includes(searchTerm)
  );


const handleDeleteSarkaal = (id) => {
    // Isticmaal Swal.fire si aad u muujiso pop-up-ka dhexda ah
    Swal.fire({
        title: 'Ma hubtaa?',
        text: "Ma rabtaa inaad tirtirto sarkaalkan iyo xogtiisa oo dhan?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Midabka tirtirista (Casaan)
        cancelButtonColor: '#3085d6', // Midabka iska dhaaf (Bulug)
        confirmButtonText: 'Haye, tirtir',
        cancelButtonText: 'Iska dhaar',
        reverseButtons: true // Waxay badhamada u dhigaysaa sida sawirkaaga (Cancel dhanka midig)
    }).then((result) => {
        if (result.isConfirmed) {
            // Haddii uu qofku doorto "Haye, tirtir"
            axios.delete(`http://localhost:5000/api/sarkaal/delete/${id}`)
            .then(() => {
                  fetchTable(); // Refresh garee xogta si isbeddelka u muuqdo
                Swal.fire(
                    'La tirtiray!',
                    'Sarkaalka si guul leh ayaa loo tirtiray.',
                    'success'
                );
            })
            .catch(err => {
                console.error(err);
                Swal.fire(
                    'Cilad!',
                    'Laguma tirtiri karo sarkaalka xogtiisa meel kale oo furan darteed.',
                    'error'
                );
            });
        }
    });
};
  const loggedInUser = JSON.parse(localStorage.getItem('user')) || { 
    username: 'Guest', 
    profile_pic: 'default_profile.jpg' 
  };
  const colors = {
  bg: darkMode ? '#121212' : '#f8faf9',      // Midabka dhabarka (Background)
  sidebar: darkMode ? '#1e1e1e' : '#ffffff', // Midabka dhinac-ka
  text: darkMode ? '#ffffff' : '#333333',    // Midabka qoraalka
  border: darkMode ? '#333333' : '#edf2f0'   // Midabka xariiqyada
};
  // --- DYNAMIC STYLES ---
  const dynamicSidebarStyle = {
    width: isExpanded ? '200px' : '80px',
    background: '#eafaf1',
    color: '#333',
    padding: '20px 0',
    position: 'fixed',
    height: '100vh',
    transition: 'all 0.3s ease',
    zIndex: 100,
    borderRight: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column'
  };

  const dynamicMainStyle = {
    flex: 1,
    padding: '30px',
    marginLeft: isExpanded ? '195px' : '80px',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8faf9'
  };

  const executeCancelAction = () => {
  if (!itemToCancel || !itemToCancel.id) {
    showToast("Cilad: Xogta sarkaalka lama helin!", "error");
    return;
  }

  // Waxaan u sheegaynaa backend-ka in sarkaalka laga saaro safka
  axios.delete(`http://localhost:5000/api/ballan/cancel/${itemToCancel.id}`)
    .then(res => {
      setShowCancelModal(false);
      showToast("Safka si guul leh ayaa looga saaray! ✅", "success");
      fetchTable();
      fetchQueue();
    })
    .catch(err => {
      console.error("Cancel Error:", err);
      showToast("Cilad: Server-ka ayaa diiday codsiga", "error");
    });
};
  const initiateCancel = (item) => {
  setItemToCancel(item);
  setShowCancelModal(true);
};
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const toastTimerRef = React.useRef(null);

  // Function-kan ayaa loo isticmaali doonaa in lagu soo bandhigo alert-ka
  const showToast = (msg, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setNotification({ show: true, message: msg, type: type });
    toastTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000); // 4 ilbiriqsi ka dib ha baxo
  };
// 1. Soo saar dhammaan askarta 45 maalmood ka badan "Yatak Istirahat" helay
const flaggedAskar = data.filter(sarkaal => {
  const totalDays = medicalReports
    .filter(r => r.sarkaal_id === sarkaal.sarkaal_id && r.limitation === 'Yattak Istirihat')
    .reduce((sum, r) => sum + Number(r.days || 0), 0);
  return totalDays >= 45;
});

const hasNotifications = flaggedAskar.length > 0;
const sidebarStyle = {
    width: isExpanded ? '260px' : '80px',
    height: '100vh',
    backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
    color: darkMode ? '#ffffff' : '#333333',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    borderRight: darkMode ? '1px solid #333' : '1px solid #f0f0f0',
    fontFamily: 'Inter, sans-serif'
  };

  const [showMsgModal, setShowMsgModal] = useState(false);

const [messageBody, setMessageBody] = useState('');

const [messageFile, setMessageFile] = useState(null);
  const sendMessageToH1 = async () => {
    if (!messageBody.trim()) {
        alert("Fariinta ma noqon karto mid maran!");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('message', messageBody);
        formData.append('sender', String(activeUser?.id || JSON.parse(localStorage.getItem('user'))?.id));
        formData.append('receiver', String(activeUser?.id || JSON.parse(localStorage.getItem('user'))?.id));
        if (messageFile) {
            formData.append('attachment', messageFile);
        }

        const response = await axios.post('http://localhost:5000/api/messages', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.status === 200) {
            setMessageBody('');
            setMessageFile(null);
            setShowMsgModal(false);
        }
    } catch (error) {
        console.error("Ciladda dhabta ah:", error.response?.data || error.message);
        alert("Cilad ayaa dhacday: " + (error.response?.data?.error || "Server-ka lama heli karo"));
    }
};

const sendMessage = async (receiverId) => {
  if (!messageBody.trim()) return alert("Fariinta ma noqon karto mid maran!");

  try {
    const formData = new FormData();
    formData.append('message', messageBody);
    formData.append('sender', String(activeUser?.id || JSON.parse(localStorage.getItem('user'))?.id));
    formData.append('receiver', String(receiverId));
    if (messageFile) formData.append('attachment', messageFile);

    await axios.post('http://localhost:5000/api/messages', formData);
    setMessageBody('');
    setMessageFile(null);
  } catch (error) {
    alert("Cilad ayaa dhacday markii fariinta la dirayey.");
  }
};

useEffect(() => {
  if (user && user.id) {
    // Hadda waxaan la hadlaynaa Node.js server-ka
    fetch(`http://localhost:5000/api/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setUserData(data);
        setLoading(false);
      })
      .catch(err => console.error("Server-ka Node.js ma shaqaynayo:", err));
  }
}, [user]);



  return (
  <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: darkMode ? getColors(darkMode).background : colors.background }}>
    <FariimahaModal isOpen={showMsgModal} onClose={() => setShowMsgModal(false)} currentUser={activeUser} darkMode={darkMode} />

    {/* XIR FORMKA Confirmation Modal */}
    {showCloseFormModal && (
      <div style={modalOverlayStyle}>
        <div style={{ ...modalContentStyle, width: '400px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: darkMode ? getColors(darkMode).text : colors.text }}>Ma hubtaa inaad rabto inaad xirto Form-ka?</h3>
          <p style={{ color: darkMode ? getColors(darkMode).textMuted : colors.textMuted, marginBottom: '25px' }}>
            Haddii aad xirto form-ka, markaas ma heli karto inaad xog cusub ku darto ama beddesho xorta ah.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowCloseFormModal(false)}
              style={buttonSecondaryStyle}
            >
              NO
            </button>
            <button
              onClick={handleCloseForm}
              style={buttonDangerStyle}
            >
              YES
            </button>
          </div>
        </div>
      </div>
    )}

    <Sidebar
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      activeUser={activeUser}
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={handleLogout}
      showMsgModal={showMsgModal}
      setShowMsgModal={setShowMsgModal}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      language={selectedLanguage}
      role="S3"
    />

    {/* MAIN CONTENT AREA */}
    <main style={{
      flexGrow: 1,
      padding: '24px',
      color: darkMode ? getColors(darkMode).text : colors.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      backgroundColor: darkMode ? getColors(darkMode).background : colors.background
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: darkMode ? getColors(darkMode).white : colors.white,
        borderRadius: '12px',
        border: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`,
        boxShadow: darkMode ? getColors(darkMode).shadow : colors.shadow
      }}>
        <h2 style={{ margin: 0, color: darkMode ? getColors(darkMode).text : colors.text, fontWeight: '700', fontSize: '20px' }}>S3 Dashboard</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* NOTIFICATION ICON - Medical Notifications */}
          {hasNotifications && (
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifyList(!showNotifyList)}>
              <Bell size={24} color={darkMode ? getColors(darkMode).text : '#333'} />
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#e74c3c',
                color: 'white',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '50%',
                fontWeight: 'bold',
                border: '2px solid white'
              }}>
                {flaggedAskar.length}
              </span>

              {/* DROPDOWN LIST */}
              {showNotifyList && (
                <div style={{
                  position: 'absolute',
                  top: '35px',
                  right: '0',
                  width: '300px',
                  background: 'white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  borderRadius: '12px',
                  zIndex: 1000,
                  overflow: 'hidden',
                  border: '1px solid #eee'
                }}>
                  <div style={{ padding: '12px', background: colors.backgroundAlt, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: colors.text }}>Ogeysiiska Caafimaadka</span>
                    <span style={{ ...badgeStyle, backgroundColor: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}>
                      {flaggedAskar.length} QOF
                    </span>
                  </div>

                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {flaggedAskar.map((s) => (
                      <div
                        key={s.sarkaal_id}
                        onClick={() => {
                          setViewedSarkaal(s);
                          setActivePage('view');
                          setShowNotifyList(false);
                        }}
                        style={{ padding: '12px', borderBottom: `1px solid ${colors.borderLight}`, cursor: 'pointer', transition: '0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.backgroundAlt}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={`http://localhost:5000/${s.profile_pic}`}
                            alt=""
                            style={{ width: '45px', height: '45px', borderRadius: borderRadius.md, objectFit: 'cover', border: `1px solid ${colors.border}`, cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={(e) => { e.stopPropagation(); openImagePreview(`http://localhost:5000/${s.profile_pic}`); }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: colors.text }}>{s.name}</h4>
                            <span style={{ fontSize: '11px', color: colors.textMuted }}>ID: {s.sarkaal_id}</span>
                            <p style={{ margin: 0, fontSize: '10px', color: colors.error, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              ⚠️ Wuxuu dhaafay Xadka Yattaka
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MESSAGES ICON - Unread Messages */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowMsgModal(true)}>
            <MessageSquare size={24} color={darkMode ? getColors(darkMode).text : '#333'} />
            {unreadMessages > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#3b82f6',
                color: 'white',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '50%',
                fontWeight: 'bold',
                border: '2px solid white'
              }}>
                {unreadMessages}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD PAGE */}
      {activePage === 'dashboard' && (
          <>
            {!showForm && (
              <div style={{ marginBottom: '20px' }}>
                <button type="button" onClick={handleReopenForm} style={buttonPrimaryStyle}>
                  Fur Foomka Dib
                </button>
              </div>
            )}

            {showForm && (
              <div style={{ 
                ...cardStyle, 
                marginBottom: '24px',
                backgroundColor: darkMode ? getColors(darkMode).white : colors.white,
                border: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`,
                padding: '40px',
                borderRadius: '20px'
              }}>
                {/* Form Header */}
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    marginBottom: '16px',
                    padding: '12px 24px',
                    background: darkMode ? getColors(darkMode).primaryLight : '#f0f7ff',
                    borderRadius: '30px',
                    border: `1px solid ${darkMode ? getColors(darkMode).primary : '#0f1f38'}`
                  }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '700', 
                      color: darkMode ? getColors(darkMode).primary : '#0f1f38',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      {t.registrationTitle}
                    </span>
                  </div>
                  <h2 style={{ 
                    color: darkMode ? getColors(darkMode).text : colors.text, 
                    fontSize: '32px', 
                    fontWeight: '800', 
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.5px'
                  }}>
                    Diiwaangelinta Layli Saraakiisha
                  </h2>
                  <p style={{ 
                    color: darkMode ? getColors(darkMode).textMuted : colors.textMuted, 
                    margin: 0, 
                    fontSize: '15px',
                    fontWeight: '400'
                  }}>
                    {t.registrationDesc}
                  </p>
                </div>
                
            <form onSubmit={(e) => { e.preventDefault(); if(validate()) handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Section 1: Profile Image */}
              <div style={{
                padding: '24px',
                background: darkMode ? getColors(darkMode).backgroundAlt : '#fafbfc',
                borderRadius: '16px',
                border: `1px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}`
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: darkMode ? getColors(darkMode).text : colors.text 
                  }}>
                    {t.profileImage}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: darkMode ? getColors(darkMode).textMuted : colors.textMuted 
                  }}>
                    {t.selectProfileImage}
                  </p>
                </div>
                <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                  <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    style={{ 
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      border: `2px dashed ${darkMode ? getColors(darkMode).border : '#d1d5db'}`,
                      backgroundColor: darkMode ? getColors(darkMode).white : '#fff',
                      color: darkMode ? getColors(darkMode).text : colors.text,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }} 
                  />
                  {file && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px 16px',
                      background: darkMode ? getColors(darkMode).successBg : '#ecfdf5',
                      color: darkMode ? getColors(darkMode).success : '#059669',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>✓</span>
                      {t.imageSelected} {file.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Personal Information */}
              <div>
                <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `2px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}` }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: darkMode ? getColors(darkMode).text : colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      background: darkMode ? getColors(darkMode).primary : '#0f1f38',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>1</span>
                    {t.personalInfo}
                  </h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  {/* Sarkaal ID */}
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.sarkaalId}</label>
                    <input 
                      type="text" 
                      value={formData.sarkaal_id || ''} 
                      style={{...inputStyle, borderColor: errors.sarkaal_id ? (darkMode ? getColors(darkMode).error : colors.error) : (darkMode ? getColors(darkMode).border : colors.border), backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}} 
                      placeholder="4-digit ID..." 
                      onChange={e => setFormData({...formData, sarkaal_id: e.target.value})} 
                    />
                    {errors.sarkaal_id && <span style={{color: darkMode ? getColors(darkMode).error : colors.error, fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500'}}>{errors.sarkaal_id}</span>}
                  </div>

                  {/* Magaca */}
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.fullName}</label>
                    <input 
                      type="text" 
                      value={formData.name || ''} 
                      style={{...inputStyle, borderColor: errors.name ? (darkMode ? getColors(darkMode).error : colors.error) : (darkMode ? getColors(darkMode).border : colors.border), backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}} 
                      placeholder="Saddexda magac..." 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                    {errors.name && <span style={{color: darkMode ? getColors(darkMode).error : colors.error, fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500'}}>{errors.name}</span>}
                  </div>
                </div>
              </div>

              {/* Section 3: Physical Information */}
              <div>
                <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `2px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}` }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: darkMode ? getColors(darkMode).text : colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      background: darkMode ? getColors(darkMode).primary : '#0f1f38',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>2</span>
                    {t.physicalInfo}
                  </h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.weight}</label>
                    <input type="text" value={formData.culays || ''} style={{...inputStyle, backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}} placeholder="70" onChange={e => setFormData({...formData, culays: e.target.value})} />
                  </div>
                  
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.bloodType}</label>
                    <select value={formData.dhiiga || ""} onChange={e => setFormData({...formData, dhiiga: e.target.value})} style={{...inputStyle, backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}}>
                      <option value="" disabled>Dooro...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Dhirirka */}
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.height}</label>
                    <input 
                      type="text" 
                      value={formData.dhirirka || ''} 
                      style={{...inputStyle, borderColor: errors.dhirirka ? (darkMode ? getColors(darkMode).error : colors.error) : (darkMode ? getColors(darkMode).border : colors.border), backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}} 
                      placeholder="175" 
                      onChange={e => setFormData({...formData, dhirirka: e.target.value})} 
                    />
                    {errors.dhirirka && <span style={{color: darkMode ? getColors(darkMode).error : colors.error, fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500'}}>{errors.dhirirka}</span>}
                  </div>
                </div>
              </div>

              {/* Section 4: Birth Information */}
              <div>
                <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `2px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}` }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: darkMode ? getColors(darkMode).text : colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      background: darkMode ? getColors(darkMode).primary : '#0f1f38',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>3</span>
                    {t.birthInfo}
                  </h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.birthPlace}</label>
                    <input type="text" value={formData.goobta_dhalashada || ''} style={{...inputStyle, backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}} placeholder="Magaalada..." onChange={e => setFormData({...formData, goobta_dhalashada: e.target.value})} />
                  </div>
                  
                  <div>
                    <label style={{...labelStyle, color: darkMode ? getColors(darkMode).text : colors.text, marginBottom: '10px', fontSize: '14px', fontWeight: '600'}}>{t.birthDate}</label>
                    <input type="date" value={formData.tariikhda_dhalashada || ''} style={{...inputStyle, backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text, padding: '14px 18px', borderRadius: '10px', fontSize: '15px', fontWeight: '500'}} onChange={e => setFormData({...formData, tariikhda_dhalashada: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginTop: '24px', 
                paddingTop: '32px', 
                borderTop: `2px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}`,
                alignItems: 'center'
              }}>
                <button 
                  type="submit" 
                  onClick={handleSubmit} 
                  style={{ 
                    ...buttonPrimaryStyle, 
                    flex: 1, 
                    padding: '16px 32px', 
                    fontSize: '16px', 
                    fontWeight: '700',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(15, 31, 56, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {t.saveData}
                </button>
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); setShowCloseFormModal(true); }} 
                  style={{ 
                    ...buttonDangerStyle, 
                    padding: '16px 40px', 
                    fontSize: '16px', 
                    fontWeight: '700',
                    borderRadius: '12px',
                    minWidth: '200px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {t.closeForm}
                </button>
              </div>
            </form>
              </div>
            )}
            
             <div style={{ 
                ...cardStyle, 
                padding: 0, 
                overflow: 'hidden',
                backgroundColor: darkMode ? getColors(darkMode).white : colors.white,
                border: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`
              }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}` }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: darkMode ? getColors(darkMode).text : colors.text }}>Liiska Guud</h3>
                <input type="text" placeholder="Raadi magac ama ID..." onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 15px', width: '250px', borderRadius: '8px', border: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`, outline: 'none', backgroundColor: darkMode ? getColors(darkMode).backgroundAlt : '#fff', color: darkMode ? getColors(darkMode).text : colors.text }} />
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Sawir</th>
                    <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Sarkaal ID</th>
                    <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Magaca</th>
                    <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => {
                    const isSent = initiatedList.some(i => i.sarkaal_data_id === item.id);
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${darkMode ? getColors(darkMode).borderLight : colors.borderLight}` }}>
                        <td style={tableCellStyle}>
                          <img 
                            src={`http://localhost:5000/${item.profile_pic}`} 
                            width="40" 
                            height="40" 
                            style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${darkMode ? getColors(darkMode).primaryLight : colors.primaryLight}`, cursor: 'pointer', transition: 'transform 0.2s' }} 
                            alt="profile" 
                            onClick={() => openImagePreview(`http://localhost:5000/${item.profile_pic}`)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </td>
                        <td style={tableCellStyle}>{item.sarkaal_id}</td>
                        <td style={tableCellStyle}>{item.name}</td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => toggleInitiate(item)} disabled={isSent} style={{ background: isSent ? (darkMode ? getColors(darkMode).backgroundAlt : colors.backgroundAlt) : (darkMode ? getColors(darkMode).success : colors.success), color: isSent ? (darkMode ? getColors(darkMode).textMuted : colors.textMuted) : colors.white, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>{isSent ? t.sentToMedical : t.initiate}</button>
                            {isSent && <button 
                            onClick={() => {
                              setItemToCancel(item);
                              setShowCancelModal(true);
                            }} 
                            style={{ 
                              padding: '6px 12px', 
                              background: '#fee2e2', 
                              color: darkMode ? getColors(darkMode).error : colors.error, 
                              border: `1px solid ${darkMode ? getColors(darkMode).error : colors.error}`,
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {t.cancel}
                          </button>}
                           
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
        )}
      
        {activePage === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '8px' }}>
              <h2 style={{ color: darkMode ? getColors(darkMode).text : colors.text, fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Warbixinada</h2>
              <p style={{ color: darkMode ? getColors(darkMode).textMuted : colors.textMuted, margin: 0, fontSize: '14px' }}>Diiwaanka baaritaannada caafimaadka iyo xogta askarta.</p>
            </div>

            {/* 1. WAITING LIST */}
            <div style={{ 
                ...cardStyle, 
                padding: 0, 
                overflow: 'hidden',
                backgroundColor: darkMode ? getColors(darkMode).white : colors.white,
                border: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`
              }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: darkMode ? getColors(darkMode).text : colors.text }}>1. Liiska Sugaya (Pending)</h3>
                <span style={{ 
                    ...badgeStyle, 
                    backgroundColor: darkMode ? getColors(darkMode).warningBg : colors.warningBg, 
                    color: darkMode ? getColors(darkMode).warning : colors.warning, 
                    border: `1px solid ${darkMode ? getColors(darkMode).warningBorder : colors.warningBorder}`
                  }}>
                  {initiatedList.length} Qof
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>No.</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Sawir</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>ID</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Magaca</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Xaaladda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiatedList.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${darkMode ? getColors(darkMode).borderLight : colors.borderLight}` }}>
                        <td style={tableCellStyle}>{index + 1}</td>
                        <td style={tableCellStyle}>
                          <img 
                            src={`http://localhost:5000/${item.profile_pic}`} 
                            width="36" 
                            height="36" 
                            style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${darkMode ? getColors(darkMode).primaryLight : colors.primaryLight}`, cursor: 'pointer', transition: 'transform 0.2s' }} 
                            alt="profile" 
                            onClick={() => openImagePreview(`http://localhost:5000/${item.profile_pic}`)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: '600' }}>{item.sarkaal_id}</td>
                        <td style={tableCellStyle}>{item.name}</td>
                        <td style={tableCellStyle}>
                          <span style={{ 
                              ...badgeStyle, 
                              backgroundColor: darkMode ? getColors(darkMode).warningBg : colors.warningBg, 
                              color: darkMode ? getColors(darkMode).warning : colors.warning, 
                              border: `1px solid ${darkMode ? getColors(darkMode).warningBorder : colors.warningBorder}`
                            }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {initiatedList.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: darkMode ? getColors(darkMode).textMuted : colors.textMuted }}>
                          Lama helin qof liiska sugaya.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. RECORDS CONTAINER (Warbixinnada Baaritaanka) */}
            <div style={{ 
                ...cardStyle, 
                padding: 0, 
                overflow: 'hidden',
                backgroundColor: darkMode ? getColors(darkMode).white : colors.white,
                border: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`
              }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? getColors(darkMode).border : colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: darkMode ? getColors(darkMode).text : colors.text }}>2. Warbixinnada Baaritaanka (Active Records)</h3>
                <span style={{ fontSize: '12px', color: darkMode ? getColors(darkMode).textMuted : colors.textMuted }}>
                  Wadarta: <strong>{medicalReports.length}</strong>
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>No.</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Sawir</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>ID</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Magaca</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Xaddidaadda</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Maalmaha Hadhay</th>
                      <th style={{ ...tableCellStyle, color: darkMode ? getColors(darkMode).white : colors.white }}>Xaaladda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const maanta = countdownNow;
                      
                      // Active time belongs only to the newest examination. Historical
                      // records remain available in the database but never extend it.
                      const latestRecords = medicalReports.reduce((records, current) => {
                        const previous = records[current.sarkaal_id];
                        if (!previous || new Date(current.created_at) > new Date(previous.created_at)) {
                          records[current.sarkaal_id] = current;
                        }
                        return records;
                      }, {});

                      const activeRecords = Object.values(latestRecords)
                        .map(report => {
                          const examinationDate = new Date(report.created_at);
                          const examinationDays = Math.max(0, Number(report.days) || 0);
                          // The issue date is Day 1: at issue time, all prescribed
                          // days remain; elapsed calendar time reduces the counter.
                          const issueDay = Date.UTC(examinationDate.getFullYear(), examinationDate.getMonth(), examinationDate.getDate());
                          const todayDay = Date.UTC(maanta.getFullYear(), maanta.getMonth(), maanta.getDate());
                          const elapsedDays = Math.max(0, Math.floor((todayDay - issueDay) / (1000 * 60 * 60 * 24)));
                          const maalmahaHadhay = Math.max(0, examinationDays - elapsedDays);
                          
                          return {
                            ...report,
                            maalmahaHadhay,
                            isExpired: maalmahaHadhay <= 0
                          };
                        })
                        .filter(report => !report.isExpired);

                      return activeRecords.map((report, index) => (
                        <tr key={report.id} style={{ borderBottom: `1px solid ${darkMode ? getColors(darkMode).borderLight : colors.borderLight}` }}>
                          <td style={tableCellStyle}>{index + 1}</td> 
                          <td style={tableCellStyle}>
                            <img 
                              src={`http://localhost:5000/${report.profile_pic}`} 
                              width="36" 
                              height="36" 
                              style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${darkMode ? getColors(darkMode).primaryLight : colors.primaryLight}`, cursor: 'pointer', transition: 'transform 0.2s' }} 
                              alt="profile" 
                              onClick={() => openImagePreview(`http://localhost:5000/${report.profile_pic}`)}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                          </td>
                          <td style={{ ...tableCellStyle, fontWeight: '600' }}>{report.sarkaal_id}</td>
                          <td style={tableCellStyle}>{report.name}</td>
                          <td style={tableCellStyle}><strong>{report.limitation}</strong></td>
                          <td style={tableCellStyle}>
                            <span style={{
                              ...badgeStyle,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '7px',
                              minWidth: '92px',
                              justifyContent: 'center',
                              padding: '7px 11px',
                              borderRadius: '999px',
                              backgroundColor: report.maalmahaHadhay <= 1 ? (darkMode ? getColors(darkMode).errorBg : colors.errorBg) : (darkMode ? getColors(darkMode).successBg : colors.successBg),
                              color: report.maalmahaHadhay <= 1 ? (darkMode ? getColors(darkMode).error : colors.error) : (darkMode ? getColors(darkMode).success : colors.success),
                              border: `1px solid ${report.maalmahaHadhay <= 1 ? (darkMode ? getColors(darkMode).errorBorder : colors.errorBorder) : (darkMode ? getColors(darkMode).successBorder : colors.successBorder)}`,
                            }} title={`${report.maalmahaHadhay} days remaining`}>
                              <Clock size={15} aria-hidden="true" />
                              <strong style={{ fontSize: '15px', lineHeight: 1 }}>{report.maalmahaHadhay}d</strong>
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{ 
                                ...badgeStyle, 
                                backgroundColor: darkMode ? getColors(darkMode).successBg : colors.successBg, 
                                color: darkMode ? getColors(darkMode).success : colors.success, 
                                border: `1px solid ${darkMode ? getColors(darkMode).successBorder : colors.successBorder}`
                              }}>
                              Active
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                {medicalReports.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? getColors(darkMode).textMuted : colors.textMuted }}>
                    Lama helin warbixin baaritaan ah.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
                
                    {/* ASKAR PAGE */}
                    {activePage === 'askar' && (
                        <div style={{ 
                          background: darkMode ? getColors(darkMode).background : '#fcfdfd', 
                          padding: '48px', 
                          borderRadius: '24px', 
                          minHeight: '80vh'
                        }}>
                          {/* Page Header with Search */}
                          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h2 style={{ 
                                color: darkMode ? getColors(darkMode).text : '#1a2e26', 
                                margin: 0, 
                                fontSize: '28px', 
                                fontWeight: '700', 
                                letterSpacing: '-0.5px'
                              }}>
                                Personnel Records
                              </h2>
                              <p style={{ 
                                color: darkMode ? getColors(darkMode).textMuted : '#6b7280', 
                                margin: '4px 0 0', 
                                fontSize: '14px',
                                fontWeight: '400'
                              }}>
                                Total: {filteredData.length} personnel
                              </p>
                            </div>
                            <div style={{ position: 'relative', width: '280px' }}>
                              <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px 10px 40px',
                                  borderRadius: '8px',
                                  border: `1px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}`,
                                  background: darkMode ? getColors(darkMode).backgroundAlt : '#ffffff',
                                  fontSize: '14px',
                                  outline: 'none',
                                  transition: 'all 0.2s',
                                  color: darkMode ? getColors(darkMode).text : '#111827',
                                  fontWeight: '400'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = darkMode ? getColors(darkMode).primary : '#0f1f38'}
                                onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? getColors(darkMode).border : '#e5e7eb'}
                              />
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  position: 'absolute',
                                  left: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: darkMode ? getColors(darkMode).textMuted : '#9ca3af'
                                }}
                              >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                              </svg>
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm('')}
                                  style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: darkMode ? getColors(darkMode).textMuted : '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    fontSize: '16px',
                                    lineHeight: 1
                                  }}
                                  title={t.clear}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Table Section */}
                          <div style={{ 
                            background: darkMode ? getColors(darkMode).white : 'white',
                            borderRadius: '16px',
                            border: `1px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}`,
                            overflow: 'hidden',
                            boxShadow: darkMode ? getColors(darkMode).shadow : '0 4px 20px rgba(0,0,0,0.04)'
                          }}>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                <thead>
                                  <tr style={{ 
                                    background: darkMode ? getColors(darkMode).backgroundAlt : '#f9fafb',
                                    borderBottom: `2px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}`
                                  }}>
                                    <th style={{ 
                                      padding: '20px 24px', 
                                      color: darkMode ? getColors(darkMode).text : '#111827', 
                                      fontSize: '12px', 
                                      fontWeight: '700', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.5px',
                                      textAlign: 'left'
                                    }}>No</th>
                                    <th style={{ 
                                      padding: '20px 24px', 
                                      color: darkMode ? getColors(darkMode).text : '#111827', 
                                      fontSize: '12px', 
                                      fontWeight: '700', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.5px',
                                      textAlign: 'left'
                                    }}>Sarkaal</th>
                                    <th style={{ 
                                      padding: '20px 24px', 
                                      color: darkMode ? getColors(darkMode).text : '#111827', 
                                      fontSize: '12px', 
                                      fontWeight: '700', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.5px',
                                      textAlign: 'left'
                                    }}>Xogta Jirka</th>
                                    <th style={{ 
                                      padding: '20px 24px', 
                                      color: darkMode ? getColors(darkMode).text : '#111827', 
                                      fontSize: '12px', 
                                      fontWeight: '700', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.5px',
                                      textAlign: 'left'
                                    }}>Dhalashada</th>
                                    <th style={{ 
                                      padding: '20px 24px', 
                                      color: darkMode ? getColors(darkMode).text : '#111827', 
                                      fontSize: '12px', 
                                      fontWeight: '700', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.5px',
                                      textAlign: 'center'
                                    }}>Maareynta</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data
                                    .filter(item => 
                                      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      item.sarkaal_id.toString().includes(searchTerm)
                                    )
                                  .map((item, index) => {
                                    const isHovered = hoveredRowId === item.id;
                                    return (
                                      <tr 
                                        key={item.id} 
                                        onMouseEnter={() => setHoveredRowId(item.id)}
                                        onMouseLeave={() => setHoveredRowId(null)}
                                        style={{ 
                                          backgroundColor: darkMode ? getColors(darkMode).white : 'white',
                                          boxShadow: isHovered ? (darkMode ? getColors(darkMode).shadowLg : '0 8px 25px rgba(0,0,0,0.08)') : (darkMode ? getColors(darkMode).shadow : '0 2px 8px rgba(0,0,0,0.04)'),
                                          transform: isHovered ? 'translateY(-3px)' : 'none',
                                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                          borderRadius: '12px'
                                        }}
                                      >
                                        <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px', fontWeight: '700', color: darkMode ? getColors(darkMode).textMuted : '#999', fontSize: '13px' }}>
                                          {index + 1}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img 
                                              src={`http://localhost:5000/${item.profile_pic}`} 
                                              width="48" height="48" 
                                              style={{ borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s', border: `2px solid ${darkMode ? getColors(darkMode).border : '#e5e7eb'}` }} 
                                              alt="" 
                                              onClick={() => openImagePreview(`http://localhost:5000/${item.profile_pic}`)}
                                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                            <div>
                                              <div style={{ fontWeight: '700', color: darkMode ? getColors(darkMode).text : '#1a2e26', fontSize: '14px' }}>{item.name}</div>
                                              <div style={{ fontSize: '12px', color: darkMode ? getColors(darkMode).success : '#10b981', fontWeight: '500' }}>ID: {item.sarkaal_id}</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ background: darkMode ? getColors(darkMode).primaryLight : '#eff6ff', color: darkMode ? getColors(darkMode).primary : '#1e40af', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{item.culays}kg</span>
                                            <span style={{ background: darkMode ? getColors(darkMode).errorBg : '#fef2f2', color: darkMode ? getColors(darkMode).error : '#dc2626', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{item.dhiiga}</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                          <div style={{ fontSize: '13px', color: darkMode ? getColors(darkMode).textMuted : '#6b7280' }}>
                                            <div style={{ fontWeight: '500' }}>{item.goobta_dhalashada}</div>
                                            <div style={{ fontSize: '11px', color: darkMode ? getColors(darkMode).textMuted : '#9ca3af' }}>{item.tariikhda_dhalashada}</div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', borderRadius: '0 12px 12px 0', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                              onClick={() => {
                                                setViewedSarkaal(item);
                                                setActivePage('view');
                                              }}
                                              style={{ 
                                                padding: '10px 20px', 
                                                background: darkMode ? getColors(darkMode).primary : '#0f1f38', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '10px', 
                                                cursor: 'pointer', 
                                                fontSize: '13px', 
                                                fontWeight: '700',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(15, 31, 56, 0.25)'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                              {t.view}
                                            </button>
                                            <button 
                                              onClick={() => {
                                                setEditingSarkaal({ ...item });
                                                setErrors({});
                                                setShowEditForm(true);
                                              }}
                                              style={{ 
                                                padding: '10px 20px', 
                                                background: darkMode ? getColors(darkMode).warningBg : '#fef3c7', 
                                                color: darkMode ? getColors(darkMode).warning : '#92400e', 
                                                border: `1px solid ${darkMode ? getColors(darkMode).warningBorder : '#f59e0b'}`, 
                                                borderRadius: '10px', 
                                                cursor: 'pointer', 
                                                fontSize: '13px', 
                                                fontWeight: '700',
                                                transition: 'all 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                              {t.edit}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setItemToDelete(item);
                                                setShowDeleteModal(true);
                                              }}
                                              style={{
                                                padding: '10px 20px',
                                                background: darkMode ? getColors(darkMode).errorBg : '#fef2f2',
                                                color: darkMode ? getColors(darkMode).error : '#b91c1c',
                                                border: `1px solid ${darkMode ? getColors(darkMode).error : '#ef4444'}`,
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                transition: 'all 0.2s'
                                              }}
                                            >
                                              {t.delete}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Empty State */}
                            {data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sarkaal_id.toString().includes(searchTerm)).length === 0 && (
                              <div style={{ 
                                padding: '80px 40px', 
                                textAlign: 'center',
                                background: darkMode ? getColors(darkMode).backgroundAlt : '#f9fafb'
                              }}>
                                <div style={{ 
                                  fontSize: '48px', 
                                  marginBottom: '16px',
                                  opacity: 0.5
                                }}>
                                  👤
                                </div>
                                <h3 style={{ 
                                  margin: '0 0 8px 0', 
                                  fontSize: '18px', 
                                  fontWeight: '700', 
                                  color: darkMode ? getColors(darkMode).text : '#111827' 
                                }}>
                                  {t.noSoldiers}
                                </h3>
                                <p style={{ 
                                  margin: 0, 
                                  fontSize: '14px', 
                                  color: darkMode ? getColors(darkMode).textMuted : '#6b7280' 
                                }}>
                                  {t.noSoldiersDesc}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                  {/* VIEW PAGE */}
                  {activePage === 'view' && viewedSarkaal && (
                  <div style={{ padding: '20px' }}>
                    {/* --- XISAABTA TOTAL REST (Halkan ayaan ku xisaabinaynaa si aan u isticmaallno) --- */}
                    {(() => {
                      const totalRestDays = medicalReports
                        .filter(r => r.sarkaal_id === viewedSarkaal.sarkaal_id && r.limitation === 'Yattak Istirihat')
                        .reduce((sum, report) => sum + Number(report.days || 0), 0);

                      // 1. Notification Logic: Haddii ay 45 gaarto
                      if (totalRestDays >= 45) {
                        // Tusaale ahaan: Waxaad isticmaali kartaa Window Alert ama Custom Notification
                        // alert(`Ogeysiis: Sarkaalka ${viewedSarkaal.name} ee Horinta 1aad wuxuu gaaray xadkii loogu talagalay (${totalRestDays} Maalmood). Fadlan la xiriir Taliyaha Ururka.`);
                      }

                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <button onClick={() => setActivePage('askar')} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>⬅ Back to List</button>
                            <button 
                              onClick={() => window.print()} 
                              style={{ padding: '10px 20px', background: '#0f2744', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                              className="no-print"
                            >
                              <Printer size={16} />
                              Print Soldier Details
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', alignItems: 'center', gap: '40px', marginBottom: '30px' }}>
                            <img 
                              src={`http://localhost:5000/${viewedSarkaal.profile_pic}`} 
                              style={{ width: '150px', height: '150px', borderRadius: '15px', objectFit: 'cover', border: '5px solid #1a2a6c', cursor: 'pointer' }} 
                              alt="profile"
                              onClick={() => openImagePreview(`http://localhost:5000/${viewedSarkaal.profile_pic}`)}
                            />
                            <div>
                              <h1 style={{ margin: '0 0 10px 0', color: '#1a2a6c', fontSize: '32px' }}>{viewedSarkaal.name}</h1>
                              <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Sarkaal ID: <b style={{ color: '#1a2a6c' }}>{viewedSarkaal.sarkaal_id}</b></p>
                              
                              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                <div style={{ padding: '10px 20px', background: '#e8f4fd', borderRadius: '10px', display: 'inline-block' }}>
                                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a2a6c' }}>
                                    Visits Count: {medicalReports.filter(r => r.sarkaal_id === viewedSarkaal.sarkaal_id).length} Jeer
                                  </span>
                                </div>

                                {/* --- Qaybta Xadka (Color Change at 40) --- */}
                                <div style={{ 
                                  padding: '10px 20px', 
                                  // Haddii ay 40 gaarto wuxuu noqonayaa CAS (Red), haddii kale midabkii hore
                                  background: totalRestDays >= 40 ? '#f8d7da' : '#fef9e7', 
                                  borderRadius: '10px', 
                                  border: totalRestDays >= 40 ? '2px solid #dc3545' : '1px solid #f39c12', 
                                  display: 'inline-block' 
                                }}>
                                  <span style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 'bold', 
                                    // Qoraalkana wuxuu isku beddelayaa Cas haddii ay 40 gaarto
                                    color: totalRestDays >= 40 ? '#721c24' : '#d35400' 
                                  }}>
                                    Total Rest: {totalRestDays} Maalmood {totalRestDays >= 40 && "⚠️"}
                                  </span>
                                </div>
                              </div>

                              {/* Notification Box: Kaliya soo baxaya haddii ay 45 gaarto */}
                              {totalRestDays >= 45 && (
                                <div 
                                  onClick={() => alert(`Sarkaalka: ${viewedSarkaal.name}\nHorinta: 1aad\nXaalka: Wuxuu dhaafay xadka caafimaadka!`)}
                                  style={{ 
                                    marginTop: '15px', 
                                    padding: '15px', 
                                    background: '#dc3545', 
                                    color: 'white', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    animation: 'pulse 2s infinite' // Waxaad ku dari kartaa animation haddii aad rabto
                                  }}
                                >
                                  🔔 Ogeysiis: Taliyaha Ururka! Sarkaalkaan wuxuu gaaray xadkii loogu talagalay.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Medical History Table (Koodhkaaga intiisa kale) */}
                          <div style={{ background: 'white', padding: '30px', borderRadius: '15px' }}>
                            <h3 style={{ color: '#1a2a6c', borderBottom: '3px solid #fdbb2d', paddingBottom: '10px', marginBottom: '20px' }}>Medical History</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #1a2a6c' }}>
                                  <th style={thStyle}>Date</th> <th style={thStyle}>Diagnosis</th><th style={thStyle}>Limitation</th><th style={thStyle}>Days</th> <th style={thStyle}>Referral </th>
                                </tr>
                              </thead>
                              <tbody>
                                {medicalReports.filter(report => report.sarkaal_id === viewedSarkaal.sarkaal_id).map((report, index) => (
                                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{new Date(report.created_at).toLocaleDateString()}</td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#d9534f' }}>{report.diagnosis}</td>
                                    <td style={tdStyle}>{report.limitation}</td>
                                    <td style={tdStyle}><span style={{ background: '#fcf8e3', padding: '4px 10px', borderRadius: '5px', color: '#8a6d3b' }}>{report.days} Maalmood</span></td>
                                    <td style={pad15}>
                                      {report.referrals === 'Yes' ? <span style={{ color: '#5bc0de', fontWeight: 'bold' }}>Yes</span> : <span style={{ color: '#5cb85c', fontWeight: 'bold' }}>No</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                {activePage === 'settings' && <SettingsPage user={activeUser} onThemeChange={setDarkMode} darkMode={darkMode} language={selectedLanguage} onLanguageChange={setSelectedLanguage} />}
                {activePage === 'analytics' && (
                <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '25px', color: darkMode ? getColors(darkMode).text : '#2c3e50' }}>
                    Analytics & Overview
                  </h2>

                  {/* --- STATS CARDS --- */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '30px' 
                  }}>
                    {[
                      { title: 'Total Personnel', value: analyticsData?.totalPersonnel || data.length, icon: <Users size={22}/>, color: darkMode ? '#60a5fa' : '#0f1f38' },
                      { title: 'In Queue', value: analyticsData?.totalQueue || initiatedList.length, icon: <LayoutDashboard size={22}/>, color: darkMode ? '#93c5fd' : '#162a4a' },
                      { title: 'Medical Reports', value: analyticsData?.totalMedicalRecords || medicalReports.length, icon: <FileText size={22}/>, color: darkMode ? '#3b82f6' : '#1e3a66' },
                      { title: 'Recent Reports', value: analyticsData?.recentReports || '0', icon: <Bell size={22}/>, color: darkMode ? '#2563eb' : '#334155' }
                    ].map((card, i) => (
                      <div key={i} style={{
                        background: darkMode ? getColors(darkMode).white : '#fff',
                        padding: '20px',
                        borderRadius: '16px',
                        boxShadow: darkMode ? getColors(darkMode).shadow : '0 4px 15px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        borderLeft: `5px solid ${card.color}`
                      }}>
                        <div style={{ backgroundColor: `${card.color}22`, padding: '10px', borderRadius: '12px', color: card.color }}>
                          {card.icon}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', color: darkMode ? getColors(darkMode).textMuted : '#888', fontWeight: '600' }}>{card.title}</p>
                          <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: darkMode ? getColors(darkMode).text : '#333' }}>{card.value}</h3>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* --- CHARTS SECTION (Real Data) --- */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    
                    {/* Monthly Activity Chart */}
                    <div style={{ 
                      background: darkMode ? getColors(darkMode).white : '#fff', 
                      padding: '30px', 
                      borderRadius: '20px', 
                      boxShadow: darkMode ? getColors(darkMode).shadow : '0 4px 15px rgba(0,0,0,0.05)',
                      border: `1px solid ${darkMode ? getColors(darkMode).border : '#edf2f0'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: darkMode ? getColors(darkMode).text : '#333' }}>Monthly Medical Activity</h4>
                        <span style={{ fontSize: '12px', color: darkMode ? getColors(darkMode).textMuted : '#888', background: darkMode ? getColors(darkMode).backgroundAlt : '#f8faf9', padding: '6px 12px', borderRadius: '20px' }}>
                          Last 7 Months
                        </span>
                      </div>
                      <div style={{ 
                        height: '280px', 
                        display: 'flex', 
                        alignItems: 'flex-end', 
                        gap: '20px', 
                        padding: '20px 10px 0',
                        background: darkMode ? getColors(darkMode).backgroundAlt : '#fafbfc',
                        borderRadius: '12px',
                        position: 'relative'
                      }}>
                        {analyticsData?.monthlyChartData ? analyticsData.monthlyChartData.map((item, i) => {
                          const maxValue = Math.max(...analyticsData.monthlyChartData.map(d => d.value));
                          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                          return (
                            <div key={i} style={{ 
                              flex: 1, 
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{ 
                                width: '100%',
                                maxWidth: '50px',
                                backgroundColor: darkMode ? '#60a5fa' : '#0f1f38', 
                                height: `${height}%`, 
                                borderRadius: '8px 8px 0 0', 
                                opacity: 0.9, 
                                minHeight: '10px',
                                transition: 'height 0.3s ease',
                                boxShadow: '0 4px 15px rgba(15, 31, 56, 0.2)'
                              }}></div>
                              <span style={{ fontSize: '11px', color: darkMode ? getColors(darkMode).textMuted : '#666', fontWeight: '500' }}>
                                {item.label}
                              </span>
                            </div>
                          );
                        }) : [40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                          <div key={i} style={{ 
                            flex: 1, 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{ 
                              width: '100%',
                              maxWidth: '50px',
                              backgroundColor: darkMode ? '#60a5fa' : '#0f1f38', 
                              height: `${h}%`, 
                              borderRadius: '8px 8px 0 0', 
                              opacity: 0.9,
                              minHeight: '10px',
                              boxShadow: '0 4px 15px rgba(15, 31, 56, 0.2)'
                            }}></div>
                            <span style={{ fontSize: '11px', color: darkMode ? getColors(darkMode).textMuted : '#666', fontWeight: '500' }}>
                              {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              
              
             </main>
             {false && showMsgModal && (
               <div style={modalOverlayStyle}>
                 <div style={{ ...cardStyle, width: '600px', display: 'flex', height: '450px', padding: 0, overflow: 'hidden' }}>
                   
                   {/* DHINACA BIDIX: Liiska Dadka */}
                   <div style={{ width: '200px', borderRight: '1px solid #eee', background: '#f9f9f9', padding: '15px' }}>
                     <h4 style={{ marginBottom: '15px' }}>Xiriirada</h4>
                     {availableUsers.map(user => (
                       <div 
                         key={user.id}
                         onClick={() => setSelectedUser(user)}
                         style={{
                           padding: '10px',
                           borderRadius: '8px',
                           cursor: 'pointer',
                           backgroundColor: selectedUser?.id === user.id ? '#5d5fef' : 'transparent',
                           color: selectedUser?.id === user.id ? 'white' : '#333',
                           marginBottom: '5px',
                           fontSize: '14px',
                           transition: '0.3s'
                         }}
                       >
                         {user.name}
                       </div>
                     ))}
                   </div>
             
                   {/* DHINACA MIDIG: Meesha Fariinta */}
                   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative' }}>
                     <X 
                       size={20} 
                       style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer' }} 
                       onClick={() => { setShowMsgModal(false); setSelectedUser(null); }} 
                     />
                     
                     {selectedUser ? (
                       <>
                         <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                           <h3 style={{ margin: 0 }}>Ku: {selectedUser.name}</h3>
                           <small style={{ color: '#888' }}>{selectedUser.role}</small>
                         </div>
             
                         <textarea 
                           style={{ ...textAreaStyle, flex: 1, border: 'none', outline: 'none', resize: 'none' }} 
                           placeholder={`U dir fariin ${selectedUser.name}...`}
                           value={messageBody}
                           onChange={(e) => setMessageBody(e.target.value)}
                         />
             
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                           <div style={{ display: 'flex', gap: '10px' }}>
                             <label style={{ cursor: 'pointer', color: '#5d5fef' }}>
                               <Paperclip size={22} />
                               <input type="file" style={{ display: 'none' }} onChange={(e) => setMessageFile(e.target.files[0])} />
                             </label>
                           </div>
                           <button 
                             onClick={() => sendMessage(selectedUser.id)} 
                             style={{ ...sendBtnStyle, padding: '10px 25px' }}
                           >
                             <Send size={18} /> Dir
                           </button>
                         </div>
                       </>
                     ) : (
                       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                         Fadlan dooro qofka aad fariinta u dirayso
                       </div>
                     )}
                   </div>
             
                 </div>
               </div>
             )}
                     {/* Dhammaadka Main */}

                     {/* MODAL-KA TIRTIRISTA (Halkan dhig si uu meel walba uga shaqeeyo) */}
                     {showDeleteModal && (
                       <div style={{
                         position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                         backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
                         alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                       }}>
                         <div style={{
                           background: 'white', padding: '30px', borderRadius: '15px',
                           width: '350px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                         }}>
                           <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
                          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Ma hubtaa?</h3>
                           <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>
                             Sarkaalka <b>{itemToDelete?.name}</b> xogtiisa si joogto ah ayaad u tirtiraysaa.
                           </p>
                           <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                             <button onClick={() => setShowDeleteModal(false)} style={{ padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', background: '#eee', border: 'none' }}>Maya</button>
                             <button onClick={executeDelete} style={{ padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', background: '#e74c3c', color: 'white', fontWeight: 'bold', border: 'none' }}>Haye, Tirtir</button>
                           </div>
                         </div>
                       </div>
                     )}
                     {/* Marka showLargeImg ay tahay true, koodhkan ayaa soo baxaya */}
                      {showLargeImg && (
                          <div 
                              style={{
                                  position: 'fixed',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: 'rgba(0,0,0,0.85)', // Madow yar oo hufan
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  zIndex: 9999, // Inuu wax kasta ka sarreeyo
                                  cursor: 'zoom-out'
                              }}
                              onClick={() => setShowLargeImg(false)} // Haddii meel kasta laga taabto wuu xirmayaa
                          >
                              <img 
                                  src={profilePic} 
                                  alt="Large Profile" 
                                  style={{ 
                                      maxWidth: '80%', 
                                      maxHeight: '80%', 
                                      borderRadius: '10px',
                                      boxShadow: '0 0 20px rgba(255,255,255,0.2)'
                                  }} 
                              />
                          </div>
                      )}

                      {/* Soldier Image Preview Modal */}
                      {showImagePreview && (
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
                          onClick={closeImagePreview}
                        >
                          <div 
                            style={{ position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img 
                              src={imagePreviewSrc} 
                              alt="Soldier Profile Preview" 
                              style={{ 
                                maxWidth: '90%', 
                                maxHeight: '90vh', 
                                borderRadius: '12px',
                                boxShadow: '0 0 30px rgba(0,0,0,0.5)'
                              }} 
                            />
                            <button 
                              onClick={closeImagePreview}
                              style={{
                                position: 'absolute',
                                top: '-40px',
                                right: 0,
                                background: 'white',
                                color: '#333',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                     {notification.show && (
                      <div style={{
                        position: 'fixed', top: '25px', right: '25px', zIndex: 9999,
                        animation: 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}>
                        <div style={{
                          minWidth: '320px', padding: '16px 20px', borderRadius: '16px',
                          display: 'flex', alignItems: 'center', gap: '15px',
                          boxShadow: '0 15px 30px rgba(0,0,0,0.08)',
                          background: notification.type === 'success' ? '#ffffff' : '#ffffff',
                          borderLeft: `6px solid ${notification.type === 'success' ? '#27ae60' : '#e74c3c'}`,
                          color: '#1a2e26'
                        }}>
                          <div style={{
                            background: notification.type === 'success' ? '#eafaf1' : '#fff5f5',
                            borderRadius: '12px', padding: '8px', display: 'flex'
                          }}>
                            {notification.type === 'success' ? (
                              <svg width="22" height="22" viewBox="0 0 20 20" fill="#27ae60"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            ) : (
                              <svg width="22" height="22" viewBox="0 0 20 20" fill="#e74c3c"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            )}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>{notification.type === 'success' ? 'Guul' : 'Cilad'}</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{notification.message}</p>
                          </div>
                        </div>
                        <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                      </div>
                    )}
                    {/* MODALS (Waa in ay ku jiraan gudaha return, laakiin ka baxsan div-yada yaryar) */}
                    {showEditForm && editingSarkaal && (
                    <div style={{
                      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000,
                      padding: '20px'
                    }}>
                      <div style={{
                        background: 'white', padding: '35px', borderRadius: '24px',
                        width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                          <h3 style={{ margin: 0, color: '#1a2e26', fontSize: '20px', fontWeight: '700' }}>Wax ka beddelka Xogta Sarkaalka</h3>
                          <button 
                            type="button" 
                            onClick={() => { setShowEditForm(false); setErrors({}); }} 
                            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#889891', lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </div>
                        <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                          {/* Profile Pic */}
                          <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Beddel Sawirka Profile-ka</span>
                            <input 
                              type="file" 
                              onChange={(e) => setEditingSarkaal({...editingSarkaal, profile_pic: e.target.files[0]})} 
                            />
                            {errors.profile_pic && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.profile_pic}</span>}
                          </div>                 

                          {/* ID Number */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>ID Nambarka</span>
                            <input type="text" value={editingSarkaal.sarkaal_id || ''} onChange={e => setEditingSarkaal({...editingSarkaal, sarkaal_id: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.sarkaal_id ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.sarkaal_id && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.sarkaal_id}</span>}
                          </div>

                          {/* Magaca */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Magaca</span>
                            <input type="text" value={editingSarkaal.name || ''} onChange={e => setEditingSarkaal({...editingSarkaal, name: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.name ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.name && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.name}</span>}
                          </div>

                          {/* Culayska */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Culayska</span>
                            <input type="text" value={editingSarkaal.culays || ''} onChange={e => setEditingSarkaal({...editingSarkaal, culays: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.culays ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.culays && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.culays}</span>}
                          </div>

                          {/* Dhiiga */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Nooca dhiiga</span>
                            <input type="text" value={editingSarkaal.dhiiga || ''} onChange={e => setEditingSarkaal({...editingSarkaal, dhiiga: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.dhiiga ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.dhiiga && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.dhiiga}</span>}
                          </div>

                          {/* Dhirirka */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Dhirir</span>
                            <input type="text" value={editingSarkaal.dhirirka || ''} onChange={e => setEditingSarkaal({...editingSarkaal, dhirirka: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.dhirirka ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.dhirirka && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.dhirirka}</span>}
                          </div>

                          {/* Goobta Dhalashada */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Goobta Dhalashada</span>
                            <input type="text" value={editingSarkaal.goobta_dhalashada || ''} onChange={e => setEditingSarkaal({...editingSarkaal, goobta_dhalashada: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.goobta_dhalashada ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.goobta_dhalashada && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.goobta_dhalashada}</span>}
                          </div>

                          {/* Taariikhda */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#889891' }}>Tariikhda Dhalashada</span>
                            <input type="date" value={editingSarkaal.tariikhda_dhalashada ? String(editingSarkaal.tariikhda_dhalashada).split('T')[0] : ''} onChange={e => setEditingSarkaal({...editingSarkaal, tariikhda_dhalashada: e.target.value})} style={{ ...inputStyle, background: '#f9f9f9', border: errors.tariikhda_dhalashada ? '1px solid #e74c3c' : '1px solid #ddd' }} />
                            {errors.tariikhda_dhalashada && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{errors.tariikhda_dhalashada}</span>}
                          </div>

                          {/* Badhamada Action-ka */}
                          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button type="submit" style={{ padding: '12px 30px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>
                              {t.save}
                            </button>
                            <button type="button" onClick={() => {setShowEditForm(false); setErrors({});}} style={{ padding: '12px 30px', background: '#f0f2f1', color: '#666', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                              {t.cancel}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                    {showCancelModal && (<div style={{
                      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                      <div style={{
                        background: 'white', padding: '40px', borderRadius: '24px',
                        width: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                      }}>
                        {/* Icon-ka Digniinta */}
                        <div style={{
                          width: '70px', height: '70px', background: '#fff5f5', borderRadius: '50%',
                          display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px'
                        }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>

                        <h2 style={{ margin: '0 0 10px', fontSize: '22px', color: '#1a2e26' }}>Ma hubtaa?</h2>
                        <p style={{ color: '#6b7c75', fontSize: '15px', lineHeight: '1.5', marginBottom: '30px' }}>
                          Ma rabtaa inaad ka saarto safka sarkaalka <br/>
                          <strong style={{ color: '#1a2e26' }}>{itemToCancel?.name}</strong>?
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <button 
                            onClick={executeCancelAction}
                            style={{
                              padding: '14px', borderRadius: '12px', border: 'none',
                              background: '#e74c3c', color: 'white', fontWeight: '600',
                              cursor: 'pointer', fontSize: '15px', transition: '0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#c0392b'}
                            onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                          >
                            Haye, Ka saar
                          </button>

                          <button 
                            onClick={() => setShowCancelModal(false)}
                            style={{
                              padding: '14px', borderRadius: '12px', border: '1px solid #edf2f0',
                              background: 'white', color: '#666', fontWeight: '500',
                              cursor: 'pointer', fontSize: '15px'
                            }}
                          >
                            Iska dhaaaf
                          </button>
                        </div>
                      </div>
                    </div>)}
                  
                  
                  
    </div>
  );
}


// STYLES
const thStyle = { padding: '15px 20px', fontWeight: '600', fontSize: '13px' };
const tdStyle = { padding: '12px 20px', fontSize: '14px', color: '#1a2e26' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '12px' };
const pad15 = { padding: '15px' };

export default S3Dashboard;