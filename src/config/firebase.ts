import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

// Standard Firebase Configuration via environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForKrishiMitraGovProcurement2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "krishi-mitra-gov.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "krishi-mitra-gov",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "krishi-mitra-gov.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

// Singleton Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initializes invisible or visible reCAPTCHA on the given DOM element
 */
export function initRecaptchaVerifier(elementId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('Window not available for reCAPTCHA');
  }

  // Clear existing verifier if any
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore
    }
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase Auth] reCAPTCHA verified successfully');
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] reCAPTCHA expired. Prompting refresh.');
    }
  });

  return recaptchaVerifier;
}

/**
 * Sends OTP via Firebase Phone Auth
 */
export async function sendFirebaseOtp(
  phone: string, 
  verifier: RecaptchaVerifier
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string }> {
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return { success: true, confirmationResult };
  } catch (error: any) {
    console.error('[Firebase Auth] Error sending phone OTP:', error);
    return { success: false, error: error.message || 'Failed to send OTP via SMS gateway' };
  }
}
