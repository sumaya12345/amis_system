import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FariimahaModal from './FariimahaModal';
import { useAuthUser } from './authSync';
import Sidebar from './components/Sidebar';
import RoleCards from './components/RoleCards';
import { SettingsPage } from './S1Dashboard';
import {
  MonthlyReferralStats,
  ImagePreview,
  useHRoleLanguage,
  DIAGNOSIS_OPTIONS,
  DIAGNOSIS_OTHER,
  DIAGNOSIS_OTHER_PREFIX,
  LIMITATION_OPTIONS,
  getMedicalOptionLabel,
  formatDiagnosis,
  formatLimitation,
} from './HRoleOverview';
import {
  getThemedStyles,
  labelStyle as baseLabelStyle,
  modalOverlayStyle,
  modalContentStyle as baseModalContentStyle,
  borderRadius,
  setGlobalDarkMode,
  initGlobalTheme
} from './designSystem';
import {
  Clock,
  CheckCircle2,
  Activity,
  Printer,
  RotateCw,
  Shield,
  X
} from 'lucide-react';

// Mo (Medical) interface text. Somali keeps the original wording.
const medText = {
  so: {
    locale: 'so-SO',
    headerTitle: 'Xarunta Baaritaanka Caafimaadka',
    refresh: 'Refresh Xogta',
    currentQueue: 'Safka Hadda',
    people: (n) => `${n} Qof`,
    queueEmpty: 'Safka baaritaanka waa maran yahay.',
    examinationOf: (name) => `Baaritaanka: ${name}`,
    examForm: 'Foomka Baaritaanka',
    sarkaalId: 'Sarkaal ID',
    diagnosisLabel: 'Natiijada Baaritaanka (Diagnosis)',
    diagnosisPlaceholder: 'Qor cudurka ama xaaladda...',
    chooseDiagnosis: '-- Dooro Natiijada --',
    otherDiagnosisLabel: 'Faahfaahin kale (Other)',
    requiredField: 'Fadlan buuxi ama dooro meeshan.',
    timeLeft: 'Waqtiga haray',
    queueExpired: 'Waqtigii 24-ka saac ee sarkaalkan wuu dhammaaday; waxaa laga saaray safka.',
    limitationsLabel: 'Xaddidaadda Shaqada (Limitations)',
    chooseType: '-- Dooro Nooca --',
    daysLabel: 'Maalmaha Istiraxada (Days)',
    daysPlaceholder: 'Tusaale: 3',
    referralLabel: 'Gudbin Isbitaal Weyn (Referral)?',
    chooseYesNo: '-- Dooro Haa ama Maya --',
    referYes: 'Haa (Gudbi Isbitaalka Erdogan)',
    referNo: 'Maya (Daaweyn Halkan ah)',
    cancel: 'Ka Noqo',
    saveExam: 'Keydi Baaritaanka',
    noneSelected: 'Qofna lama dooran',
    noneSelectedHint: 'Fadlan liiska safka bidix ka dooro sarkaalka aad doonayso inaad baarto.',
    chooseDivision: 'Dooro Horinta aad rabto inaad xogteeda aragto:',
    visitedTitle: (h) => `Askarta Booqday Xarunta Caafimaadka (${h})`,
    total: 'Wadarta',
    colPhoto: 'Sawir',
    colName: 'Magaca',
    colVisits: 'Booqashooyin',
    colLastVisit: 'Booqashadii u Dambeysay',
    colAction: 'Ficil',
    viewHistory: 'Fiiri Taariikhda',
    noVisited: (h) => `Lama helin askar ka tirsan ${h} oo hore u booqday xarunta caafimaadka.`,
    confirmTitle: 'Xaqiiji Keydinta',
    confirmText: 'Ma hubtaa inaad kaydiso baaritaanka sarkaalka',
    confirmYes: 'Haa, Keydi Xogta',
    saveSuccess: (name) => `Xogta baaritaanka ee ${name} si guul leh ayaa loo keydiyay!`,
    saveError: 'Khalad ayaa dhacay!',
    successTitle: 'Guul!',
    ok: 'Fahmay (OK)',
    historyTitle: 'Taariikhda Baaritaanka',
    noRestriction: 'No restriction',
    diagnosisPrefix: 'Baaritaanka:',
    noHistory: 'Taariikh baaritaan hore lama helin.',
    close: 'Xir',
    printSlip: 'Daabac Waraaqda',
    divisionLabels: {
      1: { title: 'Horinta 1aad', subtitle: 'Company 1 Unit Records' },
      2: { title: 'Horinta 2aad', subtitle: 'Company 2 Unit Records' },
      3: { title: 'Horinta 3aad', subtitle: 'Company 3 Unit Records' },
      4: { title: 'Horinta 4aad', subtitle: 'Company 4 Unit Records' },
    },
  },
  en: {
    locale: 'en-GB',
    headerTitle: 'Medical Examination Center',
    refresh: 'Refresh Data',
    currentQueue: 'Current Queue',
    people: (n) => `${n} ${n === 1 ? 'Person' : 'People'}`,
    queueEmpty: 'The examination queue is empty.',
    examinationOf: (name) => `Examination: ${name}`,
    examForm: 'Examination Form',
    sarkaalId: 'Soldier ID',
    diagnosisLabel: 'Examination Result (Diagnosis)',
    diagnosisPlaceholder: 'Enter the illness or condition...',
    chooseDiagnosis: '-- Select a Result --',
    otherDiagnosisLabel: 'Other result (details)',
    requiredField: 'Please fill in or select this field.',
    timeLeft: 'Time left',
    queueExpired: "This soldier's 24-hour window has ended; they were removed from the queue.",
    limitationsLabel: 'Work Limitation',
    chooseType: '-- Select a Type --',
    daysLabel: 'Rest Days',
    daysPlaceholder: 'Example: 3',
    referralLabel: 'Refer to the Main Hospital?',
    chooseYesNo: '-- Select Yes or No --',
    referYes: 'Yes (Refer to Erdogan Hospital)',
    referNo: 'No (Treat Here)',
    cancel: 'Cancel',
    saveExam: 'Save Examination',
    noneSelected: 'Nobody selected',
    noneSelectedHint: 'Please select the soldier you want to examine from the queue on the left.',
    chooseDivision: 'Select the division whose records you want to see:',
    visitedTitle: (h) => `Soldiers Who Visited the Medical Center (${h})`,
    total: 'Total',
    colPhoto: 'Photo',
    colName: 'Name',
    colVisits: 'Visits',
    colLastVisit: 'Last Visit',
    colAction: 'Action',
    viewHistory: 'View History',
    noVisited: (h) => `No soldiers from ${h} have visited the medical center yet.`,
    confirmTitle: 'Confirm Save',
    confirmText: 'Are you sure you want to save the examination of',
    confirmYes: 'Yes, Save',
    saveSuccess: (name) => `The examination of ${name} was saved successfully!`,
    saveError: 'An error occurred!',
    successTitle: 'Success!',
    ok: 'OK',
    historyTitle: 'Examination History',
    noRestriction: 'No restriction',
    diagnosisPrefix: 'Diagnosis:',
    noHistory: 'No previous examination history was found.',
    close: 'Close',
    printSlip: 'Print Slip',
    divisionLabels: {
      1: { title: '1st Division', subtitle: 'Company 1 Unit Records' },
      2: { title: '2nd Division', subtitle: 'Company 2 Unit Records' },
      3: { title: '3rd Division', subtitle: 'Company 3 Unit Records' },
      4: { title: '4th Division', subtitle: 'Company 4 Unit Records' },
    },
  },
  tr: {
    locale: 'tr-TR',
    headerTitle: 'Sağlık Muayene Merkezi',
    refresh: 'Verileri Yenile',
    currentQueue: 'Mevcut Sıra',
    people: (n) => `${n} Kişi`,
    queueEmpty: 'Muayene sırası boş.',
    examinationOf: (name) => `Muayene: ${name}`,
    examForm: 'Muayene Formu',
    sarkaalId: 'Asker ID',
    diagnosisLabel: 'Muayene Sonucu (Teşhis)',
    diagnosisPlaceholder: 'Hastalığı veya durumu yazın...',
    chooseDiagnosis: '-- Sonuç Seçin --',
    otherDiagnosisLabel: 'Diğer sonuç (ayrıntı)',
    requiredField: 'Lütfen bu alanı doldurun veya seçin.',
    timeLeft: 'Kalan süre',
    queueExpired: 'Bu askerin 24 saatlik süresi doldu; sıradan çıkarıldı.',
    limitationsLabel: 'Çalışma Kısıtlaması',
    chooseType: '-- Tür Seçin --',
    daysLabel: 'İstirahat Günleri',
    daysPlaceholder: 'Örnek: 3',
    referralLabel: 'Ana Hastaneye Sevk?',
    chooseYesNo: '-- Evet veya Hayır Seçin --',
    referYes: 'Evet (Erdoğan Hastanesine Sevk)',
    referNo: 'Hayır (Burada Tedavi)',
    cancel: 'İptal',
    saveExam: 'Muayeneyi Kaydet',
    noneSelected: 'Kimse seçilmedi',
    noneSelectedHint: 'Lütfen soldaki sıradan muayene etmek istediğiniz askeri seçin.',
    chooseDivision: 'Kayıtlarını görmek istediğiniz tümeni seçin:',
    visitedTitle: (h) => `Sağlık Merkezini Ziyaret Eden Askerler (${h})`,
    total: 'Toplam',
    colPhoto: 'Fotoğraf',
    colName: 'Ad',
    colVisits: 'Ziyaret',
    colLastVisit: 'Son Ziyaret',
    colAction: 'İşlem',
    viewHistory: 'Geçmişi Gör',
    noVisited: (h) => `${h} biriminden henüz sağlık merkezini ziyaret eden asker yok.`,
    confirmTitle: 'Kaydı Onayla',
    confirmText: 'Şu askerin muayenesini kaydetmek istediğinizden emin misiniz:',
    confirmYes: 'Evet, Kaydet',
    saveSuccess: (name) => `${name} muayenesi başarıyla kaydedildi!`,
    saveError: 'Bir hata oluştu!',
    successTitle: 'Başarılı!',
    ok: 'Tamam',
    historyTitle: 'Muayene Geçmişi',
    noRestriction: 'Kısıtlama yok',
    diagnosisPrefix: 'Teşhis:',
    noHistory: 'Önceki muayene geçmişi bulunamadı.',
    close: 'Kapat',
    printSlip: 'Belgeyi Yazdır',
    divisionLabels: {
      1: { title: '1. Tümen', subtitle: 'Bölük 1 Kayıtları' },
      2: { title: '2. Tümen', subtitle: 'Bölük 2 Kayıtları' },
      3: { title: '3. Tümen', subtitle: 'Bölük 3 Kayıtları' },
      4: { title: '4. Tümen', subtitle: 'Bölük 4 Kayıtları' },
    },
  },
};

function MedicalDashboard({ user, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history' | 'analytics' | 'settings'
  const [selectedHorin, setSelectedHorin] = useState(null);
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [patientHistory, setPatientHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReferralSlip, setShowReferralSlip] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);

  // Fariimaha state
  const [showMsgModal, setShowMsgModal] = useState(false);

  // Profile sync state
  const authUser = useAuthUser(user);
  const currentUser = authUser || user || {};

  // Appearance & language (shared with the Settings page)
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useHRoleLanguage();
  const t = medText[language] || medText.so;
  const {
    colors, cardStyle, tableStyle, tableHeaderStyle, tableCellStyle,
    buttonPrimaryStyle, buttonSecondaryStyle, inputStyle, badgeStyle, neutralBg, subtleBg,
  } = getThemedStyles(darkMode);
  const labelStyle = { ...baseLabelStyle, color: colors.textSecondary };
  const modalContentStyle = { ...baseModalContentStyle, backgroundColor: colors.white, color: colors.text, border: `1px solid ${colors.border}` };

  useEffect(() => {
    setDarkMode(initGlobalTheme(currentUser?.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // A queue entry's 24-hour window starts at queue_list.created_at (returned as queue_created_at).
  // The backend cancels expired entries; this clock only drives the on-screen countdown.
  const QUEUE_WINDOW_MS = 24 * 60 * 60 * 1000;
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const queueDeadline = (item) => {
    const start = new Date(item.queue_created_at).getTime();
    return Number.isNaN(start) ? null : start + QUEUE_WINDOW_MS;
  };

  const filterExpiredQueue = (queueList) => queueList.filter(item => {
    const deadline = queueDeadline(item);
    return deadline !== null && deadline > nowMs;
  });

  const currentQueue = filterExpiredQueue(queue);

  const [medicalData, setMedicalData] = useState({
    limitations: '',
    days: '',
    referrals: '',
    diagnosis: '',
    otherDiagnosis: ''
  });

  // --- API CALLS ---
  const fetchQueue = () => {
    axios.get('http://localhost:5000/api/ballan/queue')
      .then(res => {
        const pendingOnes = res.data.filter(p => p.status === 'Pending');
        setQueue(pendingOnes);
      })
      .catch(err => console.log("Queue Error:", err));
  };

  const fetchAllPersonnel = () => {
    axios.get('http://localhost:5000/api/sarkaal-data')
      .then(res => setAllPersonnel(res.data))
      .catch(err => console.error("Xogta Guud Error:", err));
  };

  // Completed examinations (medical_records) — the system's record of a real visit.
  const fetchMedicalRecords = () => {
    axios.get('http://localhost:5000/api/medical-records')
      .then(res => setMedicalRecords(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Medical Records Error:", err));
  };

  const handleRefresh = () => {
    fetchQueue();
    fetchAllPersonnel();
    fetchMedicalRecords();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleViewHistory = (personId) => {
    axios.get(`http://localhost:5000/api/medical-records/${personId}`)
      .then(res => {
        setPatientHistory(res.data);
        setShowHistoryModal(true);
      })
      .catch(err => console.error("History Error:", err));
  };

  useEffect(() => {
    fetchQueue();
    fetchAllPersonnel();
    fetchMedicalRecords();
    const interval = setInterval(() => { fetchQueue(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setMedicalData({ limitations: '', days: '', referrals: '', diagnosis: '', otherDiagnosis: '' });
  };

  // If the selected soldier's window ends while the form is open, the backend will no
  // longer accept the examination, so release the form (unless the slip is being printed).
  useEffect(() => {
    if (!selectedPatient || showReferralSlip || showSuccessModal) return;
    const deadline = queueDeadline(selectedPatient);
    if (deadline !== null && deadline <= nowMs) {
      setSelectedPatient(null);
      setShowConfirmModal(false);
      fetchQueue();
      alert(t.queueExpired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMs]);

  // Value saved to medical_records.diagnosis: the selected option, or "Other: <custom text>".
  const diagnosisValue = medicalData.diagnosis === DIAGNOSIS_OTHER
    ? `${DIAGNOSIS_OTHER_PREFIX}${medicalData.otherDiagnosis.trim()}`
    : medicalData.diagnosis;

  // Translated browser validation messages for required fields.
  const requiredMessage = {
    onInvalid: (e) => e.currentTarget.setCustomValidity(t.requiredField),
    onInput: (e) => e.currentTarget.setCustomValidity(''),
  };

  const executeSave = () => {
    const finalData = {
      queue_id: selectedPatient.queue_id,
      sarkaal_data_id: selectedPatient.sarkaal_data_id,
      diagnosis: diagnosisValue,
      limitation: medicalData.limitations,
      days: medicalData.days,
      referrals: medicalData.referrals
    };

    axios.post(`http://localhost:5000/api/complete-medical`, finalData)
      .then(() => {
        setModalMessage(t.saveSuccess(selectedPatient.name));
        setShowConfirmModal(false);
        if (medicalData.referrals === 'Yes') {
          setShowReferralSlip(true);
        } else {
          setShowSuccessModal(true);
          setSelectedPatient(null);
        }
        fetchQueue();
        fetchMedicalRecords();
      })
      .catch(err => alert(t.saveError));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handlePrint = () => {
    window.print();
    setShowReferralSlip(false);
    setSelectedPatient(null);
    setShowSuccessModal(true);
  };

  // Visits per soldier (sarkaal_data.id) from real examination records.
  const visitsByPerson = medicalRecords.reduce((map, record) => {
    const key = String(record.sarkaal_data_id);
    const entry = map[key] || { count: 0, last: null };
    entry.count += 1;
    if (!entry.last || new Date(record.created_at) > new Date(entry.last)) entry.last = record.created_at;
    map[key] = entry;
    return map;
  }, {});

  // Personal Records: only soldiers of the selected division with at least one examination record.
  const filteredPersonnel = allPersonnel.filter(p => p.horinta === selectedHorin && visitsByPerson[String(p.id)]);

  // Remaining time until the 24-hour deadline, as HH:MM:SS.
  const formatTimeLeft = (item) => {
    const deadline = queueDeadline(item);
    if (deadline === null) return '--:--:--';
    const totalSeconds = Math.max(0, Math.floor((deadline - nowMs) / 1000));
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
  };

  const sidebarPage = activeTab === 'queue' ? 'dashboard' : (activeTab === 'history' ? 'askar' : activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeUser={currentUser}
        activePage={sidebarPage}
        setActivePage={(tab) => {
          if (tab === 'dashboard' || tab === 'queue') setActiveTab('queue');
          else if (tab === 'askar' || tab === 'history') { setActiveTab('history'); setSelectedHorin(null); }
          else setActiveTab(tab);
        }}
        onLogout={handleLogout}
        showMsgModal={showMsgModal}
        setShowMsgModal={setShowMsgModal}
        darkMode={darkMode}
        language={language}
        role="medic"
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
            {t.headerTitle}
          </h1>

          <button
            onClick={handleRefresh}
            style={buttonSecondaryStyle}
            title={t.refresh}
            aria-label={t.refresh}
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* ── ACTIVE TAB: QUEUE & DIAGNOSIS ── */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

            {/* LEFT: QUEUE LIST */}
            <div style={{ ...cardStyle, width: '360px', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: subtleBg,
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: colors.text }}>
                  {t.currentQueue}
                </h3>
                <span style={{
                  ...badgeStyle,
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                  border: `1px solid ${colors.primaryBorder}`,
                }}>
                  {t.people(currentQueue.length)}
                </span>
              </div>

              <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
                {currentQueue.length > 0 ? (
                  currentQueue.map((item) => {
                    const isSelected = selectedPatient?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectPatient(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderBottom: `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          backgroundColor: isSelected ? colors.primaryLight : colors.white,
                          borderLeft: isSelected ? `4px solid ${colors.primary}` : '4px solid transparent',
                        }}
                      >
                        <img
                          src={`http://localhost:5000/${item.profile_pic}`}
                          width="40"
                          height="40"
                          style={{ borderRadius: '50%', objectFit: 'cover', border: `1px solid ${colors.border}`, cursor: 'zoom-in' }}
                          alt=""
                          onClick={(e) => { e.stopPropagation(); setImagePreviewSrc(`http://localhost:5000/${item.profile_pic}`); }}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/profiles/default.svg"; }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: isSelected ? '700' : '600', color: colors.text }}>
                            {item.name}
                          </h4>
                          <span style={{ fontSize: '11px', color: colors.textMuted }}>ID: {item.sarkaal_id}</span>
                        </div>
                        {(() => {
                          const msLeft = (queueDeadline(item) || 0) - nowMs;
                          const urgent = msLeft < 60 * 60 * 1000;
                          return (
                            <div
                              title={t.timeLeft}
                              style={{
                                ...badgeStyle,
                                backgroundColor: urgent ? colors.errorBg : neutralBg,
                                color: urgent ? colors.error : colors.textSecondary,
                                border: `1px solid ${urgent ? colors.errorBorder : colors.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              <Clock size={11} />
                              <span>{formatTimeLeft(item)}</span>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                    {t.queueEmpty}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: EXAMINATION FORM */}
            <div style={{ ...cardStyle, flex: 1, padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 22px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: subtleBg,
              }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>
                  {selectedPatient ? t.examinationOf(selectedPatient.name) : t.examForm}
                </h3>
                {selectedPatient && (
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>
                    {t.sarkaalId}: <strong>{selectedPatient.sarkaal_id}</strong>
                  </span>
                )}
              </div>

              {selectedPatient ? (
                <div style={{ padding: '24px' }}>
                  <form onSubmit={handleSaveClick}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>{t.diagnosisLabel}</label>
                        <select
                          style={inputStyle}
                          value={medicalData.diagnosis}
                          onChange={e => setMedicalData({
                            ...medicalData,
                            diagnosis: e.target.value,
                            // Leaving "Other" discards the custom text
                            otherDiagnosis: e.target.value === DIAGNOSIS_OTHER ? medicalData.otherDiagnosis : '',
                          })}
                          required
                          {...requiredMessage}
                        >
                          <option value="">{t.chooseDiagnosis}</option>
                          {DIAGNOSIS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{getMedicalOptionLabel('diagnosis', option, language)}</option>
                          ))}
                        </select>
                        {medicalData.diagnosis === DIAGNOSIS_OTHER && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={labelStyle}>{t.otherDiagnosisLabel}</label>
                            <input
                              type="text"
                              style={inputStyle}
                              value={medicalData.otherDiagnosis}
                              onChange={e => setMedicalData({ ...medicalData, otherDiagnosis: e.target.value })}
                              placeholder={t.diagnosisPlaceholder}
                              required
                              pattern=".*\S.*"
                              {...requiredMessage}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>{t.limitationsLabel}</label>
                        <select
                          style={inputStyle}
                          value={medicalData.limitations}
                          onChange={e => setMedicalData({ ...medicalData, limitations: e.target.value })}
                          required
                          {...requiredMessage}
                        >
                          <option value="">{t.chooseType}</option>
                          {LIMITATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>{getMedicalOptionLabel('limitation', option, language)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>{t.daysLabel}</label>
                        <input
                          type="number"
                          style={inputStyle}
                          value={medicalData.days}
                          onChange={e => setMedicalData({ ...medicalData, days: e.target.value })}
                          placeholder={t.daysPlaceholder}
                          min="0"
                          required
                          {...requiredMessage}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>{t.referralLabel}</label>
                        <select
                          style={inputStyle}
                          value={medicalData.referrals}
                          onChange={e => setMedicalData({ ...medicalData, referrals: e.target.value })}
                          required
                          {...requiredMessage}
                        >
                          <option value="">{t.chooseYesNo}</option>
                          <option value="Yes">{t.referYes}</option>
                          <option value="No">{t.referNo}</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        style={buttonSecondaryStyle}
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        style={buttonPrimaryStyle}
                      >
                        {t.saveExam}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: colors.textMuted }}>
                  <Activity size={36} style={{ color: colors.primaryBorder, margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: colors.text }}>
                    {t.noneSelected}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    {t.noneSelectedHint}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVE TAB: PERSONAL RECORDS (soldiers with previous medical visits) ── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Horinta 1-4 selection cards using RoleCards */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>{t.chooseDivision}</label>
              <RoleCards
                roles={['1', '2', '3', '4']}
                selectedRole={selectedHorin ? selectedHorin.replace('Horinta ', '').replace('aad', '') : null}
                onSelectRole={(hNum) => setSelectedHorin(`Horinta ${hNum}aad`)}
                darkMode={darkMode}
                labels={t.divisionLabels}
              />
            </div>

            {selectedHorin && (() => {
              const divisionNumber = selectedHorin.replace('Horinta ', '').replace('aad', '');
              const divisionTitle = t.divisionLabels[divisionNumber]?.title || selectedHorin;
              return (
                <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>
                      {t.visitedTitle(divisionTitle)}
                    </h3>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>
                      {t.total}: <strong>{filteredPersonnel.length}</strong>
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>{t.colPhoto}</th>
                          <th style={tableHeaderStyle}>{t.sarkaalId}</th>
                          <th style={tableHeaderStyle}>{t.colName}</th>
                          <th style={tableHeaderStyle}>{t.colVisits}</th>
                          <th style={tableHeaderStyle}>{t.colLastVisit}</th>
                          <th style={tableHeaderStyle}>{t.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPersonnel.map(person => {
                          const visits = visitsByPerson[String(person.id)];
                          return (
                            <tr key={person.id}>
                              <td style={tableCellStyle}>
                                <img
                                  src={`http://localhost:5000/${person.profile_pic}`}
                                  width="34"
                                  height="34"
                                  style={{ borderRadius: borderRadius.sm, objectFit: 'cover', border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                                  alt=""
                                  onClick={() => setImagePreviewSrc(`http://localhost:5000/${person.profile_pic}`)}
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/profiles/default.svg"; }}
                                />
                              </td>
                              <td style={{ ...tableCellStyle, fontWeight: '600' }}>{person.sarkaal_id}</td>
                              <td style={tableCellStyle}>{person.name}</td>
                              <td style={tableCellStyle}>
                                <span style={{ ...badgeStyle, backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primaryBorder}` }}>
                                  {visits.count}
                                </span>
                              </td>
                              <td style={tableCellStyle}>{new Date(visits.last).toLocaleDateString(t.locale)}</td>
                              <td style={tableCellStyle}>
                                <button
                                  onClick={() => handleViewHistory(person.id)}
                                  style={{ ...buttonSecondaryStyle, padding: '5px 12px', fontSize: '12px' }}
                                >
                                  {t.viewHistory}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredPersonnel.length === 0 && (
                      <div style={{ padding: '30px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                        {t.noVisited(divisionTitle)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── ACTIVE TAB: TIRAKOOB (MONTHLY ATTENDANCE STATISTICS) ── */}
        {activeTab === 'analytics' && (
          <MonthlyReferralStats
            mode="visits"
            darkMode={darkMode}
            language={language}
            onImageClick={setImagePreviewSrc}
          />
        )}

        {/* ── ACTIVE TAB: SETTINGS ── */}
        {activeTab === 'settings' && (
          <SettingsPage
            user={currentUser}
            darkMode={darkMode}
            onThemeChange={(next) => { setDarkMode(next); setGlobalDarkMode(next, currentUser?.id); }}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}
      </main>

      {/* ── MODALS ── */}

      {/* 1. CONFIRM SAVE MODAL */}
      {showConfirmModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '420px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: colors.primaryLight,
              color: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: colors.text }}>
              {t.confirmTitle}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: colors.textMuted, lineHeight: 1.5 }}>
              {t.confirmText} <strong>{selectedPatient?.name}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setShowConfirmModal(false)} style={buttonSecondaryStyle}>
                {t.cancel}
              </button>
              <button onClick={executeSave} style={buttonPrimaryStyle}>
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REFERRAL SLIP (PRINTABLE) — an official paper document, kept light for printing */}
      {showReferralSlip && (
        <div style={modalOverlayStyle}>
          <div id="printable-slip" style={{
            background: 'white',
            color: '#0f172a',
            padding: '40px',
            borderRadius: borderRadius.xl,
            width: '640px',
            maxWidth: '100%',
            textAlign: 'left',
            border: '2px solid #0f2744',
            boxShadow: colors.shadowXl,
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '18px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                <Shield size={22} color="#0f2744" />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f2744', letterSpacing: '0.04em' }}>
                  AMIS OFFICIAL REFERRAL SLIP
                </h2>
              </div>
              <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                RECEP TAYYIP ERDOGAN HOSPITAL
              </p>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Mogadishu, Somalia</small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: borderRadius.md, border: '1px solid #e2e8f0' }}>
              <div><span style={{ fontSize: '11.5px', color: '#64748b' }}>Patient Name:</span><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{selectedPatient?.name}</div></div>
              <div><span style={{ fontSize: '11.5px', color: '#64748b' }}>Officer ID:</span><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{selectedPatient?.sarkaal_id}</div></div>
              <div><span style={{ fontSize: '11.5px', color: '#64748b' }}>Diagnosis:</span><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{formatDiagnosis(diagnosisValue, language)}</div></div>
              <div><span style={{ fontSize: '11.5px', color: '#64748b' }}>Date Issued:</span><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{new Date().toLocaleDateString()}</div></div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', borderBottom: '1px solid #0f172a' }} />
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Medical Officer Signature</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 18px', border: '1px dashed #cbd5e1', borderRadius: borderRadius.sm }}>
                <p style={{ fontSize: '10px', color: '#64748b', margin: 0, letterSpacing: '0.05em' }}>OFFICIAL STAMP</p>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReferralSlip(false)} style={getThemedStyles(false).buttonSecondaryStyle}>
                {t.close}
              </button>
              <button onClick={handlePrint} style={getThemedStyles(false).buttonPrimaryStyle}>
                <Printer size={15} />
                <span>{t.printSlip}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUCCESS MODAL */}
      {showSuccessModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '380px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: colors.successBg,
              color: colors.success,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: colors.text }}>
              {t.successTitle}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: colors.textMuted }}>
              {modalMessage}
            </p>
            <button onClick={() => setShowSuccessModal(false)} style={buttonPrimaryStyle}>
              {t.ok}
            </button>
          </div>
        </div>
      )}

      {/* 4. HISTORY MODAL */}
      {showHistoryModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '580px', padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>
                {t.historyTitle}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} aria-label={t.close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '16px' }}>
              {patientHistory.length > 0 ? (
                patientHistory.map((h, i) => (
                  <div key={i} style={{ padding: '12px', borderBottom: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: colors.text }}>
                        📅 {new Date(h.created_at).toLocaleDateString(t.locale)}
                      </span>
                      <span style={{ ...badgeStyle, backgroundColor: colors.primaryLight, color: colors.primary }}>
                        {h.limitation || h.limitations ? formatLimitation(h.limitation || h.limitations, language) : t.noRestriction}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      {t.diagnosisPrefix} <strong>{formatDiagnosis(h.diagnosis, language)}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                  {t.noHistory}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowHistoryModal(false)} style={buttonSecondaryStyle}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImagePreview src={imagePreviewSrc} onClose={() => setImagePreviewSrc(null)} language={language} />

      {/* 5. MESSENGER MODAL */}
      <FariimahaModal isOpen={showMsgModal} onClose={() => setShowMsgModal(false)} currentUser={currentUser} darkMode={darkMode} language={language} />
    </div>
  );
}

export default MedicalDashboard;
