import { create } from 'zustand';
import { Token, MandiCenter, UserRole, Language, NotificationItem, SMSMessage, FraudAlert, AIWaitFactors, MandiCongestion } from '../types';
import { playChime, playSuccessChime, playAlertChime } from '../utils/soundEffects';

interface ProcurementState {
  // User context
  currentRole: UserRole;
  language: Language;
  accessibilityHighContrast: boolean;
  largeFont: boolean;
  isOffline: boolean;
  offlineSyncTime: string;

  // Domain state
  activeToken: Token;
  allTokens: Token[];
  mandis: MandiCenter[];
  notifications: NotificationItem[];
  smsMessages: SMSMessage[];
  fraudAlerts: FraudAlert[];
  aiWaitFactors: AIWaitFactors;

  // Demo state
  demoStep: number;
  isDemoActive: boolean;

  // Actions
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  toggleHighContrast: () => void;
  toggleLargeFont: () => void;
  toggleOfflineMode: () => void;

  // Token & Queue Actions
  advanceActiveTokenQueue: () => void;
  markTokenArrived: (tokenId: string) => void;
  recordQualityAndWeighing: (tokenId: string, moisture: number, grade: 'Grade A' | 'Grade B' | 'Grade C', netQuintals: number) => void;
  approvePayment: (tokenId: string) => void;
  bookNewToken: (crop: string, variety: string, quantity: number, mandiId: string, timeSlot: string) => Token;

  // Mandi & Admin Actions
  rebalanceDistrictLoad: () => void;
  broadcastOfficerAlert: (message: string) => void;
  resolveFraudAlert: (alertId: string) => void;

  // Notification & SMS
  addNotification: (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT', roleTarget?: UserRole) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  sendSMS: (phone: string, text: string, direction: 'INCOMING' | 'OUTGOING') => void;

  // Demo Runner
  resetToDemoState: () => void;
  nextDemoStep: () => void;
}

const INITIAL_MANDIS: MandiCenter[] = [
  {
    id: 'mandi-badshahpur',
    name: 'Badshahpur APMC Mandi',
    locationName: 'Badshahpur, Gurugram',
    district: 'Gurugram',
    state: 'Haryana',
    lat: 28.3639,
    lng: 77.0512,
    distanceKm: 4.2,
    currentQueueCount: 19,
    capacityMax: 25,
    congestion: 'HIGH',
    avgWaitMinutes: 34,
    activeWeighbridges: 2,
    totalWeighbridges: 3,
    isRecommended: false,
    supportedCrops: ['Wheat', 'Mustard', 'Gram', 'Barley'],
    todaysProcuredQuintals: 840,
    phoneContact: '+91 124 236 4100'
  },
  {
    id: 'mandi-sohna',
    name: 'Sohna Regional Procurement Yard',
    locationName: 'Sohna Bypass, Gurugram',
    district: 'Gurugram',
    state: 'Haryana',
    lat: 28.2467,
    lng: 77.0674,
    distanceKm: 9.8,
    currentQueueCount: 4,
    capacityMax: 30,
    congestion: 'LOW',
    avgWaitMinutes: 12,
    activeWeighbridges: 3,
    totalWeighbridges: 3,
    isRecommended: true,
    supportedCrops: ['Wheat', 'Mustard', 'Paddy', 'Gram'],
    todaysProcuredQuintals: 620,
    phoneContact: '+91 124 246 8200'
  },
  {
    id: 'mandi-pataudi',
    name: 'Pataudi Sub-Tehsil Mandi',
    locationName: 'Station Road, Pataudi',
    district: 'Gurugram',
    state: 'Haryana',
    lat: 28.3242,
    lng: 76.7825,
    distanceKm: 16.5,
    currentQueueCount: 6,
    capacityMax: 20,
    congestion: 'LOW',
    avgWaitMinutes: 15,
    activeWeighbridges: 2,
    totalWeighbridges: 2,
    isRecommended: false,
    supportedCrops: ['Wheat', 'Mustard', 'Barley'],
    todaysProcuredQuintals: 450,
    phoneContact: '+91 124 256 1230'
  },
  {
    id: 'mandi-farrukhnagar',
    name: 'Farrukhnagar Grain Hub',
    locationName: 'Jhajjar Road, Farrukhnagar',
    district: 'Gurugram',
    state: 'Haryana',
    lat: 28.4501,
    lng: 76.8242,
    distanceKm: 19.2,
    currentQueueCount: 11,
    capacityMax: 22,
    congestion: 'MEDIUM',
    avgWaitMinutes: 22,
    activeWeighbridges: 2,
    totalWeighbridges: 2,
    isRecommended: false,
    supportedCrops: ['Wheat', 'Mustard', 'Gram'],
    todaysProcuredQuintals: 520,
    phoneContact: '+91 124 278 9011'
  },
  {
    id: 'mandi-gurugram-main',
    name: 'Gurugram Central APMC Yard',
    locationName: 'Sector 10A, Gurugram',
    district: 'Gurugram',
    state: 'Haryana',
    lat: 28.4418,
    lng: 77.0142,
    distanceKm: 7.1,
    currentQueueCount: 15,
    capacityMax: 28,
    congestion: 'MEDIUM',
    avgWaitMinutes: 28,
    activeWeighbridges: 2,
    totalWeighbridges: 3,
    isRecommended: false,
    supportedCrops: ['Wheat', 'Mustard', 'Paddy', 'Pulses'],
    todaysProcuredQuintals: 920,
    phoneContact: '+91 124 288 3344'
  }
];

const INITIAL_HERO_TOKEN: Token = {
  id: 'A-142',
  tokenNumber: 142,
  farmerId: 'HR-GUR-2024-8841',
  farmerName: 'Ramesh Kumar',
  phone: '98765 43210',
  village: 'Khandsa, Sector 37',
  crop: 'Wheat (Kanak)',
  cropVariety: 'Sharbati (Super Grade)',
  quantityQuintals: 40.0,
  mandiId: 'mandi-badshahpur',
  mandiName: 'Badshahpur APMC Mandi',
  scheduledDate: 'Today, 03 Sep 2026',
  scheduledTimeSlot: '10:30 AM - 11:30 AM',
  queuePosition: 3,
  estimatedWaitMinutes: 18,
  status: 'SCHEDULED',
  qrCodeData: 'KM-26032:TOKEN-A142:FARMER-RAMESH-KUMAR:40QTL:WHEAT:BADSHAHPUR',
  createdAt: '08:15 AM',
  paymentData: {
    mspPerQuintal: 2275,
    grossAmount: 91000,
    deductions: 0,
    netAmount: 91000,
    paymentStatus: 'PENDING',
    bankAccountMasked: '•••• •••• •••• 4092 (SBI Rural Badshahpur)'
  }
};

const INITIAL_ALL_TOKENS: Token[] = [
  {
    id: 'A-140',
    tokenNumber: 140,
    farmerId: 'HR-GUR-2024-7102',
    farmerName: 'Balbir Singh Dhillon',
    phone: '98123 45678',
    village: 'Tikli Village',
    crop: 'Mustard (Sarson)',
    cropVariety: 'Pusa Bold',
    quantityQuintals: 32.0,
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi',
    scheduledDate: 'Today, 03 Sep 2026',
    scheduledTimeSlot: '09:00 AM - 10:00 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    status: 'COMPLETED',
    qualityData: {
      moisturePercentage: 7.2,
      foreignMatterPercentage: 0.8,
      grade: 'Grade A',
      inspectedBy: 'Officer S.P. Varma (Badge #409)',
      inspectedAt: '09:42 AM'
    },
    weighingData: {
      grossWeightKg: 4620,
      tareWeightKg: 1420,
      netWeightKg: 3200,
      netQuintals: 32.0,
      weighedAt: '09:55 AM',
      bridgeNumber: 1
    },
    paymentData: {
      mspPerQuintal: 5650,
      grossAmount: 180800,
      deductions: 0,
      netAmount: 180800,
      paymentStatus: 'PAID',
      dbtRefId: 'DBT-2026-99381-HR',
      bankAccountMasked: '•••• •••• •••• 7120 (PNB Tikli)',
      processedAt: '10:08 AM'
    },
    qrCodeData: 'KM-26032:TOKEN-A140',
    createdAt: '07:30 AM'
  },
  {
    id: 'A-141',
    tokenNumber: 141,
    farmerId: 'HR-GUR-2024-5543',
    farmerName: 'Jagdish Yadav',
    phone: '94160 12890',
    village: 'Fazilpur Jharsa',
    crop: 'Wheat (Kanak)',
    cropVariety: 'HD-2967',
    quantityQuintals: 45.0,
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi',
    scheduledDate: 'Today, 03 Sep 2026',
    scheduledTimeSlot: '10:00 AM - 11:00 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 6,
    status: 'WEIGHING',
    qualityData: {
      moisturePercentage: 11.2,
      foreignMatterPercentage: 0.5,
      grade: 'Grade A',
      inspectedBy: 'Officer S.P. Varma (Badge #409)',
      inspectedAt: '10:15 AM'
    },
    weighingData: {
      grossWeightKg: 5950,
      tareWeightKg: 1450,
      netWeightKg: 4500,
      netQuintals: 45.0,
      weighedAt: '10:28 AM',
      bridgeNumber: 2
    },
    paymentData: {
      mspPerQuintal: 2275,
      grossAmount: 102375,
      deductions: 0,
      netAmount: 102375,
      paymentStatus: 'PROCESSING',
      bankAccountMasked: '•••• •••• •••• 8831 (Canara Bank)'
    },
    qrCodeData: 'KM-26032:TOKEN-A141',
    createdAt: '08:00 AM'
  },
  INITIAL_HERO_TOKEN,
  {
    id: 'A-143',
    tokenNumber: 143,
    farmerId: 'HR-GUR-2024-9122',
    farmerName: 'Harpreet Kaur',
    phone: '97280 66543',
    village: 'Begumpur Khatola',
    crop: 'Gram (Chana)',
    cropVariety: 'Pusa 362',
    quantityQuintals: 28.0,
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi',
    scheduledDate: 'Today, 03 Sep 2026',
    scheduledTimeSlot: '11:00 AM - 12:00 PM',
    queuePosition: 4,
    estimatedWaitMinutes: 26,
    status: 'SCHEDULED',
    qrCodeData: 'KM-26032:TOKEN-A143',
    createdAt: '08:30 AM'
  },
  {
    id: 'A-144',
    tokenNumber: 144,
    farmerId: 'HR-GUR-2024-3401',
    farmerName: 'Satish Chander',
    phone: '98960 33412',
    village: 'Narsinghpur',
    crop: 'Wheat (Kanak)',
    cropVariety: 'PBW 550',
    quantityQuintals: 52.0,
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi',
    scheduledDate: 'Today, 03 Sep 2026',
    scheduledTimeSlot: '11:30 AM - 12:30 PM',
    queuePosition: 5,
    estimatedWaitMinutes: 34,
    status: 'SCHEDULED',
    qrCodeData: 'KM-26032:TOKEN-A144',
    createdAt: '08:45 AM'
  }
];

const INITIAL_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'FR-8891',
    severity: 'HIGH',
    farmerName: 'Surender Pal (Land ID: K-8812)',
    farmerId: 'HR-GUR-2024-9902',
    tokenId: 'B-209',
    reason: 'Token quantity (180 Quintals) exceeds declared cultivable land ceiling (2.5 Acres) by 240%.',
    detectedAt: '10:04 AM',
    status: 'FLAGGED',
    confidenceScore: 96
  },
  {
    id: 'FR-8892',
    severity: 'MEDIUM',
    farmerName: 'Manoj Goods Transport',
    farmerId: 'HR-GUR-2024-1144',
    tokenId: 'B-211',
    reason: 'Duplicate vehicle registration (HR-55-AB-4029) booked across two separate mandis simultaneously.',
    detectedAt: '09:48 AM',
    status: 'INVESTIGATING',
    confidenceScore: 88
  }
];

const INITIAL_SMS: SMSMessage[] = [
  {
    id: 'sms-1',
    phone: '98765 43210',
    text: '🌾 Krishi Mitra: Namaste Ramesh Kumar ji. Your Token A-142 is booked at Badshahpur Mandi for Wheat (40 Qtl). Slot: 10:30-11:30 AM. Reply STATUS to check queue.',
    timestamp: '08:16 AM',
    direction: 'OUTGOING',
    status: 'DELIVERED'
  },
  {
    id: 'sms-2',
    phone: '98765 43210',
    text: 'STATUS',
    timestamp: '10:02 AM',
    direction: 'INCOMING',
    status: 'RECEIVED'
  },
  {
    id: 'sms-3',
    phone: '98765 43210',
    text: '🌾 Krishi Mitra Update: Token A-142 currently #3 in line at Badshahpur. Est wait: 18 mins. Counter #2 active. Keep your Kisan ID ready.',
    timestamp: '10:02 AM',
    direction: 'OUTGOING',
    status: 'DELIVERED'
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Token A-142 Slot Approaching',
    message: 'Your slot at Badshahpur Mandi begins at 10:30 AM. 3 trolleys currently ahead of you.',
    type: 'INFO',
    timestamp: '10:15 AM',
    read: false,
    roleTarget: 'FARMER'
  },
  {
    id: 'notif-2',
    title: 'District Congestion Advisory',
    message: 'Badshahpur Mandi capacity reached 76%. Diverting new arrivals to Sohna Center (Avg wait 12 mins).',
    type: 'WARNING',
    timestamp: '10:05 AM',
    read: false,
    roleTarget: 'ADMIN'
  },
  {
    id: 'notif-3',
    title: 'Payment DBT Disbursed',
    message: '₹1,80,800 transferred to Balbir Singh Dhillon for Token A-140 via PFMS. UTR: DBT-2026-99381-HR.',
    type: 'SUCCESS',
    timestamp: '10:08 AM',
    read: true,
    roleTarget: 'OFFICER'
  }
];

// BroadcastChannel for cross-tab synchronization
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('krishi_mitra_channel')
  : null;

export const useProcurementStore = create<ProcurementState>((set, get) => {
  // Listen to remote tab events
  if (channel) {
    channel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === 'SYNC_STATE') {
        set(data.payload);
      }
    };
  }

  const broadcastSync = (state: Partial<ProcurementState>) => {
    if (channel) {
      try {
        channel.postMessage({ type: 'SYNC_STATE', payload: state });
      } catch {
        // Fallback
      }
    }
  };

  return {
    currentRole: 'FARMER',
    language: 'en',
    accessibilityHighContrast: false,
    largeFont: false,
    isOffline: false,
    offlineSyncTime: '10:25 AM',

    activeToken: INITIAL_HERO_TOKEN,
    allTokens: INITIAL_ALL_TOKENS,
    mandis: INITIAL_MANDIS,
    notifications: INITIAL_NOTIFICATIONS,
    smsMessages: INITIAL_SMS,
    fraudAlerts: INITIAL_FRAUD_ALERTS,
    aiWaitFactors: {
      activeCounters: 2,
      totalTrolleysAhead: 3,
      processingSpeedMins: 6.0,
      weatherFactor: 'Clear Weather (1.0x Normal Speed)',
      roadCongestionFactor: 'Normal Flow (Subhash Chowk Clear)',
      confidenceScore: 92
    },

    demoStep: 1,
    isDemoActive: false,

    setRole: (role) => set({ currentRole: role }),
    setLanguage: (lang) => set({ language: lang }),
    toggleHighContrast: () => set((state) => ({ accessibilityHighContrast: !state.accessibilityHighContrast })),
    toggleLargeFont: () => set((state) => ({ largeFont: !state.largeFont })),
    toggleOfflineMode: () => set((state) => {
      const nextOffline = !state.isOffline;
      const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (nextOffline) {
        playAlertChime();
      } else {
        playSuccessChime();
      }
      return { isOffline: nextOffline, offlineSyncTime: syncTime };
    }),

    addNotification: (title, message, type, roleTarget) => {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        roleTarget
      };
      set((state) => {
        const next = { notifications: [newNotif, ...state.notifications] };
        broadcastSync(next);
        return next;
      });
    },

    markNotificationRead: (id) => {
      set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
      }));
    },

    clearNotifications: () => set({ notifications: [] }),

    sendSMS: (phone, text, direction) => {
      const newSMS: SMSMessage = {
        id: `sms-${Date.now()}`,
        phone,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        direction,
        status: direction === 'OUTGOING' ? 'DELIVERED' : 'RECEIVED'
      };

      set((state) => {
        const updatedSMS = [...state.smsMessages, newSMS];
        const next = { smsMessages: updatedSMS };
        broadcastSync(next);
        return next;
      });

      // If incoming shortcode SMS, auto respond!
      if (direction === 'INCOMING') {
        setTimeout(() => {
          const upperText = text.trim().toUpperCase();
          const active = get().activeToken;
          let reply = `🌾 Krishi Mitra Help: Valid commands are 'STATUS', 'HELP', or 'CANCEL'. Your registered Token is ${active.id}.`;
          
          if (upperText.includes('STATUS') || upperText.includes(active.id)) {
            reply = `🌾 Krishi Mitra Update: Token ${active.id} | Position: #${active.queuePosition} | Center: ${active.mandiName} | Est Wait: ${active.estimatedWaitMinutes} mins | Status: ${active.status}`;
          }

          get().sendSMS(phone, reply, 'OUTGOING');
        }, 800);
      }
    },

    advanceActiveTokenQueue: () => {
      playChime();
      const current = get().activeToken;
      const nextPos = Math.max(0, current.queuePosition - 1);
      const nextWait = Math.max(0, Math.round(nextPos * 6));
      let nextStatus = current.status;
      if (nextPos === 0 && current.status === 'SCHEDULED') {
        nextStatus = 'ARRIVED';
      }

      const updatedToken: Token = {
        ...current,
        queuePosition: nextPos,
        estimatedWaitMinutes: nextWait,
        status: nextStatus
      };

      const updatedAll = get().allTokens.map((t) => (t.id === current.id ? updatedToken : t));
      const nextState = {
        activeToken: updatedToken,
        allTokens: updatedAll,
        aiWaitFactors: {
          ...get().aiWaitFactors,
          totalTrolleysAhead: nextPos
        }
      };

      set(nextState);
      broadcastSync(nextState);

      // Trigger alerts
      get().addNotification(
        'Queue Advanced!',
        `Token A-142 is now position #${nextPos}. Estimated wait: ${nextWait} mins.`,
        'INFO',
        'FARMER'
      );

      get().sendSMS(
        current.phone,
        `🌾 Krishi Mitra Live Alert: Token ${current.id} is now #${nextPos} in line at ${current.mandiName}. Approx ${nextWait} mins remaining. Please move to Gate #2.`,
        'OUTGOING'
      );
    },

    markTokenArrived: (tokenId) => {
      playChime();
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updatedAll = get().allTokens.map((t) => {
        if (t.id === tokenId) {
          return { ...t, status: 'ARRIVED' as const, queuePosition: 1, estimatedWaitMinutes: 5 };
        }
        return t;
      });

      const updatedActive = get().activeToken.id === tokenId
        ? { ...get().activeToken, status: 'ARRIVED' as const, queuePosition: 1, estimatedWaitMinutes: 5 }
        : get().activeToken;

      const nextState = { allTokens: updatedAll, activeToken: updatedActive };
      set(nextState);
      broadcastSync(nextState);

      get().addNotification(
        'Gate Entry Recorded',
        `Farmer marked ARRIVED at Gate #2 at ${time}. Directed to Inspection Bay #1.`,
        'SUCCESS'
      );
    },

    recordQualityAndWeighing: (tokenId, moisture, grade, netQuintals) => {
      playChime();
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const rate = 2275; // MSP rate
      const gross = Math.round(rate * netQuintals);

      const qualityData = {
        moisturePercentage: moisture,
        foreignMatterPercentage: 0.6,
        grade,
        inspectedBy: 'Officer S.P. Varma (Badge #409)',
        inspectedAt: time,
        aiSuggestedGrade: grade
      };

      const tareKg = 1420;
      const netKg = Math.round(netQuintals * 100);
      const grossKg = tareKg + netKg;

      const weighingData = {
        grossWeightKg: grossKg,
        tareWeightKg: tareKg,
        netWeightKg: netKg,
        netQuintals,
        weighedAt: time,
        bridgeNumber: 2
      };

      const paymentData = {
        mspPerQuintal: rate,
        grossAmount: gross,
        deductions: moisture > 12 ? Math.round(gross * 0.01) : 0,
        netAmount: gross - (moisture > 12 ? Math.round(gross * 0.01) : 0),
        paymentStatus: 'PROCESSING' as const,
        bankAccountMasked: '•••• •••• •••• 4092 (SBI Rural Badshahpur)',
        processedAt: time
      };

      const updatedAll = get().allTokens.map((t) => {
        if (t.id === tokenId) {
          return {
            ...t,
            status: 'PAYMENT_PROCESSING' as const,
            quantityQuintals: netQuintals,
            qualityData,
            weighingData,
            paymentData
          };
        }
        return t;
      });

      const updatedActive = get().activeToken.id === tokenId
        ? {
            ...get().activeToken,
            status: 'PAYMENT_PROCESSING' as const,
            quantityQuintals: netQuintals,
            qualityData,
            weighingData,
            paymentData
          }
        : get().activeToken;

      const nextState = { allTokens: updatedAll, activeToken: updatedActive };
      set(nextState);
      broadcastSync(nextState);

      get().addNotification(
        'Inspection & Weight Verified',
        `Moisture: ${moisture}%, Grade: ${grade}, Net Weight: ${netQuintals} Qtl. Total payable: ₹${paymentData.netAmount.toLocaleString('en-IN')}.`,
        'SUCCESS'
      );
    },

    approvePayment: (tokenId) => {
      playSuccessChime();
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dbtRefId = `DBT-2026-${Math.floor(10000 + Math.random() * 90000)}-HR`;

      const updatedAll = get().allTokens.map((t) => {
        if (t.id === tokenId) {
          return {
            ...t,
            status: 'COMPLETED' as const,
            queuePosition: 0,
            estimatedWaitMinutes: 0,
            paymentData: {
              ...t.paymentData!,
              paymentStatus: 'PAID' as const,
              dbtRefId,
              processedAt: time
            }
          };
        }
        return t;
      });

      const updatedActive = get().activeToken.id === tokenId
        ? {
            ...get().activeToken,
            status: 'COMPLETED' as const,
            queuePosition: 0,
            estimatedWaitMinutes: 0,
            paymentData: {
              ...get().activeToken.paymentData!,
              paymentStatus: 'PAID' as const,
              dbtRefId,
              processedAt: time
            }
          }
        : get().activeToken;

      // Update Mandi procured stats
      const mandiId = updatedActive.mandiId;
      const updatedMandis = get().mandis.map((m) => {
        if (m.id === mandiId) {
          return { ...m, todaysProcuredQuintals: m.todaysProcuredQuintals + updatedActive.quantityQuintals };
        }
        return m;
      });

      const nextState = { allTokens: updatedAll, activeToken: updatedActive, mandis: updatedMandis };
      set(nextState);
      broadcastSync(nextState);

      get().addNotification(
        'Direct DBT Transfer Disbursed! 💰',
        `₹${(updatedActive.paymentData?.netAmount || 91000).toLocaleString('en-IN')} approved via PFMS/DBT to Ramesh Kumar. Ref: ${dbtRefId}`,
        'SUCCESS',
        'FARMER'
      );

      get().sendSMS(
        updatedActive.phone,
        `🌾 Krishi Mitra DBT Success: ₹${(updatedActive.paymentData?.netAmount || 91000).toLocaleString('en-IN')} has been initiated to your SBI A/C ending 4092. UTR: ${dbtRefId}. Zero deductions. Thank you for your harvest!`,
        'OUTGOING'
      );
    },

    bookNewToken: (crop, variety, quantity, mandiId, timeSlot) => {
      playSuccessChime();
      const tokenNum = Math.floor(150 + Math.random() * 50);
      const mandi = get().mandis.find((m) => m.id === mandiId) || get().mandis[1];
      const mspRate = crop.includes('Wheat') ? 2275 : crop.includes('Mustard') ? 5650 : 5440;
      const gross = quantity * mspRate;

      const newToken: Token = {
        id: `A-${tokenNum}`,
        tokenNumber: tokenNum,
        farmerId: 'HR-GUR-2024-8841',
        farmerName: 'Ramesh Kumar',
        phone: '98765 43210',
        village: 'Khandsa, Sector 37',
        crop,
        cropVariety: variety,
        quantityQuintals: quantity,
        mandiId: mandi.id,
        mandiName: mandi.name,
        scheduledDate: 'Today, 03 Sep 2026',
        scheduledTimeSlot: timeSlot,
        queuePosition: mandi.currentQueueCount + 1,
        estimatedWaitMinutes: (mandi.currentQueueCount + 1) * 6,
        status: 'SCHEDULED',
        qrCodeData: `KM-26032:TOKEN-A${tokenNum}:FARMER-RAMESH-KUMAR:${quantity}QTL:${crop}:${mandi.name}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentData: {
          mspPerQuintal: mspRate,
          grossAmount: gross,
          deductions: 0,
          netAmount: gross,
          paymentStatus: 'PENDING',
          bankAccountMasked: '•••• •••• •••• 4092 (SBI Rural Badshahpur)'
        }
      };

      const updatedMandis = get().mandis.map((m) => {
        if (m.id === mandi.id) {
          return { ...m, currentQueueCount: m.currentQueueCount + 1 };
        }
        return m;
      });

      const nextState = {
        activeToken: newToken,
        allTokens: [newToken, ...get().allTokens],
        mandis: updatedMandis
      };

      set(nextState);
      broadcastSync(nextState);

      get().addNotification(
        'Digital Token Generated!',
        `Token #${newToken.id} booked for ${mandi.name} (${timeSlot}). QR Pass saved offline.`,
        'SUCCESS',
        'FARMER'
      );

      get().sendSMS(
        newToken.phone,
        `🌾 Krishi Mitra: New Token ${newToken.id} issued for ${mandi.name}. Slot: ${timeSlot}. Crop: ${crop} (${quantity} Qtl). Est wait: ${newToken.estimatedWaitMinutes} mins.`,
        'OUTGOING'
      );

      return newToken;
    },

    rebalanceDistrictLoad: () => {
      playAlertChime();
      const updatedMandis = get().mandis.map((m) => {
        if (m.id === 'mandi-badshahpur') {
          return {
            ...m,
            currentQueueCount: 7,
            congestion: 'LOW' as MandiCongestion,
            avgWaitMinutes: 16
          };
        }
        if (m.id === 'mandi-sohna') {
          return {
            ...m,
            currentQueueCount: 12,
            congestion: 'LOW' as MandiCongestion,
            avgWaitMinutes: 18
          };
        }
        return m;
      });

      // Update hero token wait time
      const active = get().activeToken;
      const updatedActive = {
        ...active,
        estimatedWaitMinutes: 12,
        queuePosition: 2
      };

      const nextState = {
        mandis: updatedMandis,
        activeToken: updatedActive,
        aiWaitFactors: {
          ...get().aiWaitFactors,
          totalTrolleysAhead: 2,
          confidenceScore: 97
        }
      };

      set(nextState);
      broadcastSync(nextState);

      get().addNotification(
        'AI Load Rebalanced Successfully ⚡',
        '25 upcoming trolleys diverted from Badshahpur to Sohna Procurement Yard. Average wait time dropped by 53%.',
        'SUCCESS',
        'ADMIN'
      );
    },

    broadcastOfficerAlert: (message) => {
      playAlertChime();
      get().addNotification('Mandi Officer Broadcast 📢', message, 'WARNING');
      get().sendSMS('ALL_REGISTERED_FARMERS', `🌾 APMC Broadcast: ${message}`, 'OUTGOING');
    },

    resolveFraudAlert: (alertId) => {
      playSuccessChime();
      set((state) => ({
        fraudAlerts: state.fraudAlerts.map((f) => (f.id === alertId ? { ...f, status: 'RESOLVED' as const } : f))
      }));
      get().addNotification('Fraud Audit Resolved', `Audit report generated for Alert #${alertId}. Verified against RoR Land Registry.`, 'INFO');
    },

    resetToDemoState: () => {
      playSuccessChime();
      const nextState = {
        currentRole: 'FARMER' as UserRole,
        activeToken: INITIAL_HERO_TOKEN,
        allTokens: INITIAL_ALL_TOKENS,
        mandis: INITIAL_MANDIS,
        notifications: INITIAL_NOTIFICATIONS,
        smsMessages: INITIAL_SMS,
        fraudAlerts: INITIAL_FRAUD_ALERTS,
        demoStep: 1,
        isDemoActive: true
      };
      set(nextState);
      broadcastSync(nextState);
    },

    nextDemoStep: () => {
      const step = get().demoStep;
      if (step === 1) {
        // Step 1 -> Step 2: Officer calls next
        get().setRole('OFFICER');
        get().advanceActiveTokenQueue();
        set({ demoStep: 2 });
      } else if (step === 2) {
        // Step 2 -> Step 3: Officer marks arrived & records quality/weight
        get().markTokenArrived('A-142');
        get().recordQualityAndWeighing('A-142', 11.4, 'Grade A', 40.0);
        set({ demoStep: 3 });
      } else if (step === 3) {
        // Step 3 -> Step 4: Officer approves DBT payment
        get().approvePayment('A-142');
        set({ demoStep: 4 });
      } else if (step === 4) {
        // Step 4 -> Step 5: Switch back to Farmer view to show completed DBT payment
        get().setRole('FARMER');
        set({ demoStep: 5 });
      } else if (step === 5) {
        // Step 5 -> Step 6: Switch to Admin and execute load rebalance
        get().setRole('ADMIN');
        get().rebalanceDistrictLoad();
        set({ demoStep: 6 });
      } else if (step === 6) {
        // Step 6 -> Step 7: Switch to Judge Impact screen!
        get().setRole('IMPACT');
        set({ demoStep: 7 });
      } else {
        get().resetToDemoState();
      }
    }
  };
});
