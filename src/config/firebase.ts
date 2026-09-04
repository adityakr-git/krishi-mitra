import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

// Standard Firebase Configuration via environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Singleton Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initializes invisible reCAPTCHA on the given DOM element
 */
export function initRecaptchaVerifier(elementId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('Window not available for reCAPTCHA');
  }

  // Clear existing verifier if any to prevent duplicate widgets
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore
    }
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase Auth] reCAPTCHA verified successfully');
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] reCAPTCHA expired. Refreshing.');
    }
  });

  return recaptchaVerifier;
}

/**
 * Sends real SMS OTP via Firebase Phone Auth
 */
export async function sendFirebaseOtp(
  phone: string, 
  verifier: RecaptchaVerifier
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string }> {
  try {
    const cleanDigits = phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanDigits}`;
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return { success: true, confirmationResult };
  } catch (error: any) {
    console.error('[Firebase Auth] Error sending phone OTP:', error);
    let errorMsg = error.message || 'Failed to send OTP via SMS gateway';
    if (error.code === 'auth/invalid-phone-number') {
      errorMsg = 'कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें (Invalid phone number)';
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = 'अत्यधिक प्रयास किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें (Too many requests. Try later)';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMsg = 'SMS कोटा समाप्त हो गया है। कृपया बाद में प्रयास करें (SMS quota exceeded)';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMsg = 'reCAPTCHA सत्यापन विफल रहा। कृपया पृष्ठ रिफ्रेश करें (reCAPTCHA check failed)';
    }
    return { success: false, error: errorMsg };
  }
}
