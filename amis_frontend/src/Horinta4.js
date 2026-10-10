import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FariimahaModal from './FariimahaModal';
import { useAuthUser } from './authSync';
import {
  HDashboardTables,
  PersonalRecordsList,
  PersonalRecordView,
  MonthlyReferralStats,
  ImagePreview,
  getHText,
  useHRoleLanguage,
} from './HRoleOverview';
import Sidebar from './components/Sidebar';
import { SettingsPage } from './S1Dashboard';
import {
  getThemedStyles,
  setGlobalDarkMode,
  initGlobalTheme
} from './designSystem';
import { RotateCw } from 'lucide-react';

function Horinta4Dashboard({ user, onLogout }) {
  const authUser = useAuthUser(user);
  const activeUser = authUser || user || {};
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingQueue, setPendingQueue] = useState([]);
  const [activeRecords, setActiveRecords] = useState([]);
  const [personnel, setPersonnel] = useState([]);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [viewReturnTab, setViewReturnTab] = useState('askar');
  const [isExpanded, setIsExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useHRoleLanguage();
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);

  const { colors, buttonPrimaryStyle } = getThemedStyles(darkMode);
  const t = getHText(language);
  const divisionName = t.divisionName(4);

  const openImagePreview = (src) => setImagePreviewSrc(src);
  const closeImagePreview = () => setImagePreviewSrc(null);

  useEffect(() => {
    setDarkMode(initGlobalTheme(activeUser?.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?.id]);

  const fetchData = async () => {
    try {
      const [qRes, rRes, pRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ballan/queue?user_id=4'),
        axios.get('http://localhost:5000/api/medical-records?user_id=4'),
        axios.get('http://localhost:5000/api/s4-data')
      ]);

      setPendingQueue(qRes.data.filter(q => q.status === 'Pending'));
      setActiveRecords(rRes.data);
      setPersonnel(pRes.data);
    } catch (err) {
      console.error("Xogta Horinta 4aad lama soo xiriirin karno:", err);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = async (staff, returnTab = 'askar') => {
    setSelectedStaff(staff);
    setViewReturnTab(returnTab);
    try {
      const res = await axios.get(`http://localhost:5000/api/medical-records/${staff.id}`);
      setMedicalHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMedicalHistory([]);
    }
    setActiveTab('history-view');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeUser={activeUser}
        activePage={activeTab}
        setActivePage={setActiveTab}
        onLogout={handleLogout}
        showMsgModal={showMsgModal}
        setShowMsgModal={setShowMsgModal}
        darkMode={darkMode}
        language={language}
        role="H4"
      />

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        padding: '24px 32px',
        transition: 'all 0.25s ease',
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.text,
      }} className="main-content">

        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${colors.border}`,
        }} className="no-print">
          <h1 style={{ margin: 0, color: colors.text, fontSize: '22px', fontWeight: '800' }}>
            {divisionName}
          </h1>

          <button
            onClick={fetchData}
            style={buttonPrimaryStyle}
            title={t.refresh}
          >
            <RotateCw size={15} />
            <span>{t.refresh}</span>
          </button>
        </div>

        {/* ── TIRAKOOB (STATISTICS) TAB ── */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MonthlyReferralStats
              darkMode={darkMode}
              language={language}
              personnel={personnel}
              onViewDetails={(staff) => handleViewDetails(staff, 'analytics')}
              onImageClick={openImagePreview}
            />
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <HDashboardTables
            pendingQueue={pendingQueue}
            activeRecords={activeRecords}
            darkMode={darkMode}
            language={language}
            onImageClick={openImagePreview}
            activeStatusKey="completed"
          />
        )}

        {/* ── PERSONAL RECORDS TAB ── */}
        {(activeTab === 'personnel' || activeTab === 'askar') && (
          <PersonalRecordsList
            personnel={personnel}
            darkMode={darkMode}
            language={language}
            onView={(staff) => handleViewDetails(staff, 'askar')}
            onImageClick={openImagePreview}
          />
        )}

        {/* ── PERSONAL RECORD VIEW ── */}
        {activeTab === 'history-view' && selectedStaff && (
          <PersonalRecordView
            soldier={selectedStaff}
            history={medicalHistory}
            divisionName={divisionName}
            darkMode={darkMode}
            language={language}
            onBack={() => setActiveTab(viewReturnTab)}
            onImageClick={openImagePreview}
          />
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <SettingsPage
            user={activeUser}
            darkMode={darkMode}
            onThemeChange={(next) => { setDarkMode(next); setGlobalDarkMode(next, activeUser?.id); }}
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

export default Horinta4Dashboard;
