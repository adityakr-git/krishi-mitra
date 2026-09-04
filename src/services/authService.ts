export type Role = 'FARMER' | 'OFFICER' | 'ADMIN';

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  role: Role;
  village?: string;
  district?: string;
  kisanId?: string;
  aadhaarLinked: boolean;
  bankAccountMasked?: string;
  mandiId?: string;
  mandiName?: string;
  officerBadge?: string;
  department?: string;
}

// Production mock directory of registered agricultural users
export const KNOWN_USERS: Record<string, UserProfile> = {
  '9876543210': {
    id: 'usr_farmer_8841',
    phone: '9876543210',
    name: 'Ramesh Kumar',
    role: 'FARMER',
    village: 'Khandsa, Sector 37',
    district: 'Gurugram, Haryana',
    kisanId: 'HR-GUR-2024-8841',
    aadhaarLinked: true,
    bankAccountMasked: '•••• •••• •••• 4092 (State Bank of India)',
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi'
  },
  '9812345670': {
    id: 'usr_officer_409',
    phone: '9812345670',
    name: 'S.P. Varma',
    role: 'OFFICER',
    district: 'Gurugram, Haryana',
    aadhaarLinked: true,
    officerBadge: 'APMC Badge #409',
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi'
  },
  '9998887770': {
    id: 'usr_admin_001',
    phone: '9998887770',
    name: 'Dr. Arvind Rao',
    role: 'ADMIN',
    district: 'Gurugram, Haryana',
    aadhaarLinked: true,
    department: 'District Agriculture & Farmers Welfare, Gurugram'
  }
};

const STORAGE_KEY = 'krishi_mitra_auth_session';

export const authService = {
  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  },

  createVerifiedSession(phone: string, firebaseUid?: string): { success: boolean; user?: UserProfile } {
    const cleanPhone = phone.replace(/\D/g, '');

    // Lookup known registered user or default to new Farmer
    const user: UserProfile = KNOWN_USERS[cleanPhone] || {
      id: firebaseUid || `usr_${Date.now()}`,
      phone: cleanPhone,
      name: 'Kisan Mitra',
      role: 'FARMER',
      village: 'Gram Badshahpur',
      district: 'Gurugram, Haryana',
      kisanId: `HR-GUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      aadhaarLinked: true,
      bankAccountMasked: '•••• •••• •••• 1024 (PNB Rural)',
      mandiId: 'mandi-badshahpur',
      mandiName: 'Badshahpur APMC Mandi'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { success: true, user };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
