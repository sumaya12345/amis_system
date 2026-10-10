import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';
import FariimahaModal from './FariimahaModal';
import { useAuthUser } from './authSync';
import Sidebar from './components/Sidebar';
import RoleCards from './components/RoleCards';
import { SettingsPage } from './S1Dashboard';
import {
  PersonalRecordView,
  MonthlyReferralStats,
  ImagePreview,
  getHText,
  useHRoleLanguage,
  formatDiagnosis,
  formatLimitation,
} from './HRoleOverview';
import {
  getThemedStyles,
  setGlobalDarkMode,
  initGlobalTheme
} from './designSystem';

const DIVISIONS = ['1', '2', '3', '4'];

// Talye Urur interface text. Somali keeps the original wording.
const urText = {
  so: {
    dashboardTitle: 'Warbixinnada Guud ee Ururka',
    personnelTitle: 'Maamulka Xogta Askarta',
    badge: 'Taliska Ururka',
    subtitle: 'Guji Horin si aad u furto ama u xirto xogteeda.',
    pendingTitle: (h) => `⌛ Safka Sugitaanka (${h})`,
    completedTitle: (h) => `✅ Baaritaanada la Dhamaystiray (${h})`,
    colId: 'ID', colName: 'Magaca', colStatus: 'Xaaladda', colDiagnosis: 'Baaritaanka',
    colLimitation: 'Xaddidaadda', colDays: 'Maalmaha', pending: 'Pending',
    daysUnit: (n) => `${n} Maalmood`, noData: 'Xog lama hayo',
    personnelListTitle: (h) => `Liiska Askarta ${h} (READ-ONLY)`,
    colProfile: 'Profile', colWeight: 'Culays', colBlood: 'Dhiiga', colHeight: 'Dhirirka',
    colBirthPlace: 'Goobta Dhalashada', colBirthDate: 'Tariikhda Dhalashada', colAction: 'Action',
    viewHistory: 'View History', noPersonnel: 'Ma jiro wax askar ah Horintaan.',
    reportSummary: (p, a) => `${p} sugaya · ${a} baaritaan firfircoon`,
    personnelSummary: (n) => `${n} askari`,
    open: 'Fur', hide: 'Xir',
    loadError: 'Xogta lama soo heli karo.',
  },
  en: {
    dashboardTitle: 'Battalion General Reports',
    personnelTitle: 'Personnel Records Management',
    badge: 'Battalion Command',
    subtitle: 'Click a division to open or close its records.',
    pendingTitle: (h) => `⌛ Waiting Queue (${h})`,
    completedTitle: (h) => `✅ Completed Examinations (${h})`,
    colId: 'ID', colName: 'Name', colStatus: 'Status', colDiagnosis: 'Diagnosis',
    colLimitation: 'Limitation', colDays: 'Days', pending: 'Pending',
    daysUnit: (n) => `${n} Days`, noData: 'No data available',
    personnelListTitle: (h) => `${h} Personnel List (READ-ONLY)`,
    colProfile: 'Profile', colWeight: 'Weight', colBlood: 'Blood', colHeight: 'Height',
    colBirthPlace: 'Birth Place', colBirthDate: 'Birth Date', colAction: 'Action',
    viewHistory: 'View History', noPersonnel: 'There are no soldiers in this division.',
    reportSummary: (p, a) => `${p} waiting · ${a} active examinations`,
    personnelSummary: (n) => `${n} ${n === 1 ? 'soldier' : 'soldiers'}`,
    open: 'Open', hide: 'Close',
    loadError: 'The data could not be loaded.',
  },
  tr: {
    dashboardTitle: 'Tabur Genel Raporları',
    personnelTitle: 'Personel Kayıt Yönetimi',
    badge: 'Tabur Komutanlığı',
    subtitle: 'Kayıtlarını açmak veya kapatmak için bir tümene tıklayın.',
    pendingTitle: (h) => `⌛ Bekleme Sırası (${h})`,
    completedTitle: (h) => `✅ Tamamlanan Muayeneler (${h})`,
    colId: 'ID', colName: 'Ad', colStatus: 'Durum', colDiagnosis: 'Teşhis',
    colLimitation: 'Kısıtlama', colDays: 'Gün', pending: 'Bekliyor',
    daysUnit: (n) => `${n} Gün`, noData: 'Veri yok',
    personnelListTitle: (h) => `${h} Personel Listesi (SALT OKUNUR)`,
    colProfile: 'Profil', colWeight: 'Kilo', colBlood: 'Kan', colHeight: 'Boy',
    colBirthPlace: 'Doğum Yeri', colBirthDate: 'Doğum Tarihi', colAction: 'İşlem',
    viewHistory: 'Geçmişi Gör', noPersonnel: 'Bu tümende asker yok.',
    reportSummary: (p, a) => `${p} bekleyen · ${a} aktif muayene`,
    personnelSummary: (n) => `${n} asker`,
    open: 'Aç', hide: 'Kapat',
    loadError: 'Veriler yüklenemedi.',
  },
};

const photoUrl = (pic) => `http://localhost:5000/${pic}`;
const onPhotoError = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/profiles/default.svg'; };

function UrurDashboard({ user, onLogout }) {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'personnel', 'history', 'analytics', 'settings', 'messages'
  const [openDashboardDivisions, setOpenDashboardDivisions] = useState([]);
  const [openPersonnelDivisions, setOpenPersonnelDivisions] = useState([]);

  const [allQueue, setAllQueue] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [personnelByDivision, setPersonnelByDivision] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedStaffDivision, setSelectedStaffDivision] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loadError, setLoadError] = useState(false);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const authUser = useAuthUser(user);
  const activeUser = authUser || user || {};

  // Appearance & language (shared with the Settings page)
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useHRoleLanguage();
  const t = urText[language] || urText.so;
  const hT = getHText(language);
  const { colors, cardStyle, tableStyle, tableHeaderStyle, tableCellStyle, buttonSecondaryStyle, badgeStyle } = getThemedStyles(darkMode);

  useEffect(() => {
    setDarkMode(initGlobalTheme(activeUser?.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?.id]);

  // All divisions are loaded once: each division's soldiers come from its own data API,
  // and queue/medical records are assigned to a division through the soldier they belong to.
  const fetchData = async () => {
    try {
      const [qRes, rRes, ...pRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ballan/queue'),
        axios.get('http://localhost:5000/api/medical-records'),
        ...DIVISIONS.map((n) => axios.get(`http://localhost:5000/api/s${n}-data`)),
      ]);
      setAllQueue((Array.isArray(qRes.data) ? qRes.data : []).filter(q => q.status === 'Pending'));
      setAllRecords(Array.isArray(rRes.data) ? rRes.data : []);
      setPersonnelByDivision(DIVISIONS.reduce((acc, n, i) => ({ ...acc, [n]: Array.isArray(pRes[i].data) ? pRes[i].data : [] }), {}));
      setLoadError(false);
    } catch (err) {
      console.error("Xogta lama soo heli karo:", err);
      setLoadError(true);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleViewDetails = async (staff, division) => {
    setSelectedStaff(staff);
    setSelectedStaffDivision(division);
    try {
      // The history endpoint is keyed by the soldier's record id (sarkaal_data.id).
      const res = await axios.get(`http://localhost:5000/api/medical-records/${staff.id}`);
      setMedicalHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMedicalHistory([]);
    }
    setViewMode('history');
  };

  const divisionIds = (n) => new Set((personnelByDivision[n] || []).map((p) => Number(p.id)));
  const divisionOfRecord = (row) => {
    const n = DIVISIONS.find((d) => divisionIds(d).has(Number(row.sarkaal_data_id)));
    return n ? hT.divisionName(Number(n)) : null;
  };

  // Reports data for one division (unchanged rules from the former Reports page).
  const divisionReports = (n) => {
    const ids = divisionIds(n);
    const pending = allQueue.filter((q) => ids.has(Number(q.sarkaal_data_id)));
    const completed = allRecords
      .filter((r) => ids.has(Number(r.sarkaal_data_id)))
      // A. Isku-dar maalmaha haddii qofku dhowr jeer soo galay
      .reduce((acc, current) => {
        const xogtaHore = acc.find(item => item.sarkaal_id === current.sarkaal_id);
        if (xogtaHore) {
          xogtaHore.days = parseInt(xogtaHore.days) + parseInt(current.days);
          return acc;
        }
        return [...acc, { ...current }];
      }, [])
      // B. Xisaabi maalmaha dhimanaya
      .map(report => {
        const maanta = new Date();
        const dhamaadka = new Date(report.created_at);
        dhamaadka.setDate(dhamaadka.getDate() + (parseInt(report.days) || 0));
        return { ...report, remainingDays: Math.ceil((dhamaadka - maanta) / (1000 * 60 * 60 * 24)) };
      })
      // C. Kaliya soo daa dadka maalmuhu u hadheen
      .filter(report => (isNaN(report.remainingDays) ? true : report.remainingDays > 0));
    return { pending, completed };
  };

  const toggle = (setter) => (n) => setter((open) => (open.includes(n) ? open.filter((x) => x !== n) : [...open, n]));
  const toggleDashboardDivision = toggle(setOpenDashboardDivisions);
  const togglePersonnelDivision = toggle(setOpenPersonnelDivisions);

  const sectionStyle = { ...cardStyle, padding: '20px' };

  const pageHeader = (title) => (
    <header style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${colors.border}` }} className="no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ color: colors.text, fontSize: '22px', fontWeight: '800', margin: 0 }}>{title}</h1>
        <span style={{ ...badgeStyle, backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primaryBorder}`, fontWeight: '700' }}>
          {t.badge}
        </span>
      </div>
      <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: '13px' }}>{t.subtitle}</p>
    </header>
  );

  // One expandable division card: the card toggles its own list, shown directly beneath it.
  const DivisionAccordion = ({ openList, onToggle, summary, renderContent }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {DIVISIONS.map((n) => {
        const isOpen = openList.includes(n);
        return (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }} aria-expanded={isOpen}>
              <RoleCards
                roles={[n]}
                columns="1fr"
                selectedRole={isOpen ? n : null}
                onSelectRole={onToggle}
                darkMode={darkMode}
                labels={{ [n]: { title: hT.divisionName(Number(n)), subtitle: summary(n) } }}
              />
              <span style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: colors.textMuted, pointerEvents: 'none' }}>
                {isOpen ? t.hide : t.open}
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>
            {isOpen && renderContent(n)}
          </div>
        );
      })}
    </div>
  );

  const ReportTable = ({ data, type }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>{t.colId}</th>
            <th style={tableHeaderStyle}>{t.colName}</th>
            {type === 'pending' ? (
              <th style={tableHeaderStyle}>{t.colStatus}</th>
            ) : (
              <>
                <th style={tableHeaderStyle}>{t.colDiagnosis}</th>
                <th style={tableHeaderStyle}>{t.colLimitation}</th>
                <th style={tableHeaderStyle}>{t.colDays}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map(d => (
            <tr key={d.queue_id || d.id}>
              <td style={{ ...tableCellStyle, fontWeight: '600' }}>{d.sarkaal_id}</td>
              <td style={tableCellStyle}>{d.name}</td>
              {type === 'pending' ? (
                <td style={tableCellStyle}>
                  <span style={{ ...badgeStyle, backgroundColor: colors.warningBg, color: colors.warning, border: `1px solid ${colors.warningBorder}` }}>
                    {t.pending}
                  </span>
                </td>
              ) : (
                <>
                  <td style={{ ...tableCellStyle, fontWeight: '600' }}>{formatDiagnosis(d.diagnosis, language)}</td>
                  <td style={tableCellStyle}>{formatLimitation(d.limitation, language)}</td>
                  <td style={tableCellStyle}>
                    <span style={{ ...badgeStyle, backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primaryBorder}`, fontWeight: '700' }}>
                      {t.daysUnit(d.days)}
                    </span>
                  </td>
                </>
              )}
            </tr>
          )) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: colors.textMuted, fontSize: '13px' }}>
                {t.noData}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const errorBanner = loadError && (
    <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '16px', backgroundColor: colors.errorBg, color: colors.error, border: `1px solid ${colors.errorBorder}`, fontSize: '13px', fontWeight: '600' }}>
      {t.loadError}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeUser={activeUser}
        activePage={viewMode === 'personnel' || viewMode === 'history' ? 'askar' : viewMode}
        setActivePage={(page) => {
          if (page === 'askar') setViewMode('personnel');
          else setViewMode(page);
        }}
        onLogout={handleLogout}
        showMsgModal={showMsgModal}
        setShowMsgModal={setShowMsgModal}
        darkMode={darkMode}
        language={language}
        role="Urur"
      />

      <main style={{
        flex: 1,
        minWidth: 0,
        padding: '24px 32px',
        transition: 'all 0.25s ease',
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.text,
      }} className="main-content">

        {/* --- DASHBOARD: division cards with their reports --- */}
        {viewMode === 'dashboard' && (
          <>
            {pageHeader(t.dashboardTitle)}
            {errorBanner}
            <DivisionAccordion
              openList={openDashboardDivisions}
              onToggle={toggleDashboardDivision}
              summary={(n) => { const r = divisionReports(n); return t.reportSummary(r.pending.length, r.completed.length); }}
              renderContent={(n) => {
                const { pending, completed } = divisionReports(n);
                const name = hT.divisionName(Number(n));
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '12px', borderLeft: `3px solid ${colors.primaryBorder}` }}>
                    <div style={sectionStyle}>
                      <h3 style={{ color: colors.warning, margin: '0 0 15px', fontSize: '17px', fontWeight: '600' }}>{t.pendingTitle(name)}</h3>
                      <ReportTable data={pending} type="pending" />
                    </div>
                    <div style={sectionStyle}>
                      <h3 style={{ color: colors.success, margin: '0 0 15px', fontSize: '17px', fontWeight: '600' }}>{t.completedTitle(name)}</h3>
                      <ReportTable data={completed} type="active" />
                    </div>
                  </div>
                );
              }}
            />
          </>
        )}

        {/* --- PERSONAL RECORDS: division cards with their personnel --- */}
        {viewMode === 'personnel' && (
          <>
            {pageHeader(t.personnelTitle)}
            {errorBanner}
            <DivisionAccordion
              openList={openPersonnelDivisions}
              onToggle={togglePersonnelDivision}
              summary={(n) => t.personnelSummary((personnelByDivision[n] || []).length)}
              renderContent={(n) => {
                const people = personnelByDivision[n] || [];
                return (
                  <div style={{ ...sectionStyle, marginLeft: '12px', borderLeft: `3px solid ${colors.primaryBorder}` }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.text, fontSize: '17px', fontWeight: '600' }}>
                      {t.personnelListTitle(hT.divisionName(Number(n)))}
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            {[t.colProfile, t.colId, t.colName, t.colWeight, t.colBlood, t.colHeight, t.colBirthPlace, t.colBirthDate, t.colAction].map((h) => (
                              <th key={h} style={tableHeaderStyle}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {people.length > 0 ? people.map(p => (
                            <tr key={p.id}>
                              <td style={tableCellStyle}>
                                <img
                                  src={photoUrl(p.profile_pic)}
                                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'zoom-in' }}
                                  alt=""
                                  onClick={() => setImagePreviewSrc(photoUrl(p.profile_pic))}
                                  onError={onPhotoError}
                                />
                              </td>
                              <td style={tableCellStyle}>{p.sarkaal_id}</td>
                              <td style={tableCellStyle}>{p.name}</td>
                              <td style={tableCellStyle}>{p.culays} kg</td>
                              <td style={{ ...tableCellStyle, color: colors.error, fontWeight: 'bold' }}>{p.dhiiga}</td>
                              <td style={tableCellStyle}>{p.dhirirka}</td>
                              <td style={tableCellStyle}>{p.goobta_dhalashada}</td>
                              <td style={tableCellStyle}>{p.tariikhda_dhalashada ? new Date(p.tariikhda_dhalashada).toLocaleDateString(hT.locale) : '-'}</td>
                              <td style={tableCellStyle}>
                                <button onClick={() => handleViewDetails(p, n)} style={{ ...buttonSecondaryStyle, padding: '6px 12px', fontSize: '12px' }}>
                                  {t.viewHistory}
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: colors.textMuted }}>
                                {t.noPersonnel}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }}
            />
          </>
        )}

        {/* --- MEDICAL HISTORY OF ONE SOLDIER --- */}
        {viewMode === 'history' && selectedStaff && (
          <PersonalRecordView
            soldier={selectedStaff}
            history={medicalHistory}
            divisionName={selectedStaffDivision ? hT.divisionName(Number(selectedStaffDivision)) : ''}
            darkMode={darkMode}
            language={language}
            onBack={() => setViewMode('personnel')}
            onImageClick={setImagePreviewSrc}
          />
        )}

        {/* --- TIRAKOOB: monthly medical attendance (same component as Mo) --- */}
        {viewMode === 'analytics' && (
          <MonthlyReferralStats
            mode="visits"
            darkMode={darkMode}
            language={language}
            onImageClick={setImagePreviewSrc}
            resolveDivision={divisionOfRecord}
          />
        )}

        {/* --- SETTINGS (shared S/H/Mo settings) --- */}
        {viewMode === 'settings' && (
          <SettingsPage
            user={activeUser}
            darkMode={darkMode}
            onThemeChange={(next) => { setDarkMode(next); setGlobalDarkMode(next, activeUser?.id); }}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}

        <FariimahaModal
          isOpen={showMsgModal || viewMode === 'messages'}
          onClose={() => {
            setShowMsgModal(false);
            if (viewMode === 'messages') setViewMode('dashboard');
          }}
          currentUser={activeUser}
          darkMode={darkMode}
          language={language}
        />
      </main>

      <ImagePreview src={imagePreviewSrc} onClose={() => setImagePreviewSrc(null)} language={language} />
    </div>
  );
}

export default UrurDashboard;
