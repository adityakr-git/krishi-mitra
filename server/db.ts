// Relational Database Layer conforming to Prisma models
export interface DBUser {
  id: string;
  phone: string;
  name: string;
  role: 'FARMER' | 'OFFICER' | 'ADMIN';
  village?: string;
  district: string;
  kisanId?: string;
  aadhaarLinked: boolean;
  bankAccountMasked?: string;
  mandiId?: string;
  officerBadge?: string;
}

export interface DBMandi {
  id: string;
  name: string;
  location: string;
  dailyCapacity: number;
  currentQueueLength: number;
  activeWeighbridges: number;
  totalWeighbridges: number;
  avgProcessingTimeMins: number;
  phoneContact?: string;
  latitude?: number;
  longitude?: number;
  activeStatus: boolean;
}

export interface DBToken {
  id: string;
  qrHash: string;
  userId: string;
  mandiId: string;
  cropType: string;
  cropVariety?: string;
  quantityQuintals: number;
  status: 'SCHEDULED' | 'ARRIVED' | 'QUALITY_CHECK' | 'WEIGHING' | 'PAYMENT_PROCESSING' | 'COMPLETED' | 'CANCELLED';
  queuePosition: number;
  expectedTimeSlot: string;
  estimatedWaitMinutes: number;
  moisturePercentage?: number;
  grade?: string;
  netQuintals?: number;
  createdAt: string;
}

export interface DBPayment {
  id: string;
  tokenId: string;
  mspRate: number;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'CREDITED' | 'FAILED';
  dbtRef?: string;
  creditedAt?: string;
}

export interface DBCropRate {
  id: string;
  mandiId: string;
  mandiName?: string;
  cropName: string;
  cropNameHi: string;
  governmentMsp: number;
  localMandiRate: number;
  updatedAt: string;
}

// In-Memory Seed State aligned with Prisma Schema
class DatabaseStore {
  private users: Map<string, DBUser> = new Map();
  private mandis: Map<string, DBMandi> = new Map();
  private tokens: Map<string, DBToken> = new Map();
  private payments: Map<string, DBPayment> = new Map();
  private cropRates: Map<string, DBCropRate> = new Map(); // key = `${mandiId}:${cropName}`

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Seed Users
    const usersList: DBUser[] = [
      {
        id: 'usr_farmer_8841',
        phone: '9876543210',
        name: 'Ramesh Kumar',
        role: 'FARMER',
        village: 'Khandsa, Sector 37',
        district: 'Gurugram',
        kisanId: 'HR-GUR-2024-8841',
        aadhaarLinked: true,
        bankAccountMasked: '•••• •••• •••• 4092 (State Bank of India)',
        mandiId: 'mandi-badshahpur'
      },
      {
        id: 'usr_officer_409',
        phone: '9812345670',
        name: 'S.P. Varma',
        role: 'OFFICER',
        district: 'Gurugram',
        aadhaarLinked: true,
        officerBadge: 'APMC Badge #409',
        mandiId: 'mandi-badshahpur'
      },
      {
        id: 'usr_admin_001',
        phone: '9998887770',
        name: 'Dr. Arvind Rao',
        role: 'ADMIN',
        district: 'Gurugram',
        aadhaarLinked: true
      }
    ];
    usersList.forEach(u => this.users.set(u.phone, u));

    // 2. Seed Mandis with Geographic Coordinates
    const mandisList: DBMandi[] = [
      {
        id: 'mandi-badshahpur',
        name: 'Badshahpur APMC Mandi',
        location: 'Badshahpur, Gurugram',
        dailyCapacity: 30,
        currentQueueLength: 4,
        activeWeighbridges: 2,
        totalWeighbridges: 3,
        avgProcessingTimeMins: 6.0,
        phoneContact: '+91 124 236 4100',
        latitude: 28.3610,
        longitude: 77.0540,
        activeStatus: true
      },
      {
        id: 'mandi-sohna',
        name: 'Sohna Regional Procurement Yard',
        location: 'Sohna Bypass, Gurugram',
        dailyCapacity: 35,
        currentQueueLength: 2,
        activeWeighbridges: 3,
        totalWeighbridges: 3,
        avgProcessingTimeMins: 5.5,
        phoneContact: '+91 124 246 8200',
        latitude: 28.2480,
        longitude: 77.0620,
        activeStatus: true
      },
      {
        id: 'mandi-pataudi',
        name: 'Pataudi Sub-Tehsil Mandi',
        location: 'Station Road, Pataudi',
        dailyCapacity: 20,
        currentQueueLength: 1,
        activeWeighbridges: 2,
        totalWeighbridges: 2,
        avgProcessingTimeMins: 6.0,
        phoneContact: '+91 124 256 1230',
        latitude: 28.3240,
        longitude: 76.7820,
        activeStatus: true
      },
      {
        id: 'mandi-farrukhnagar',
        name: 'Farrukhnagar APMC Yard',
        location: 'Jhajjar Road, Farrukhnagar',
        dailyCapacity: 25,
        currentQueueLength: 2,
        activeWeighbridges: 2,
        totalWeighbridges: 2,
        avgProcessingTimeMins: 5.0,
        phoneContact: '+91 124 257 8890',
        latitude: 28.4480,
        longitude: 76.8240,
        activeStatus: true
      }
    ];
    mandisList.forEach(m => this.mandis.set(m.id, m));

    // 3. Seed Tokens
    const tokensList: DBToken[] = [
      {
        id: 'A-140',
        qrHash: 'KM-26032:A140',
        userId: 'usr_farmer_7102',
        mandiId: 'mandi-badshahpur',
        cropType: 'Mustard (Sarson)',
        cropVariety: 'Pusa Bold',
        quantityQuintals: 32.0,
        status: 'COMPLETED',
        queuePosition: 0,
        expectedTimeSlot: '09:00 AM - 10:00 AM',
        estimatedWaitMinutes: 0,
        moisturePercentage: 7.2,
        grade: 'Grade A',
        netQuintals: 32.0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'A-141',
        qrHash: 'KM-26032:A141',
        userId: 'usr_farmer_5543',
        mandiId: 'mandi-badshahpur',
        cropType: 'Wheat (Kanak)',
        cropVariety: 'HD-2967',
        quantityQuintals: 45.0,
        status: 'WEIGHING',
        queuePosition: 1,
        expectedTimeSlot: '10:00 AM - 11:00 AM',
        estimatedWaitMinutes: 6,
        moisturePercentage: 11.2,
        grade: 'Grade A',
        netQuintals: 45.0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'A-142',
        qrHash: 'KM-26032:TOKEN-A142:FARMER-RAMESH-KUMAR:40QTL:WHEAT',
        userId: 'usr_farmer_8841',
        mandiId: 'mandi-badshahpur',
        cropType: 'Wheat (Kanak)',
        cropVariety: 'Sharbati',
        quantityQuintals: 40.0,
        status: 'ARRIVED',
        queuePosition: 2,
        expectedTimeSlot: '10:30 AM - 11:30 AM',
        estimatedWaitMinutes: 12,
        createdAt: new Date().toISOString()
      },
      {
        id: 'A-143',
        qrHash: 'KM-26032:A143',
        userId: 'usr_farmer_9122',
        mandiId: 'mandi-badshahpur',
        cropType: 'Gram (Chana)',
        cropVariety: 'Pusa 362',
        quantityQuintals: 28.0,
        status: 'SCHEDULED',
        queuePosition: 3,
        expectedTimeSlot: '11:00 AM - 12:00 PM',
        estimatedWaitMinutes: 18,
        createdAt: new Date().toISOString()
      }
    ];
    tokensList.forEach(t => this.tokens.set(t.id, t));

    // 4. Seed Payments
    const paymentsList: DBPayment[] = [
      {
        id: 'pay_140',
        tokenId: 'A-140',
        mspRate: 5650.0,
        amount: 180800.0,
        status: 'CREDITED',
        dbtRef: 'DBT-2026-99381-HR',
        creditedAt: new Date().toISOString()
      },
      {
        id: 'pay_142',
        tokenId: 'A-142',
        mspRate: 2275.0,
        amount: 91000.0,
        status: 'PENDING'
      }
    ];
    paymentsList.forEach(p => this.payments.set(p.tokenId, p));

    // 5. Seed CropRates (Dynamic Mandi Bhav Table)
    const initialCropRates: DBCropRate[] = [
      // Badshahpur Mandi
      {
        id: 'rate_badshahpur_wheat',
        mandiId: 'mandi-badshahpur',
        mandiName: 'Badshahpur APMC Mandi',
        cropName: 'Wheat (Sharbati)',
        cropNameHi: 'गेहूं (शरबती)',
        governmentMsp: 2275,
        localMandiRate: 2300,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'rate_badshahpur_mustard',
        mandiId: 'mandi-badshahpur',
        mandiName: 'Badshahpur APMC Mandi',
        cropName: 'Mustard (Sarson)',
        cropNameHi: 'सरसों (देशी)',
        governmentMsp: 5650,
        localMandiRate: 5700,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'rate_badshahpur_gram',
        mandiId: 'mandi-badshahpur',
        mandiName: 'Badshahpur APMC Mandi',
        cropName: 'Gram (Chana)',
        cropNameHi: 'चना (देसी)',
        governmentMsp: 5440,
        localMandiRate: 5460,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'rate_badshahpur_barley',
        mandiId: 'mandi-badshahpur',
        mandiName: 'Badshahpur APMC Mandi',
        cropName: 'Barley (Jau)',
        cropNameHi: 'जौ',
        governmentMsp: 1850,
        localMandiRate: 1880,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      // Sohna Mandi
      {
        id: 'rate_sohna_wheat',
        mandiId: 'mandi-sohna',
        mandiName: 'Sohna Procurement Yard',
        cropName: 'Wheat (Sharbati)',
        cropNameHi: 'गेहूं (शरबती)',
        governmentMsp: 2275,
        localMandiRate: 2315,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'rate_sohna_mustard',
        mandiId: 'mandi-sohna',
        mandiName: 'Sohna Procurement Yard',
        cropName: 'Mustard (Sarson)',
        cropNameHi: 'सरसों (देशी)',
        governmentMsp: 5650,
        localMandiRate: 5720,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'rate_sohna_gram',
        mandiId: 'mandi-sohna',
        mandiName: 'Sohna Procurement Yard',
        cropName: 'Gram (Chana)',
        cropNameHi: 'चना (देसी)',
        governmentMsp: 5440,
        localMandiRate: 5490,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      // Pataudi Mandi
      {
        id: 'rate_pataudi_wheat',
        mandiId: 'mandi-pataudi',
        mandiName: 'Pataudi Sub-Tehsil Mandi',
        cropName: 'Wheat (Sharbati)',
        cropNameHi: 'गेहूं (शरबती)',
        governmentMsp: 2275,
        localMandiRate: 2290,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'rate_pataudi_gram',
        mandiId: 'mandi-pataudi',
        mandiName: 'Pataudi Sub-Tehsil Mandi',
        cropName: 'Gram (Chana)',
        cropNameHi: 'चना (देसी)',
        governmentMsp: 5440,
        localMandiRate: 5480,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    initialCropRates.forEach(r => {
      this.cropRates.set(`${r.mandiId}:${r.cropName}`, r);
    });
  }

  // Users
  getUserByPhone(phone: string): DBUser | undefined {
    return this.users.get(phone);
  }

  getUserById(id: string): DBUser | undefined {
    return Array.from(this.users.values()).find(u => u.id === id);
  }

  createUser(user: DBUser): DBUser {
    this.users.set(user.phone, user);
    return user;
  }

  // Mandis
  getMandi(id: string): DBMandi | undefined {
    return this.mandis.get(id);
  }

  getAllMandis(): DBMandi[] {
    return Array.from(this.mandis.values());
  }

  updateMandiQueue(id: string, newQueueLength: number): DBMandi | undefined {
    const mandi = this.mandis.get(id);
    if (mandi) {
      mandi.currentQueueLength = Math.max(0, newQueueLength);
      this.mandis.set(id, mandi);
    }
    return mandi;
  }

  // Tokens
  getToken(id: string): DBToken | undefined {
    return this.tokens.get(id);
  }

  getAllTokens(): DBToken[] {
    return Array.from(this.tokens.values());
  }

  getTokensByMandi(mandiId: string): DBToken[] {
    return Array.from(this.tokens.values()).filter(t => t.mandiId === mandiId);
  }

  createToken(token: DBToken): DBToken {
    this.tokens.set(token.id, token);
    const mandi = this.mandis.get(token.mandiId);
    if (mandi) {
      mandi.currentQueueLength += 1;
    }
    return token;
  }

  updateTokenStatus(id: string, status: DBToken['status']): DBToken | undefined {
    const token = this.tokens.get(id);
    if (token) {
      token.status = status;
      this.tokens.set(id, token);
    }
    return token;
  }

  advanceQueue(mandiId: string): { calledToken?: DBToken; updatedTokens: DBToken[]; newQueueLength: number } {
    const tokens = this.getTokensByMandi(mandiId).filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    
    tokens.sort((a, b) => a.queuePosition - b.queuePosition);

    let calledToken: DBToken | undefined;

    tokens.forEach(t => {
      if (t.queuePosition === 1) {
        calledToken = t;
        t.queuePosition = 0;
        t.status = 'WEIGHING';
      } else if (t.queuePosition > 1) {
        t.queuePosition -= 1;
      }
      this.tokens.set(t.id, t);
    });

    const activeRemaining = tokens.filter(t => t.queuePosition > 0).length;
    this.updateMandiQueue(mandiId, activeRemaining);

    return {
      calledToken,
      updatedTokens: this.getTokensByMandi(mandiId),
      newQueueLength: activeRemaining
    };
  }

  // Payments
  getPayment(tokenId: string): DBPayment | undefined {
    return this.payments.get(tokenId);
  }

  updatePaymentStatus(tokenId: string, status: DBPayment['status'], dbtRef?: string): DBPayment | undefined {
    const pay = this.payments.get(tokenId);
    if (pay) {
      pay.status = status;
      if (dbtRef) pay.dbtRef = dbtRef;
      if (status === 'CREDITED') pay.creditedAt = new Date().toISOString();
      this.payments.set(tokenId, pay);
    }
    return pay;
  }

  // CropRates (Mandi Bhav Control)
  getCropRates(mandiId?: string): DBCropRate[] {
    const all = Array.from(this.cropRates.values());
    if (mandiId) {
      return all.filter(r => r.mandiId === mandiId);
    }
    return all;
  }

  updateCropRate(mandiId: string, cropName: string, localRate: number): DBCropRate | null {
    const key = `${mandiId}:${cropName}`;
    let rate = this.cropRates.get(key);

    const now = new Date();
    const timeFormatted = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (rate) {
      rate.localMandiRate = localRate;
      rate.updatedAt = timeFormatted;
      this.cropRates.set(key, rate);
      return rate;
    }

    // Auto-create if not present
    const mandi = this.getMandi(mandiId);
    const msp = cropName.includes('Mustard') ? 5650 : cropName.includes('Gram') ? 5440 : cropName.includes('Barley') ? 1850 : 2275;
    
    rate = {
      id: `rate_${mandiId}_${Date.now()}`,
      mandiId,
      mandiName: mandi?.name || mandiId,
      cropName,
      cropNameHi: cropName.includes('Wheat') ? 'गेहूं (शरबती)' : cropName.includes('Mustard') ? 'सरसों (देशी)' : cropName,
      governmentMsp: msp,
      localMandiRate: localRate,
      updatedAt: timeFormatted
    };

    this.cropRates.set(key, rate);
    return rate;
  }
}

export const db = new DatabaseStore();
