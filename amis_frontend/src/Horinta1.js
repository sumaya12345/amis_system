import axios from 'axios';
import React, { useState, useEffect } from 'react';
import './H1Dashboard.css';
import { Bell, Check } from 'lucide-react';
import FariimahaModal from './FariimahaModal';
import { useAuthUser } from './authSync';
import Sidebar from './components/Sidebar';
import { SettingsPage } from './S1Dashboard';
import {
  HDashboardTables,
  PersonalRecordsList,
  PersonalRecordView,
  MonthlyReferralStats,
  ImagePreview,
  getHText,
  useHRoleLanguage,
} from './HRoleOverview';
import {
  getThemedStyles,
  borderRadius,
  setGlobalDarkMode,
  initGlobalTheme
} from './designSystem';

function Horinta1({ user, onLogout }) {
  const [data, setData] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [activeRecords, setActiveRecords] = useState([]);
  const [activePage, setActivePage] = useState('dashboard');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNotifyList, setShowNotifyList] = useState(false);
  const [viewedSarkaal, setViewedSarkaal] = useState(null);
  const [viewReturnPage, setViewReturnPage] = useState('askar');
  const [showMsgModal, setShowMsgModal] = useState(false);

  // Settings states
  const authUser = useAuthUser(user);
  const activeUser = authUser || user || {};
  const loggedInUser = activeUser;
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useHRoleLanguage();
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);
  const openImagePreview = (src) => setImagePreviewSrc(src);
  const closeImagePreview = () => setImagePreviewSrc(null);

  const { colors, buttonPrimaryStyle, badgeStyle, subtleBg } = getThemedStyles(darkMode);
  const t = getHText(language);
  const divisionName = t.divisionName(1);

  useEffect(() => {
    setDarkMode(initGlobalTheme(loggedInUser?.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser?.id]);

  const authConfig = () => {
    const sessionId = sessionStorage.getItem('sessionId') || localStorage.getItem('sessionId');
    return sessionId ? { headers: { 'X-Session-ID': sessionId } } : {};
  };

  const fetchData = async () => {
    try {
      const [qRes, rRes, pRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ballan/queue', authConfig()),
        axios.get('http://localhost:5000/api/medical-records', authConfig()),
        axios.get('http://localhost:5000/api/sarkaal-data', authConfig())
      ]);

      const queue = Array.isArray(qRes.data) ? qRes.data : [];
      const records = Array.isArray(rRes.data) ? rRes.data : [];
      const people = Array.isArray(pRes.data) ? pRes.data : [];
      setPendingQueue(queue.filter(q => q.status === 'Pending'));
      setActiveRecords(records.filter(r => r.horinta === 'Horinta 1aad'));
      setData(people.filter(p => p.horinta === 'Horinta 1aad'));
      setMedicalReports(records);
    } catch (err) {
      console.error("Xogta lama soo xiriirin karno:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const openSoldier = (sarkaal, returnPage = 'askar') => {
    setViewedSarkaal(sarkaal);
    setViewReturnPage(returnPage);
    setActivePage('view');
  };

  const flaggedAskar = data.filter(sarkaal => {
    const totalDays = medicalReports
      .filter(r => r.sarkaal_id === sarkaal.sarkaal_id && r.limitation === 'Yattak Istirihat')
      .reduce((sum, r) => sum + Number(r.days || 0), 0);
    return totalDays >= 45;
  });

  const hasNotifications = flaggedAskar.length > 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
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
        language={language}
        role="H1"
      />

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flexGrow: 1,
        minWidth: 0,
        padding: '24px 32px',
        backgroundColor: colors.background,
        color: colors.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: `1px solid ${colors.border}`,
        }} className="no-print">
          <h1 style={{ margin: 0, color: colors.text, fontSize: '22px', fontWeight: '800' }}>
            {divisionName}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifyList(!showNotifyList)}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: borderRadius.md,
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textSecondary,
              }}>
                <Bell size={18} />
              </div>

              {hasNotifications && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: colors.error,
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 5px',
                  borderRadius: '50%',
                  fontWeight: '700',
                  lineHeight: 1,
                  border: `2px solid ${colors.white}`,
                }}>
                  {flaggedAskar.length}
                </span>
              )}

              {/* Notification Dropdown */}
              {showNotifyList && (
                <div style={{
                  position: 'absolute',
                  top: '44px',
                  right: '0',
                  width: '320px',
                  background: colors.white,
                  boxShadow: colors.shadowLg,
                  borderRadius: borderRadius.lg,
                  zIndex: 1000,
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: subtleBg,
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: colors.text }}>{t.restNotifications}</span>
                    <span style={{ ...badgeStyle, backgroundColor: colors.errorBg, color: colors.error, border: `1px solid ${colors.errorBorder}` }}>
                      {t.people(flaggedAskar.length)}
                    </span>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {flaggedAskar.length > 0 ? (
                      flaggedAskar.map((s) => (
                        <div
                          key={s.sarkaal_id}
                          onClick={() => {
                            openSoldier(s, activePage === 'view' ? viewReturnPage : activePage);
                            setShowNotifyList(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderBottom: `1px solid ${colors.border}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = subtleBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <img
                            src={`http://localhost:5000/${s.profile_pic}`}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/profiles/default.svg"; }}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: colors.text }}>{s.name}</div>
                            <div style={{ fontSize: '11px', color: colors.error, fontWeight: '500' }}>{t.rest45}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: colors.textMuted, fontSize: '12px' }}>
                        {t.noNotifications}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={fetchData} style={buttonPrimaryStyle}>
              <Check size={15} />
              <span>{t.refresh}</span>
            </button>
          </div>
        </header>

        {/* ── DASHBOARD TAB ── */}
        {activePage === 'dashboard' && (
          <HDashboardTables
            pendingQueue={pendingQueue}
            activeRecords={activeRecords}
            darkMode={darkMode}
            language={language}
            onImageClick={openImagePreview}
            showVitals
            activeStatusKey="active"
          />
        )}

        {/* ── TIRAKOOB (STATISTICS) TAB ── */}
        {activePage === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MonthlyReferralStats
              darkMode={darkMode}
              language={language}
              personnel={data}
              onViewDetails={(sarkaal) => openSoldier(sarkaal, 'analytics')}
              onImageClick={openImagePreview}
            />
          </div>
        )}

        {/* ── PERSONAL RECORDS TAB ── */}
        {activePage === 'askar' && (
          <PersonalRecordsList
            personnel={data}
            darkMode={darkMode}
            language={language}
            onView={(item) => openSoldier(item, 'askar')}
            onImageClick={openImagePreview}
          />
        )}

        {/* ── VIEW SINGLE SARKAAL ── */}
        {activePage === 'view' && viewedSarkaal && (
          <PersonalRecordView
            soldier={viewedSarkaal}
            history={medicalReports.filter(r => r.sarkaal_id === viewedSarkaal.sarkaal_id)}
            divisionName={divisionName}
            darkMode={darkMode}
            language={language}
            onBack={() => setActivePage(viewReturnPage)}
            onImageClick={openImagePreview}
          />
        )}

        {/* ── SETTINGS TAB ── */}
        {activePage === 'settings' && (
          <SettingsPage
            user={loggedInUser}
            darkMode={darkMode}
            onThemeChange={(next) => { setDarkMode(next); setGlobalDarkMode(next, loggedInUser?.id); }}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}
      </main>

      <ImagePreview src={imagePreviewSrc} onClose={closeImagePreview} language={language} />

      <FariimahaModal isOpen={showMsgModal} onClose={() => setShowMsgModal(false)} currentUser={activeUser} darkMode={darkMode} language={language} />
    </div>
  );
}

export default Horinta1;
