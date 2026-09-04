import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // General
    all: 'All Statuses',

    // Branding & Header
    brand_title: 'CivicFix',
    brand_subtitle: 'MUNICIPAL CORPORATION OF DELHI',
    search_placeholder: 'Search records, categories, ticket references...',
    official_operations: 'MCD Engineering Operations',
    citizen_registry: 'Citizen Municipal Registry',
    notifications: 'Notifications',
    mark_all_read: 'Mark all read',

    // Side Navigation
    overview: 'Overview',
    reports_ledger: 'Reports Ledger',
    issue_queue: 'Issue Queue',
    ward_progress: 'Ward Progress',
    zonal_metrics: 'Zonal Metrics',
    account_preferences: 'Account & Preferences',
    lodge_report: 'Lodge Report',
    lodge_subtitle: 'File civic hazard dispatch',

    // Home / Citizen Sections
    what_needs_fixing: 'What needs fixing?',
    choose_category: 'Choose a category below to send your report directly to the right municipal crew.',
    public_ledger_title: 'Public Issue Ledger',
    public_ledger_subtitle: 'Real-time status of reported civic hazards and municipal repair progress across Ward-04.',
    reports_tab_title: 'Ward-04 Reports Ledger',
    reports_tab_subtitle: 'Comprehensive public registry of all civic hazard work orders and community sign-offs.',
    metrics_tab_title: 'Ward-04 Infrastructure Metrics',
    metrics_tab_subtitle: 'Performance indicators, municipal response SLAs, and community verification statistics.',

    // Categories
    cat_roads: 'Potholes & Roads',
    cat_roads_desc: 'Damaged roads, potholes, broken pavements & dividers',
    cat_water: 'Water Supply & Drains',
    cat_water_desc: 'Burst pipes, clogged storm drains, and contaminated water',
    cat_sanitation: 'Waste & Sanitation',
    cat_sanitation_desc: 'Overflowing bins, illegal dumping, and uncollected trash',
    cat_lighting: 'Lighting & Cables',
    cat_lighting_desc: 'Broken streetlights, power outages, and exposed wires',
    cat_safety: 'Open Manholes & Hazards',
    cat_safety_desc: 'Missing sewer lids, crumbling walls, and immediate hazards',
    cat_parks: 'Parks & Trees',
    cat_parks_desc: 'Fallen branches, overgrown grass, or park maintenance',

    // Table & Card Headers
    th_photo: 'Photo',
    th_ticket_ref: 'Ticket Ref',
    th_category: 'Infrastructure Category',
    th_ward: 'Ward & Landmark',
    th_priority: 'Priority Index',
    th_status: 'Lifecycle Status',
    th_audit: 'Audit',
    inspect: 'Inspect',

    // Stepper & Statuses
    step_reported: 'Reported',
    step_assigned: 'Assigned',
    step_proof_filed: 'Proof Filed',
    step_verified: 'Verified',
    status_open: 'Open',
    status_in_progress: 'In Progress',
    status_verification_needed: 'Verification Needed',
    status_verified_fixed: 'Verified Fixed',
    status_disputed: 'Disputed',

    // Verification Box
    community_verification: 'Community Verification: Has this been restored?',
    compare_proof_desc: 'Compare the resident filing photo with MCD official evidence above. If work is done, confirm fix; otherwise dispute and escalate with photo evidence.',
    confirm_fix: 'Confirm Fix',
    reject_escalate: 'Reject & Escalate',
    sign_off_success: 'Sign-off recorded! Thank you for verifying municipal repairs.',

    // Gov Dashboard
    gov_title: 'Ward-04 Infrastructure Operations',
    gov_subtitle: 'Real-time dispatch queue: inspect citizen reports, assign work crews, and file post-repair verification evidence.',
    work_order_queue: 'Work Order Dispatch Queue',
    work_order_subtitle: 'Manage reported civic hazards and submit engineering restoration proof.',
    log_fix: 'Log Fix for Citizen Sign-Off',
    official_evidence: 'OFFICIAL RESOLUTION EVIDENCE',
  },
  hi: {
    // General
    all: 'सभी स्थितियां',

    // Branding & Header
    brand_title: 'सिविकफिक्स',
    brand_subtitle: 'दिल्ली नगर निगम (MCD)',
    search_placeholder: 'रिकॉर्ड, श्रेणी या शिकायत संदर्भ संख्या खोजें...',
    official_operations: 'MCD इंजीनियरिंग संचालन',
    citizen_registry: 'नागरिक नगरपालिका रजिस्ट्री',
    notifications: 'सूचनाएं ও अलर्ट',
    mark_all_read: 'सभी पढ़ें',

    // Side Navigation
    overview: 'मुख्य पृष्ठ (Overview)',
    reports_ledger: 'शिकायत बहीखाता',
    issue_queue: 'कार्य आदेश कतार',
    ward_progress: 'वार्ड प्रगति',
    zonal_metrics: 'जोनल मेट्रिक्स',
    account_preferences: 'खाता ও सेटिंग्स',
    lodge_report: 'समस्या दर्ज करें',
    lodge_subtitle: 'नागरिक शिकायत प्रेषित करें',

    // Home / Citizen Sections
    what_needs_fixing: 'क्या सुधार की आवश्यकता है?',
    choose_category: 'सही नगर निगम कार्यदल को रिपोर्ट भेजने के लिए नीचे दी गई श्रेणी चुनें।',
    public_ledger_title: 'सार्वजनिक समस्या रजिस्टर',
    public_ledger_subtitle: 'वार्ड-04 में दर्ज नागरिक समस्याओं और नगर निगम मरम्मत कार्य की वास्तविक स्थिति।',
    reports_tab_title: 'वार्ड-04 रिपोर्ट बहीखाता',
    reports_tab_subtitle: 'सभी नागरिक कार्य आदेशों और जन-सत्यापनों की सार्वजनिक रजिस्ट्री।',
    metrics_tab_title: 'वार्ड-04 इंफ्रास्ट्रक्चर मेट्रिक्स',
    metrics_tab_subtitle: 'प्रदर्शन संकेतक, नगर निगम प्रतिक्रिया SLA और समुदाय सत्यापन सांख्यिकी।',

    // Categories
    cat_roads: 'सड़क व गड्ढे (Potholes)',
    cat_roads_desc: 'टूटी सड़कें, गड्ढे, क्षतिग्रस्त फुटपाथ ও डिवाइडर',
    cat_water: 'जल आपूर्ति व नाले (Water & Drains)',
    cat_water_desc: 'टूटे पाइप, अवरुद्ध नाले और गंदा पानी',
    cat_sanitation: 'कचरा व स्वच्छता (Sanitation)',
    cat_sanitation_desc: 'कूड़े के ढेर, अवैध डंपिंग और अनसुलझा कचरा',
    cat_lighting: 'लाइटिंग व तार (Lighting & Cables)',
    cat_lighting_desc: 'खराब स्ट्रीटलाइट, बिजली कटौती और खुले तार',
    cat_safety: 'खुले मैनहोल व खतरे (Safety)',
    cat_safety_desc: 'गायब सीवर ढक्कन, जर्जर दीवारें व तात्कालिक खतरे',
    cat_parks: 'पार्क व वृक्ष (Parks & Trees)',
    cat_parks_desc: 'टूटी शाखाएं, बड़ी घास या पार्क रखरखाव',

    // Table & Card Headers
    th_photo: 'फोटो',
    th_ticket_ref: 'शिकायत संदर्भ',
    th_category: 'बुनियादी ढांचा श्रेणी',
    th_ward: 'वार्ड व स्थल',
    th_priority: 'प्राथमिकता सूचकांक',
    th_status: 'कार्य स्थिति',
    th_audit: 'निरीक्षण',
    inspect: 'निरीक्षण करें',

    // Stepper & Statuses
    step_reported: 'दर्ज हुई',
    step_assigned: 'असाइन हुई',
    step_proof_filed: 'मरम्मत पूर्ण',
    step_verified: 'सत्यापित',
    status_open: 'लंबित (Open)',
    status_in_progress: 'कार्य प्रगति पर',
    status_verification_needed: 'सत्यापन आवश्यक',
    status_verified_fixed: 'सत्यापित एवं ठीक',
    status_disputed: 'विवादित / पुनः खोला',

    // Verification Box
    community_verification: 'समुदाय सत्यापन: क्या यह मरम्मत पूरी हो गई है?',
    compare_proof_desc: 'नागरिक फोटो और MCD आधिकारिक मरम्मत फोटो की तुलना करें। यदि कार्य संतोषजनक है, तो पुष्टि करें; अन्यथा फोटो प्रमाण के साथ उच्चाधिकारी को भेजें।',
    confirm_fix: 'सुधार की पुष्टि करें (Sign-Off)',
    reject_escalate: 'अस्वीकार ও उच्चाधिकारी को भेजें',
    sign_off_success: 'सत्यापन दर्ज हुआ! मरम्मत की पुष्टि के लिए धन्यवाद।',

    // Gov Dashboard
    gov_title: 'वार्ड-04 इंफ्रास्ट्रक्चर संचालन',
    gov_subtitle: 'वास्तविक समय वर्क ऑर्डर कतार: नागरिक रिपोर्ट जांचें, कर्मचारी तैनात करें और मरम्मत प्रमाण दर्ज करें।',
    work_order_queue: 'वर्क ऑर्डर डिस्पैच कतार',
    work_order_subtitle: 'नागरिक समस्याओं का प्रबंधन करें और इंजीनियरिंग मरम्मत प्रमाण अपलोड करें।',
    log_fix: 'नागरिक सत्यापन हेतु प्रमाण दर्ज करें',
    official_evidence: 'आधिकारिक मरम्मत साक्ष्य',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('civicfix_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('civicfix_lang', lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language]?.[key] || translations.en[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
