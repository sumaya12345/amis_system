import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getThemedStyles, borderRadius } from './designSystem';
import {
  AlertCircle,
  Clock,
  ArrowLeft,
  Printer,
  Search,
  X,
  CalendarDays,
  Eye,
  Inbox,
} from 'lucide-react';

const API = 'http://localhost:5000';
const DEFAULT_PROFILE = '/assets/profiles/default.svg';
const photoUrl = (pic) => `${API}/${pic}`;
const onPhotoError = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PROFILE; };

// ─── H-ROLE TRANSLATIONS ─────────────────────────────────────────────────────
// Shared by H1–H4. The language is the one chosen in Settings → Appearance
// (stored under `amis_language`, the same key SettingsPage already uses).
export const hText = {
  so: {
    locale: 'so-SO',
    divisionName: (n) => `Horinta ${n}aad`,
    refresh: 'Refresh Xogta',
    restNotifications: 'Ogeysiisyada Istiraxada',
    people: (n) => `${n} Qof`,
    rest45: '⚠️ 45+ Maalmood Istiraxo',
    noNotifications: 'Ma jiraan ogeysiisyo cusub.',
    pendingQueueTitle: 'Safka Sugitaanka MO (Pending)',
    activeRecordsTitle: 'Diiwaanka Baaritaanka ee Firfircoon',
    total: 'Wadarta',
    colPhoto: 'Sawir', colName: 'Magaca', colSarkaalId: 'Sarkaal ID', colId: 'ID', colNo: 'No.',
    colWeight: 'Culays', colBlood: 'Dhiig', colHeight: 'Dhirir', colStatus: 'Xaaladda',
    colLimitation: 'Xaddidaadda', colDaysLeft: 'Maalmaha Hadhay',
    pendingMo: 'Pending MO', active: 'Active', completed: 'Completed',
    daysRemaining: (n) => `${n} maalmood ayaa hadhay`,
    queueEmpty: 'Safka MO waa maran yahay.',
    noActiveRecords: 'Ma jiraan diiwaanno baaritaan oo firfircoon.',
    personalRecords: 'Personal Records',
    totalPersonnel: (n) => `Wadarta: ${n} askari`,
    searchPlaceholder: 'Ku raadi Magaca ama ID-ga...',
    clear: 'Nadiifi',
    colSoldier: 'Sarkaal', colPhysical: 'Xogta Jirka', colBirth: 'Dhalashada', colActions: 'Maareynta',
    view: 'Eeg',
    noSoldiers: 'Lama helin askar',
    noSoldiersDesc: 'Fadlan beddel ereyga raadinta.',
    back: 'Ku noqo Liiska',
    print: 'Daabac Xogta Askariga',
    reportTitle: 'Warbixinta Xogta Askariga',
    printedOn: 'La daabacay',
    visits: (n) => `Booqashooyinka: ${n} jeer`,
    totalRest: (n) => `Wadarta Istiraxada: ${n} Maalmood`,
    restAlert: 'Ogeysiis: Sarkaalkan wuxuu gaaray ama dhaafay 45 maalmood oo istiraxo ah.',
    personalDetails: 'Xogta Shakhsiga',
    fullName: 'Magaca Dhammaystiran', weight: 'Culayska', height: 'Dhirirka', bloodType: 'Nooca Dhiigga',
    birthPlace: 'Goobta Dhalashada', birthDate: 'Taariikhda Dhalashada', recordStatus: 'Xaaladda Diiwaanka',
    medicalHistory: 'Taariikhda Baaritaannada Caafimaad',
    colDate: 'Taariikh', colDiagnosis: 'Baaritaanka (Diagnosis)', colDays: 'Maalmood', colReferral: 'Referral',
    daysUnit: (n) => `${n} Maalmood`,
    yes: 'Haa', no: 'Maya',
    noHistory: 'Wali baaritaan caafimaad looma diiwaangelin askarigan.',
    statsTitle: 'Tirakoobka Gudbinta Caafimaadka',
    statsDesc: 'Tirada askarta loo gudbiyay qaybta caafimaadka bil kasta, sida ku diiwaangashan nidaamka.',
    year: 'Sanadka',
    yearTotal: (n) => `Wadarta gudbinta sanadka: ${n}`,
    soldiersUnit: (n) => (n === 1 ? 'askari' : 'askari'),
    clickHint: 'Guji bil si aad u aragto askarta loo gudbiyay.',
    monthDetailTitle: (m, y) => `Askarta loo gudbiyay Caafimaadka — ${m} ${y}`,
    emptyMonth: 'Bishan wax askari ah looma gudbin qaybta caafimaadka.',
    referredAt: 'Taariikhda Gudbinta',
    loading: 'Xogta waa la soo raraya...',
    loadError: 'Xogta tirakoobka lama soo heli karin. Fadlan hubi xiriirka server-ka.',
    close: 'Xir',
    statusPending: 'Sugaya', statusCompleted: 'La dhammaystiray', statusCancelled: 'La joojiyay',
    months: ['Janaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun', 'Luulyo', 'Agoosto', 'Sebtembar', 'Oktoobar', 'Nofembar', 'Desembar'],
    summaryPersonnel: 'Wadarta Askarta', summaryQueue: 'Safka Sugitaanka', summaryReports: 'Warbixinno Caafimaad',
    summaryReferred: 'La Gudbiyey (Referred)', summaryRestDays: 'Isku-darka Maalmaha',
    h1AnalyticsTitle: 'Analytics Horinta 1aad',
    h1AnalyticsDesc: 'Muuqaal guud oo ku saabsan culeyska shaqo iyo dhaqdhaqaaqa caafimaadka.',
    h1Pending: 'Pending', h1Processed: 'Processed', h1Personnel: 'Personnel', h1Referred: 'Referred',
    h1Monthly: 'Dhaqdhaqaaqa Billeed', h1QueueStatus: 'Xaaladda Safka', h1ReportsSeries: 'Warbixinno',
    imagePreview: 'Sawirka Askariga',
    visitStatsTitle: 'Tirakoobka Booqashooyinka Caafimaadka',
    visitStatsDesc: 'Tirada bukaannada (askarta) ee booqday xarunta caafimaadka bil kasta, iyadoo lagu salaynayo baaritaannada la dhammaystiray.',
    visitYearTotal: (n) => `Wadarta booqashooyinka sanadka: ${n}`,
    patientsUnit: () => 'bukaan',
    visitsCount: (n) => `${n} booqasho`,
    visitClickHint: 'Guji bil si aad u aragto booqashooyinka caafimaadka ee bishaas.',
    visitMonthDetailTitle: (m, y) => `Booqashooyinka Xarunta Caafimaadka — ${m} ${y}`,
    visitEmptyMonth: 'Bishan cidna ma booqan xarunta caafimaadka.',
    visitDate: 'Taariikhda Booqashada',
    colDivision: 'Horinta',
  },
  en: {
    locale: 'en-GB',
    divisionName: (n) => `${n}${['st', 'nd', 'rd', 'th'][Math.min(n, 4) - 1]} Division`,
    refresh: 'Refresh Data',
    restNotifications: 'Rest Notifications',
    people: (n) => `${n} ${n === 1 ? 'Person' : 'People'}`,
    rest45: '⚠️ 45+ Days of Rest',
    noNotifications: 'There are no new notifications.',
    pendingQueueTitle: 'MO Waiting Queue (Pending)',
    activeRecordsTitle: 'Active Examination Records',
    total: 'Total',
    colPhoto: 'Photo', colName: 'Name', colSarkaalId: 'Soldier ID', colId: 'ID', colNo: 'No.',
    colWeight: 'Weight', colBlood: 'Blood', colHeight: 'Height', colStatus: 'Status',
    colLimitation: 'Limitation', colDaysLeft: 'Days Remaining',
    pendingMo: 'Pending MO', active: 'Active', completed: 'Completed',
    daysRemaining: (n) => `${n} days remaining`,
    queueEmpty: 'The MO queue is empty.',
    noActiveRecords: 'There are no active examination records.',
    personalRecords: 'Personal Records',
    totalPersonnel: (n) => `Total: ${n} personnel`,
    searchPlaceholder: 'Search by name or ID...',
    clear: 'Clear',
    colSoldier: 'Soldier', colPhysical: 'Physical Data', colBirth: 'Birth', colActions: 'Actions',
    view: 'View',
    noSoldiers: 'No soldiers found',
    noSoldiersDesc: 'Please change the search term.',
    back: 'Back to List',
    print: 'Print Soldier Details',
    reportTitle: 'Soldier Information Report',
    printedOn: 'Printed on',
    visits: (n) => `Visits: ${n}`,
    totalRest: (n) => `Total Rest: ${n} Days`,
    restAlert: 'Notice: This soldier has reached or exceeded 45 days of rest.',
    personalDetails: 'Personal Information',
    fullName: 'Full Name', weight: 'Weight', height: 'Height', bloodType: 'Blood Type',
    birthPlace: 'Birth Place', birthDate: 'Birth Date', recordStatus: 'Record Status',
    medicalHistory: 'Medical Examination History',
    colDate: 'Date', colDiagnosis: 'Diagnosis', colDays: 'Days', colReferral: 'Referral',
    daysUnit: (n) => `${n} Days`,
    yes: 'Yes', no: 'No',
    noHistory: 'No medical examinations have been recorded for this soldier yet.',
    statsTitle: 'Medical Referral Statistics',
    statsDesc: 'Number of soldiers referred to the medical section each month, as recorded in the system.',
    year: 'Year',
    yearTotal: (n) => `Total referrals this year: ${n}`,
    soldiersUnit: (n) => (n === 1 ? 'soldier' : 'soldiers'),
    clickHint: 'Click a month to see the soldiers referred.',
    monthDetailTitle: (m, y) => `Soldiers referred to Medical — ${m} ${y}`,
    emptyMonth: 'No soldiers were referred to the medical section this month.',
    referredAt: 'Referral Date',
    loading: 'Loading data...',
    loadError: 'Statistics could not be loaded. Please check the server connection.',
    close: 'Close',
    statusPending: 'Pending', statusCompleted: 'Completed', statusCancelled: 'Cancelled',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    summaryPersonnel: 'Total Personnel', summaryQueue: 'Waiting Queue', summaryReports: 'Medical Reports',
    summaryReferred: 'Referred', summaryRestDays: 'Total Days',
    h1AnalyticsTitle: '1st Division Analytics',
    h1AnalyticsDesc: 'An overview of workload and medical activity.',
    h1Pending: 'Pending', h1Processed: 'Processed', h1Personnel: 'Personnel', h1Referred: 'Referred',
    h1Monthly: 'Monthly Activity', h1QueueStatus: 'Queue Status', h1ReportsSeries: 'Reports',
    imagePreview: 'Soldier profile preview',
    visitStatsTitle: 'Medical Attendance Statistics',
    visitStatsDesc: 'Number of patients (soldiers) who visited the medical center each month, based on completed examinations.',
    visitYearTotal: (n) => `Total visits this year: ${n}`,
    patientsUnit: (n) => (n === 1 ? 'patient' : 'patients'),
    visitsCount: (n) => `${n} ${n === 1 ? 'visit' : 'visits'}`,
    visitClickHint: 'Click a month to see the medical visits in that month.',
    visitMonthDetailTitle: (m, y) => `Medical Center Visits — ${m} ${y}`,
    visitEmptyMonth: 'Nobody visited the medical center this month.',
    visitDate: 'Visit Date',
    colDivision: 'Division',
  },
  tr: {
    locale: 'tr-TR',
    divisionName: (n) => `${n}. Tümen`,
    refresh: 'Verileri Yenile',
    restNotifications: 'İstirahat Bildirimleri',
    people: (n) => `${n} Kişi`,
    rest45: '⚠️ 45+ Gün İstirahat',
    noNotifications: 'Yeni bildirim yok.',
    pendingQueueTitle: 'MO Bekleme Sırası (Bekleyen)',
    activeRecordsTitle: 'Aktif Muayene Kayıtları',
    total: 'Toplam',
    colPhoto: 'Fotoğraf', colName: 'Ad', colSarkaalId: 'Asker ID', colId: 'ID', colNo: 'No.',
    colWeight: 'Kilo', colBlood: 'Kan', colHeight: 'Boy', colStatus: 'Durum',
    colLimitation: 'Kısıtlama', colDaysLeft: 'Kalan Gün',
    pendingMo: 'MO Bekliyor', active: 'Aktif', completed: 'Tamamlandı',
    daysRemaining: (n) => `${n} gün kaldı`,
    queueEmpty: 'MO sırası boş.',
    noActiveRecords: 'Aktif muayene kaydı yok.',
    personalRecords: 'Kişisel Kayıtlar',
    totalPersonnel: (n) => `Toplam: ${n} personel`,
    searchPlaceholder: 'İsim veya ID ile ara...',
    clear: 'Temizle',
    colSoldier: 'Asker', colPhysical: 'Fiziksel Veriler', colBirth: 'Doğum', colActions: 'İşlemler',
    view: 'Görüntüle',
    noSoldiers: 'Asker bulunamadı',
    noSoldiersDesc: 'Lütfen arama terimini değiştirin.',
    back: 'Listeye Dön',
    print: 'Asker Bilgilerini Yazdır',
    reportTitle: 'Asker Bilgi Raporu',
    printedOn: 'Yazdırma tarihi',
    visits: (n) => `Ziyaret: ${n}`,
    totalRest: (n) => `Toplam İstirahat: ${n} Gün`,
    restAlert: 'Uyarı: Bu asker 45 günlük istirahat sınırına ulaştı veya aştı.',
    personalDetails: 'Kişisel Bilgiler',
    fullName: 'Tam Ad', weight: 'Kilo', height: 'Boy', bloodType: 'Kan Grubu',
    birthPlace: 'Doğum Yeri', birthDate: 'Doğum Tarihi', recordStatus: 'Kayıt Durumu',
    medicalHistory: 'Tıbbi Muayene Geçmişi',
    colDate: 'Tarih', colDiagnosis: 'Teşhis', colDays: 'Gün', colReferral: 'Sevk',
    daysUnit: (n) => `${n} Gün`,
    yes: 'Evet', no: 'Hayır',
    noHistory: 'Bu asker için henüz tıbbi muayene kaydedilmedi.',
    statsTitle: 'Sağlık Sevk İstatistikleri',
    statsDesc: 'Sistemde kayıtlı olduğu şekliyle her ay sağlık birimine sevk edilen asker sayısı.',
    year: 'Yıl',
    yearTotal: (n) => `Bu yılki toplam sevk: ${n}`,
    soldiersUnit: () => 'asker',
    clickHint: 'Sevk edilen askerleri görmek için bir aya tıklayın.',
    monthDetailTitle: (m, y) => `Sağlığa sevk edilen askerler — ${m} ${y}`,
    emptyMonth: 'Bu ay sağlık birimine sevk edilen asker yok.',
    referredAt: 'Sevk Tarihi',
    loading: 'Veriler yükleniyor...',
    loadError: 'İstatistikler yüklenemedi. Lütfen sunucu bağlantısını kontrol edin.',
    close: 'Kapat',
    statusPending: 'Bekliyor', statusCompleted: 'Tamamlandı', statusCancelled: 'İptal Edildi',
    months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    summaryPersonnel: 'Toplam Personel', summaryQueue: 'Bekleme Sırası', summaryReports: 'Sağlık Raporları',
    summaryReferred: 'Sevk Edilen', summaryRestDays: 'Toplam Gün',
    h1AnalyticsTitle: '1. Tümen Analizi',
    h1AnalyticsDesc: 'İş yükü ve sağlık faaliyetlerine genel bakış.',
    h1Pending: 'Bekleyen', h1Processed: 'İşlenen', h1Personnel: 'Personel', h1Referred: 'Sevk Edilen',
    h1Monthly: 'Aylık Faaliyet', h1QueueStatus: 'Sıra Durumu', h1ReportsSeries: 'Raporlar',
    imagePreview: 'Asker profil önizlemesi',
    visitStatsTitle: 'Sağlık Merkezi Ziyaret İstatistikleri',
    visitStatsDesc: 'Tamamlanan muayenelere göre her ay sağlık merkezini ziyaret eden hasta (asker) sayısı.',
    visitYearTotal: (n) => `Bu yılki toplam ziyaret: ${n}`,
    patientsUnit: () => 'hasta',
    visitsCount: (n) => `${n} ziyaret`,
    visitClickHint: 'O aydaki sağlık ziyaretlerini görmek için bir aya tıklayın.',
    visitMonthDetailTitle: (m, y) => `Sağlık Merkezi Ziyaretleri — ${m} ${y}`,
    visitEmptyMonth: 'Bu ay sağlık merkezini ziyaret eden olmadı.',
    visitDate: 'Ziyaret Tarihi',
    colDivision: 'Tümen',
  },
};

export const getHText = (language) => hText[language] || hText.so;

// ─── MEDICAL EXAMINATION OPTIONS ─────────────────────────────────────────────
// Stored values never change with the display language; only their labels do.
// Somali labels are the wording used by the medical staff.
export const DIAGNOSIS_OTHER = 'Other';
export const DIAGNOSIS_OTHER_PREFIX = 'Other: '; // custom results are stored as "Other: <text>"
export const DIAGNOSIS_OPTIONS = ['None istirahat', 'Yattak istirahat', 'Terlik istirahat', 'Sakal istirahat', DIAGNOSIS_OTHER];
export const LIMITATION_OPTIONS = ['Terlik Istirihat', 'Yattak Istirihat', 'Ayahta Istirihat', 'Adeeg Fudud', 'Shaqo Caadi'];

const medicalOptionLabels = {
  diagnosis: {
    'None istirahat': { so: 'None istirahat', en: 'No rest', tr: 'İstirahat yok' },
    'Yattak istirahat': { so: 'Yattak istirahat', en: 'Bed rest', tr: 'Yatak istirahati' },
    'Terlik istirahat': { so: 'Terlik istirahat', en: 'Indoor (slipper) rest', tr: 'Terlik istirahati' },
    'Sakal istirahat': { so: 'Sakal istirahat', en: 'Beard rest (shaving exemption)', tr: 'Sakal istirahati' },
    Other: { so: 'Other', en: 'Other', tr: 'Diğer' },
  },
  limitation: {
    'Terlik Istirihat': { so: 'Terlik İstirahat', en: 'Indoor (slipper) rest', tr: 'Terlik istirahati' },
    'Yattak Istirihat': { so: 'Yattak İstirahat', en: 'Bed rest', tr: 'Yatak istirahati' },
    'Ayahta Istirihat': { so: 'Ayakta İstirahat', en: 'Ambulatory rest', tr: 'Ayakta istirahat' },
    'Adeeg Fudud': { so: 'Adeeg Fudud', en: 'Light duty', tr: 'Hafif görev' },
    'Shaqo Caadi': { so: 'Shaqo Caadi', en: 'Normal duty', tr: 'Normal görev' },
    // Historical value present in existing records
    'Egtim ve Spor Istirihat': { so: 'Egtim ve Spor Istirihat', en: 'Training and sports rest', tr: 'Eğitim ve spor istirahati' },
  },
};

// Label for a stored option value; unknown values (e.g. older free-text entries) are shown unchanged.
export const getMedicalOptionLabel = (kind, value, language) => {
  const entry = medicalOptionLabels[kind] && medicalOptionLabels[kind][value];
  return entry ? (entry[language] || entry.so) : value;
};

// Diagnosis for display: translates known options and the "Other" prefix; custom text is never translated.
export const formatDiagnosis = (value, language) => {
  if (value === null || value === undefined || value === '') return '-';
  const text = String(value);
  if (text.startsWith(DIAGNOSIS_OTHER_PREFIX)) {
    return `${getMedicalOptionLabel('diagnosis', DIAGNOSIS_OTHER, language)}: ${text.slice(DIAGNOSIS_OTHER_PREFIX.length)}`;
  }
  return getMedicalOptionLabel('diagnosis', text, language);
};

export const formatLimitation = (value, language) => (
  value === null || value === undefined || value === '' ? '-' : getMedicalOptionLabel('limitation', value, language)
);

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem('amis_language');
    return hText[stored] ? stored : 'so';
  } catch (e) {
    return 'so';
  }
};

// Language state for an H-role page; persisted the same way SettingsPage persists it.
export function useHRoleLanguage() {
  const [language, setLanguageState] = useState(readStoredLanguage);
  const setLanguage = (next) => {
    setLanguageState(next);
    try { localStorage.setItem('amis_language', next); } catch (e) { /* storage unavailable */ }
  };
  return [language, setLanguage];
}

const formatDate = (value, locale) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString(locale);
};

const formatDateTime = (value, locale) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
};

const display = (value, suffix = '') => (value === null || value === undefined || value === '' ? '-' : `${value}${suffix}`);

const sumRestDays = (records) => records
  .filter((record) => record.limitation === 'Yattak Istirihat')
  .reduce((sum, record) => sum + Number(record.days || 0), 0);

// ─── IMAGE PREVIEW ───────────────────────────────────────────────────────────
export function ImagePreview({ src, onClose, language }) {
  if (!src) return null;
  const t = getHText(language);
  return (
    <div
      className="no-print"
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center',
        alignItems: 'center', zIndex: 10000, cursor: 'zoom-out'
      }}
      onClick={onClose}
    >
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={t.imagePreview}
          style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
          onError={onPhotoError}
        />
        <button
          onClick={onClose}
          aria-label={t.close}
          style={{
            position: 'absolute', top: '-40px', right: 0, background: 'white', color: '#333',
            border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD TABLES (Pending MO queue + active examination records) ────────
export function HDashboardTables({
  pendingQueue,
  activeRecords,
  darkMode,
  language,
  onImageClick,
  showVitals = false,
  activeStatusKey = 'completed',
}) {
  const { colors, cardStyle, tableStyle, tableHeaderStyle, tableCellStyle, badgeStyle } = getThemedStyles(darkMode);
  const t = getHText(language);

  // Same rule as the S1 "Active Records" table: only each soldier's newest examination
  // counts (older records never extend it), and the issue date is Day 1 of the countdown.
  const latestRecords = activeRecords.reduce((records, current) => {
    const previous = records[current.sarkaal_id];
    if (!previous || new Date(current.created_at) > new Date(previous.created_at)) {
      records[current.sarkaal_id] = current;
    }
    return records;
  }, {});
  const now = new Date();
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const activeRows = Object.values(latestRecords).map((report) => {
    const examinationDate = new Date(report.created_at);
    const examinationDays = Math.max(0, Number(report.days) || 0);
    const issueDay = Date.UTC(examinationDate.getFullYear(), examinationDate.getMonth(), examinationDate.getDate());
    const elapsedDays = Math.max(0, Math.floor((todayDay - issueDay) / (1000 * 60 * 60 * 24)));
    return { ...report, remaining: Math.max(0, examinationDays - elapsedDays) };
  }).filter((report) => report.remaining > 0);

  const sectionHeader = (title, count) => (
    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>{title}</h3>
      <span style={{ fontSize: '12px', color: colors.textMuted }}>{t.total}: <strong>{count}</strong></span>
    </div>
  );

  const emptyRow = (text) => (
    <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>{text}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {sectionHeader(t.pendingQueueTitle, pendingQueue.length)}
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>{t.colPhoto}</th>
                <th style={tableHeaderStyle}>{t.colSarkaalId}</th>
                <th style={tableHeaderStyle}>{t.colName}</th>
                {showVitals && <th style={tableHeaderStyle}>{t.colWeight}</th>}
                {showVitals && <th style={tableHeaderStyle}>{t.colBlood}</th>}
                {showVitals && <th style={tableHeaderStyle}>{t.colHeight}</th>}
                <th style={tableHeaderStyle}>{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {pendingQueue.map((item) => (
                <tr key={item.queue_id || item.sarkaal_data_id || item.id}>
                  <td style={tableCellStyle}>
                    <img
                      src={photoUrl(item.profile_pic)}
                      width="34"
                      height="34"
                      style={{ borderRadius: '50%', objectFit: 'cover', border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                      alt=""
                      onClick={() => onImageClick && onImageClick(photoUrl(item.profile_pic))}
                      onError={onPhotoError}
                    />
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: '600' }}>{item.sarkaal_id}</td>
                  <td style={tableCellStyle}>{item.name}</td>
                  {showVitals && <td style={tableCellStyle}>{display(item.culays, ' kg')}</td>}
                  {showVitals && <td style={tableCellStyle}>{display(item.dhiiga)}</td>}
                  {showVitals && <td style={tableCellStyle}>{display(item.dhirirka, ' cm')}</td>}
                  <td style={tableCellStyle}>
                    <span style={{ ...badgeStyle, backgroundColor: colors.warningBg, color: colors.warning, border: `1px solid ${colors.warningBorder}` }}>
                      {t.pendingMo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingQueue.length === 0 && emptyRow(t.queueEmpty)}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {sectionHeader(t.activeRecordsTitle, activeRows.length)}
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>{t.colNo}</th>
                <th style={tableHeaderStyle}>{t.colPhoto}</th>
                <th style={tableHeaderStyle}>{t.colId}</th>
                <th style={tableHeaderStyle}>{t.colName}</th>
                <th style={tableHeaderStyle}>{t.colLimitation}</th>
                <th style={tableHeaderStyle}>{t.colDaysLeft}</th>
                <th style={tableHeaderStyle}>{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((report, index) => {
                const urgent = report.remaining <= 1;
                return (
                  <tr key={report.id}>
                    <td style={tableCellStyle}>{index + 1}</td>
                    <td style={tableCellStyle}>
                      <img
                        src={photoUrl(report.profile_pic)}
                        width="36"
                        height="36"
                        style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.primaryLight}`, cursor: 'pointer' }}
                        alt=""
                        onClick={() => onImageClick && onImageClick(photoUrl(report.profile_pic))}
                        onError={onPhotoError}
                      />
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: '600' }}>{report.sarkaal_id}</td>
                    <td style={tableCellStyle}>{report.name}</td>
                    <td style={tableCellStyle}><strong>{report.limitation}</strong></td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          ...badgeStyle,
                          gap: '7px',
                          minWidth: '92px',
                          justifyContent: 'center',
                          padding: '7px 11px',
                          borderRadius: '999px',
                          backgroundColor: urgent ? colors.errorBg : colors.successBg,
                          color: urgent ? colors.error : colors.success,
                          border: `1px solid ${urgent ? colors.errorBorder : colors.successBorder}`,
                        }}
                        title={t.daysRemaining(report.remaining)}
                      >
                        <Clock size={15} aria-hidden="true" />
                        <strong style={{ fontSize: '15px', lineHeight: 1 }}>{report.remaining}d</strong>
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ ...badgeStyle, backgroundColor: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}>
                        {t[activeStatusKey]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {activeRows.length === 0 && emptyRow(t.noActiveRecords)}
        </div>
      </div>
    </div>
  );
}

// ─── PERSONAL RECORDS LIST (S1 "Personnel Records" design, View only) ───────
export function PersonalRecordsList({ personnel, darkMode, language, onView, onImageClick }) {
  const { colors, subtleBg } = getThemedStyles(darkMode);
  const t = getHText(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const query = searchTerm.trim().toLowerCase();
  const rows = personnel.filter((item) => !query
    || String(item.name || '').toLowerCase().includes(query)
    || String(item.sarkaal_id || '').toLowerCase().includes(query));

  const headCell = (label, align = 'left') => (
    <th style={{
      padding: '20px 24px',
      color: colors.text,
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      textAlign: align,
    }}>{label}</th>
  );

  return (
    <div style={{ background: darkMode ? colors.background : '#fcfdfd', padding: '32px', borderRadius: '24px', minHeight: '70vh' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: darkMode ? colors.text : '#1a2e26', margin: 0, fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {t.personalRecords}
          </h2>
          <p style={{ color: colors.textMuted, margin: '4px 0 0', fontSize: '14px' }}>
            {t.totalPersonnel(rows.length)}
          </p>
        </div>
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 32px 10px 40px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: darkMode ? colors.backgroundAlt : '#ffffff',
              fontSize: '14px',
              outline: 'none',
              color: colors.text,
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              title={t.clear}
              aria-label={t.clear}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: colors.white,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        boxShadow: darkMode ? colors.shadow : '0 4px 20px rgba(0,0,0,0.04)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: darkMode ? colors.backgroundAlt : '#f9fafb' }}>
                {headCell(t.colNo)}
                {headCell(t.colSoldier)}
                {headCell(t.colPhysical)}
                {headCell(t.colBirth)}
                {headCell(t.colActions, 'center')}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const isHovered = hoveredRowId === item.id;
                return (
                  <tr
                    key={item.id}
                    onMouseEnter={() => setHoveredRowId(item.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    style={{
                      backgroundColor: isHovered ? subtleBg : colors.white,
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: '700', color: colors.textMuted, fontSize: '13px', borderTop: `1px solid ${colors.border}` }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={photoUrl(item.profile_pic)}
                          width="48"
                          height="48"
                          style={{ borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', border: `2px solid ${colors.border}` }}
                          alt=""
                          onClick={() => onImageClick && onImageClick(photoUrl(item.profile_pic))}
                          onError={onPhotoError}
                        />
                        <div>
                          <div style={{ fontWeight: '700', color: darkMode ? colors.text : '#1a2e26', fontSize: '14px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: darkMode ? colors.success : '#10b981', fontWeight: '500' }}>ID: {item.sarkaal_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: darkMode ? colors.primaryLight : '#eff6ff', color: darkMode ? colors.primary : '#1e40af', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {display(item.culays, 'kg')}
                        </span>
                        <span style={{ background: darkMode ? colors.errorBg : '#fef2f2', color: darkMode ? colors.error : '#dc2626', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {display(item.dhiiga)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ fontSize: '13px', color: colors.textMuted }}>
                        <div style={{ fontWeight: '500' }}>{display(item.goobta_dhalashada)}</div>
                        <div style={{ fontSize: '11px' }}>{formatDate(item.tariikhda_dhalashada, t.locale)}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
                      <button
                        onClick={() => onView(item)}
                        style={{
                          padding: '10px 20px',
                          background: darkMode ? '#2563eb' : '#0f1f38',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(15, 31, 56, 0.25)',
                        }}
                      >
                        <Eye size={14} />
                        {t.view}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: '72px 40px', textAlign: 'center', background: darkMode ? colors.backgroundAlt : '#f9fafb' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>👤</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: colors.text }}>{t.noSoldiers}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: colors.textMuted }}>{t.noSoldiersDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PERSONAL RECORD VIEW (with browser print / save as PDF) ────────────────
export function PersonalRecordView({ soldier, history = [], divisionName, darkMode, language, onBack, onImageClick }) {
  const { colors, cardStyle, tableStyle, tableHeaderStyle, tableCellStyle, buttonPrimaryStyle, buttonSecondaryStyle, badgeStyle, neutralBg } = getThemedStyles(darkMode);
  const t = getHText(language);
  if (!soldier) return null;

  const totalRestDays = sumRestDays(history);
  const restWarning = totalRestDays >= 40;
  const details = [
    [t.fullName, display(soldier.name)],
    [t.colSarkaalId, display(soldier.sarkaal_id)],
    [t.weight, display(soldier.culays, ' kg')],
    [t.height, display(soldier.dhirirka, ' cm')],
    [t.bloodType, display(soldier.dhiiga)],
    [t.birthPlace, display(soldier.goobta_dhalashada)],
    [t.birthDate, formatDate(soldier.tariikhda_dhalashada, t.locale)],
    [t.recordStatus, display(soldier.status || soldier.personnel_status)],
  ];

  return (
    <div className="h-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={buttonSecondaryStyle}>
          <ArrowLeft size={16} />
          <span>{t.back}</span>
        </button>
        <button onClick={() => window.print()} style={buttonPrimaryStyle}>
          <Printer size={16} />
          <span>{t.print}</span>
        </button>
      </div>

      <div className="h-print-only" style={{ borderBottom: '2px solid #0f2744', paddingBottom: '10px', marginBottom: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em' }}>AMIS SYSTEM — {divisionName}</div>
        <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>{t.reportTitle}</div>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>{t.printedOn}: {formatDateTime(new Date(), t.locale)}</div>
      </div>

      <div className="h-print-block" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '32px', padding: '28px', flexWrap: 'wrap' }}>
        <img
          src={photoUrl(soldier.profile_pic)}
          style={{ width: '150px', height: '150px', borderRadius: '15px', objectFit: 'cover', border: `4px solid ${darkMode ? colors.primaryBorder : '#1a2a6c'}`, cursor: 'pointer' }}
          alt={soldier.name || ''}
          onClick={() => onImageClick && onImageClick(photoUrl(soldier.profile_pic))}
          onError={onPhotoError}
        />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: '0 0 8px 0', color: darkMode ? colors.text : '#1a2a6c', fontSize: '30px', fontWeight: '800' }}>{soldier.name}</h1>
          <p style={{ margin: '4px 0', fontSize: '16px', color: colors.textMuted }}>
            {t.colSarkaalId}: <b style={{ color: darkMode ? colors.text : '#1a2a6c' }}>{soldier.sarkaal_id}</b>
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span style={{ ...badgeStyle, padding: '8px 16px', fontSize: '14px', borderRadius: '10px', backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primaryBorder}` }}>
              {t.visits(history.length)}
            </span>
            <span style={{
              ...badgeStyle,
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '10px',
              backgroundColor: restWarning ? colors.errorBg : colors.warningBg,
              color: restWarning ? colors.error : colors.warning,
              border: `1px solid ${restWarning ? colors.errorBorder : colors.warningBorder}`,
            }}>
              {t.totalRest(totalRestDays)} {restWarning && '⚠️'}
            </span>
          </div>
          {totalRestDays >= 45 && (
            <div style={{ marginTop: '14px', padding: '12px 14px', background: colors.errorBg, color: colors.error, border: `1px solid ${colors.errorBorder}`, borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {t.restAlert}
            </div>
          )}
        </div>
      </div>

      <div className="h-print-block" style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>{t.personalDetails}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: colors.border }}>
          {details.map(([label, value]) => (
            <div key={label} style={{ background: colors.white, padding: '14px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.textMuted }}>{label}</div>
              <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '600', color: colors.text }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>{t.medicalHistory}</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>{t.colDate}</th>
                <th style={tableHeaderStyle}>{t.colDiagnosis}</th>
                <th style={tableHeaderStyle}>{t.colLimitation}</th>
                <th style={tableHeaderStyle}>{t.colDays}</th>
                <th style={tableHeaderStyle}>{t.colReferral}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => (
                <tr key={record.id || index}>
                  <td style={tableCellStyle}>{formatDate(record.created_at, t.locale)}</td>
                  <td style={{ ...tableCellStyle, fontWeight: '600', color: colors.error }}>{formatDiagnosis(record.diagnosis, language)}</td>
                  <td style={tableCellStyle}>{formatLimitation(record.limitation, language)}</td>
                  <td style={tableCellStyle}>
                    <span style={{ ...badgeStyle, backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primaryBorder}` }}>
                      {t.daysUnit(Number(record.days || 0))}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: record.referrals === 'Yes' ? colors.primaryLight : neutralBg,
                      color: record.referrals === 'Yes' ? colors.primary : colors.textMuted,
                      border: `1px solid ${record.referrals === 'Yes' ? colors.primaryBorder : colors.border}`,
                    }}>
                      {record.referrals === 'Yes' ? t.yes : t.no}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div style={{ padding: '28px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>{t.noHistory}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MONTHLY MEDICAL STATISTICS (12 month cards) ────────────────────────────
// mode="referrals" (H1–H4): a referral is a queue_list entry — the date S1–S4 sent the
//   soldier to the medical section.
// mode="visits" (Mo): a visit is a medical_records row — an examination the medical
//   officer actually completed (created_at is the examination date). Referrals that
//   were never examined are not counted.
export function MonthlyReferralStats({ darkMode, language, personnel = [], onViewDetails, onImageClick, mode = 'referrals', resolveDivision }) {
  const isVisits = mode === 'visits';
  const dateOf = (row) => (isVisits ? row.created_at : row.referred_at);
  const { colors, cardStyle, tableStyle, tableHeaderStyle, tableCellStyle, buttonSecondaryStyle, badgeStyle, neutralBg } = getThemedStyles(darkMode);
  const t = getHText(language);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await axios.get(`${API}${isVisits ? '/api/medical-records' : '/api/ballan/referrals'}`);
        if (isMounted) {
          setReferrals(Array.isArray(res.data) ? res.data : []);
          setLoadError(false);
        }
      } catch (err) {
        console.error('Referral statistics could not be loaded:', err);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [isVisits]);

  const years = useMemo(() => {
    const found = new Set([currentYear]);
    referrals.forEach((r) => {
      const d = new Date(dateOf(r));
      if (!Number.isNaN(d.getTime())) found.add(d.getFullYear());
    });
    return [...found].sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrals, currentYear, isVisits]);

  // Referrals: months[i] → one entry per soldier referred that month (with every referral date).
  // Visits:    months[i] → one entry per examination record (deduplicated by record id).
  const months = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => new Map());
    referrals.forEach((r) => {
      const d = new Date(dateOf(r));
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== Number(selectedYear)) return;
      const bucket = buckets[d.getMonth()];
      if (isVisits) {
        bucket.set(String(r.id), r);
        return;
      }
      const key = String(r.sarkaal_data_id);
      if (!bucket.has(key)) bucket.set(key, { ...r, referralDates: [] }); // rows arrive newest first
      bucket.get(key).referralDates.push(r.referred_at);
    });
    return buckets.map((bucket) => [...bucket.values()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrals, selectedYear, isVisits]);

  // Card figure: soldiers referred (referrals) / distinct patients who visited (visits).
  const monthCount = (list) => (isVisits ? new Set(list.map((r) => String(r.sarkaal_data_id))).size : list.length);
  const yearTotal = months.reduce((sum, list) => sum + list.length, 0);
  const selectedList = selectedMonth === null ? [] : months[selectedMonth];
  const text = isVisits
    ? { title: t.visitStatsTitle, desc: t.visitStatsDesc, yearTotal: t.visitYearTotal, unit: t.patientsUnit, hint: t.visitClickHint, detail: t.visitMonthDetailTitle, empty: t.visitEmptyMonth }
    : { title: t.statsTitle, desc: t.statsDesc, yearTotal: t.yearTotal, unit: t.soldiersUnit, hint: t.clickHint, detail: t.monthDetailTitle, empty: t.emptyMonth };

  const statusBadge = (status) => {
    const map = {
      Pending: [t.statusPending, colors.warningBg, colors.warning, colors.warningBorder],
      Completed: [t.statusCompleted, colors.successBg, colors.success, colors.successBorder],
      Cancelled: [t.statusCancelled, colors.errorBg, colors.error, colors.errorBorder],
    };
    const [label, bg, fg, border] = map[status] || [status || '-', neutralBg, colors.textMuted, colors.border];
    return <span style={{ ...badgeStyle, backgroundColor: bg, color: fg, border: `1px solid ${border}` }}>{label}</span>;
  };

  const openProfile = (row) => {
    if (!onViewDetails) return;
    const person = personnel.find((p) => Number(p.id) === Number(row.sarkaal_data_id));
    onViewDetails(person || { ...row, id: row.sarkaal_data_id, status: row.personnel_status });
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: colors.text }}>{text.title}</h2>
          <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: '13px' }}>{text.desc}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: '600' }}>{text.yearTotal(yearTotal)}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textSecondary, fontWeight: '600' }}>
            <CalendarDays size={16} />
            {t.year}
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedMonth(null); }}
              style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.white, color: colors.text, fontSize: '13px', cursor: 'pointer' }}
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
      </div>

      {loadError && (
        <div style={{ ...cardStyle, padding: '12px 16px', backgroundColor: colors.errorBg, color: colors.error, border: `1px solid ${colors.errorBorder}`, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          {t.loadError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '14px' }}>
        {t.months.map((monthName, index) => {
          const count = monthCount(months[index]);
          const isSelected = selectedMonth === index;
          const isCurrent = Number(selectedYear) === currentYear && index === currentMonth;
          return (
            <button
              key={monthName}
              type="button"
              onClick={() => setSelectedMonth(isSelected ? null : index)}
              aria-pressed={isSelected}
              style={{
                ...cardStyle,
                padding: '16px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderTop: `3px solid ${count > 0 ? colors.primary : colors.border}`,
                outline: isSelected ? `2px solid ${colors.primary}` : 'none',
                outlineOffset: '-1px',
                backgroundColor: isSelected ? colors.primaryLight : colors.white,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.textMuted }}>
                  {monthName}
                </span>
                {isCurrent && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.success }} title={String(currentYear)} />}
              </span>
              <strong style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1.1, color: count > 0 ? colors.text : colors.textLight }}>
                {loading ? '…' : count}
              </strong>
              <span style={{ fontSize: '12px', color: colors.textMuted }}>
                {text.unit(count)}{isVisits && count > 0 ? ` · ${t.visitsCount(months[index].length)}` : ''} · {selectedYear}
              </span>
            </button>
          );
        })}
      </div>

      {selectedMonth === null ? (
        <p style={{ margin: 0, fontSize: '12.5px', color: colors.textMuted }}>{text.hint}</p>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colors.text }}>
              {text.detail(t.months[selectedMonth], selectedYear)}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: colors.textMuted }}>{t.total}: <strong>{selectedList.length}</strong></span>
              <button type="button" onClick={() => setSelectedMonth(null)} style={{ ...buttonSecondaryStyle, padding: '5px 10px', fontSize: '12px' }}>
                <X size={13} />
                {t.close}
              </button>
            </div>
          </div>
          {selectedList.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
              <Inbox size={30} style={{ opacity: 0.6, marginBottom: '8px' }} />
              <div>{text.empty}</div>
            </div>
          ) : isVisits ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {[t.colNo, t.colPhoto, t.colName, t.colSarkaalId, t.colDivision, t.visitDate, t.colDiagnosis, t.colLimitation, t.colDays, t.colReferral].map((heading) => (
                      <th key={heading} style={tableHeaderStyle}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...selectedList].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((visit, index) => (
                    <tr key={visit.id}>
                      <td style={tableCellStyle}>{index + 1}</td>
                      <td style={tableCellStyle}>
                        <img
                          src={photoUrl(visit.profile_pic)}
                          width="38"
                          height="38"
                          style={{ borderRadius: borderRadius.md, objectFit: 'cover', border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                          alt=""
                          onClick={() => onImageClick && onImageClick(photoUrl(visit.profile_pic))}
                          onError={onPhotoError}
                        />
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: '600' }}>{display(visit.name)}</td>
                      <td style={tableCellStyle}>{display(visit.sarkaal_id)}</td>
                      <td style={tableCellStyle}>{(resolveDivision && resolveDivision(visit)) || (visit.horinta && visit.horinta !== 'Unknown' ? visit.horinta : '-')}</td>
                      <td style={{ ...tableCellStyle, whiteSpace: 'nowrap' }}>{formatDateTime(visit.created_at, t.locale)}</td>
                      <td style={{ ...tableCellStyle, fontWeight: '600', color: colors.error }}>{formatDiagnosis(visit.diagnosis, language)}</td>
                      <td style={tableCellStyle}>{formatLimitation(visit.limitation, language)}</td>
                      <td style={tableCellStyle}>
                        <span style={{ ...badgeStyle, backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primaryBorder}` }}>
                          {t.daysUnit(Number(visit.days || 0))}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          ...badgeStyle,
                          backgroundColor: visit.referrals === 'Yes' ? colors.primaryLight : neutralBg,
                          color: visit.referrals === 'Yes' ? colors.primary : colors.textMuted,
                          border: `1px solid ${visit.referrals === 'Yes' ? colors.primaryBorder : colors.border}`,
                        }}>
                          {visit.referrals === 'Yes' ? t.yes : t.no}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {[t.colNo, t.colPhoto, t.colName, t.colSarkaalId, t.referredAt, t.colStatus, t.bloodType, t.weight, t.height, t.birthPlace, t.birthDate, ''].map((heading, i) => (
                      <th key={`${heading}-${i}`} style={tableHeaderStyle}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedList.map((row, index) => (
                    <tr key={row.sarkaal_data_id}>
                      <td style={tableCellStyle}>{index + 1}</td>
                      <td style={tableCellStyle}>
                        <img
                          src={photoUrl(row.profile_pic)}
                          width="38"
                          height="38"
                          style={{ borderRadius: borderRadius.md, objectFit: 'cover', border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                          alt=""
                          onClick={() => onImageClick && onImageClick(photoUrl(row.profile_pic))}
                          onError={onPhotoError}
                        />
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: '600' }}>{display(row.name)}</td>
                      <td style={tableCellStyle}>{display(row.sarkaal_id)}</td>
                      <td style={tableCellStyle}>
                        {row.referralDates.map((date) => (
                          <div key={date} style={{ whiteSpace: 'nowrap' }}>{formatDateTime(date, t.locale)}</div>
                        ))}
                      </td>
                      <td style={tableCellStyle}>{statusBadge(row.status)}</td>
                      <td style={tableCellStyle}>{display(row.dhiiga)}</td>
                      <td style={tableCellStyle}>{display(row.culays, ' kg')}</td>
                      <td style={tableCellStyle}>{display(row.dhirirka, ' cm')}</td>
                      <td style={tableCellStyle}>{display(row.goobta_dhalashada)}</td>
                      <td style={tableCellStyle}>{formatDate(row.tariikhda_dhalashada, t.locale)}</td>
                      <td style={tableCellStyle}>
                        {onViewDetails && (
                          <button type="button" onClick={() => openProfile(row)} style={{ ...buttonSecondaryStyle, padding: '5px 12px', fontSize: '12px' }}>
                            <Eye size={13} />
                            {t.view}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
