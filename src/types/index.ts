export type UserRole = 'FARMER' | 'OFFICER' | 'ADMIN' | 'IMPACT';

export type Language = 'en' | 'hi' | 'pa' | 'mr';

export type TokenStatus = 
  | 'SCHEDULED' 
  | 'ARRIVED' 
  | 'QUALITY_CHECK' 
  | 'WEIGHING' 
  | 'PAYMENT_PROCESSING' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface QualityData {
  moisturePercentage: number;
  foreignMatterPercentage: number;
  grade: 'Grade A' | 'Grade B' | 'Grade C';
  inspectedBy: string;
  inspectedAt?: string;
  aiSuggestedGrade?: string;
  notes?: string;
}

export interface WeighingData {
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  netQuintals: number;
  weighedAt?: string;
  bridgeNumber: number;
}

export interface PaymentData {
  mspPerQuintal: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID';
  dbtRefId?: string;
  bankAccountMasked?: string;
  processedAt?: string;
}

export interface Token {
  id: string; // e.g. "A-142"
  tokenNumber: number;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  crop: string;
  cropVariety: string;
  quantityQuintals: number;
  mandiId: string;
  mandiName: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  status: TokenStatus;
  qualityData?: QualityData;
  weighingData?: WeighingData;
  paymentData?: PaymentData;
  qrCodeData: string;
  createdAt: string;
}

export type MandiCongestion = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MandiCenter {
  id: string;
  name: string;
  locationName: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  distanceKm: number;
  currentQueueCount: number;
  capacityMax: number;
  congestion: MandiCongestion;
  avgWaitMinutes: number;
  activeWeighbridges: number;
  totalWeighbridges: number;
  isRecommended?: boolean;
  supportedCrops: string[];
  todaysProcuredQuintals: number;
  phoneContact: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  timestamp: string;
  read: boolean;
  roleTarget?: UserRole;
}

export interface SMSMessage {
  id: string;
  phone: string;
  text: string;
  timestamp: string;
  direction: 'INCOMING' | 'OUTGOING';
  status: 'DELIVERED' | 'RECEIVED';
}

export interface FraudAlert {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  farmerName: string;
  farmerId: string;
  tokenId: string;
  reason: string;
  detectedAt: string;
  status: 'FLAGGED' | 'INVESTIGATING' | 'RESOLVED';
  confidenceScore: number;
}

export interface AIWaitFactors {
  activeCounters: number;
  totalTrolleysAhead: number;
  processingSpeedMins: number;
  weatherFactor: string;
  roadCongestionFactor: string;
  confidenceScore: number; // e.g. 92
}
