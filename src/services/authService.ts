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

    // Check registered_farmers in localStorage for dynamic name
    let registeredName: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const farmers = JSON.parse(localStorage.getItem('registered_farmers') || '[]');
        const f = farmers.find((item: any) => item.phone === cleanPhone);
        if (f && f.name) registeredName = f.name;
      } catch {
        // ignore
      }
    }

    // Lookup known registered user or default to new Farmer
    const user: UserProfile = KNOWN_USERS[cleanPhone] || {
      id: firebaseUid || `usr_${Date.now()}`,
      phone: cleanPhone,
      name: registeredName || 'Kisan Mitra',
      role: 'FARMER',
      village: 'Gram Badshahpur',
      district: 'Gurugram, Haryana',
      kisanId: `HR-GUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      aadhaarLinked: true,
      bankAccountMasked: '•••• •••• •••• 1024 (PNB Rural)',
      mandiId: 'mandi-badshahpur',
      mandiName: 'Badshahpur APMC Mandi'
    };

    if (registeredName && user.role === 'FARMER') {
      user.name = registeredName;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('krishi_mitra_session', user.role.toLowerCase());
    return { success: true, user };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('krishi_mitra_session');
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.recaptchaVerifier) {
        try {
          if (!win.recaptchaVerifier.destroyed) {
            win.recaptchaVerifier.clear();
          }
        } catch {
          // ignore
        }
        win.recaptchaVerifier = null;
      }
      const container = document.getElementById('recaptcha-container');
      if (container && container.parentNode) {
        const freshNode = document.createElement('div');
        freshNode.id = 'recaptcha-container';
        container.parentNode.replaceChild(freshNode, container);
      } else if (container) {
        container.innerHTML = '';
      }
    }
  }
};
