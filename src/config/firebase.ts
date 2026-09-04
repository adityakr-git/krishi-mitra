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
 * Completely clears and tears down any existing RecaptchaVerifier instance and cleans
 * the target DOM container so it is completely empty and ready for a fresh initialization.
 */
export function clearRecaptchaVerifier(elementId: string = 'recaptcha-container'): void {
  if (typeof window === 'undefined') return;

  // Clear module-level verifier
  if (recaptchaVerifier) {
    try {
      if (!(recaptchaVerifier as any).destroyed) {
        recaptchaVerifier.clear();
      }
    } catch (e) {
      console.warn('[Firebase Auth] Note clearing recaptchaVerifier:', e);
    }
    recaptchaVerifier = null;
  }

  // Clear window-level verifier if any
  const win = window as any;
  if (win.recaptchaVerifier) {
    try {
      if (!win.recaptchaVerifier.destroyed) {
        win.recaptchaVerifier.clear();
      }
    } catch {
      // Ignore
    }
    win.recaptchaVerifier = null;
  }

  // Clean DOM container: replace with fresh element to strip any grecaptcha internal expando bindings
  const container = document.getElementById(elementId);
  if (container && container.parentNode) {
    const freshNode = document.createElement('div');
    freshNode.id = elementId;
    container.parentNode.replaceChild(freshNode, container);
  } else if (container) {
    container.innerHTML = '';
  }
}

/**
 * Resets the reCAPTCHA challenge response for an active RecaptchaVerifier without destroying it.
 * This allows resending an OTP or retrying without recreating the DOM widget.
 */
export async function resetRecaptchaVerifier(): Promise<void> {
  if (typeof window === 'undefined') return;

  const verifier = recaptchaVerifier || (window as any).recaptchaVerifier;
  if (verifier && !(verifier as any).destroyed) {
    try {
      // If the verifier has a widget ID, ask grecaptcha to reset it
      const widgetId = (verifier as any).widgetId;
      const win = window as any;
      if (typeof widgetId === 'number' && win.grecaptcha?.reset) {
        win.grecaptcha.reset(widgetId);
        console.log('[Firebase Auth] Active reCAPTCHA widget reset successfully');
        return;
      }
      if (typeof (verifier as any)._reset === 'function') {
        (verifier as any)._reset();
        console.log('[Firebase Auth] RecaptchaVerifier _reset called');
        return;
      }
    } catch (err) {
      console.warn('[Firebase Auth] Failed to reset reCAPTCHA widget, performing full teardown:', err);
    }
  }

  // If verifier was missing, destroyed, or reset failed: cleanly tear down
  clearRecaptchaVerifier('recaptcha-container');
}

/**
 * Returns the existing RecaptchaVerifier singleton if valid, or safely initializes a new one.
 * Guarantees that RecaptchaVerifier is initialized only once per session and never rendered
 * into an already populated or bound DOM container.
 */
export function initRecaptchaVerifier(elementId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('Window not available for reCAPTCHA');
  }

  // 1. If an active, non-destroyed instance exists and its container is still in the document, reuse it.
  if (recaptchaVerifier && !(recaptchaVerifier as any).destroyed) {
    const container = document.getElementById(elementId);
    if (container && document.contains(container)) {
      return recaptchaVerifier;
    }
  }

  // Check window instance as fallback
  const win = window as any;
  if (win.recaptchaVerifier && !win.recaptchaVerifier.destroyed) {
    recaptchaVerifier = win.recaptchaVerifier as RecaptchaVerifier;
    return recaptchaVerifier;
  }

  // 2. Otherwise, perform a clean teardown to prevent "reCAPTCHA has already been rendered in this element"
  clearRecaptchaVerifier(elementId);

  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`DOM container #${elementId} not found for reCAPTCHA initialization`);
  }

  // 3. Create fresh RecaptchaVerifier on guaranteed clean container
  const newVerifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase Auth] Invisible reCAPTCHA verified successfully');
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] reCAPTCHA token expired. Resetting.');
      resetRecaptchaVerifier();
    }
  });

  recaptchaVerifier = newVerifier;
  win.recaptchaVerifier = newVerifier;
  return newVerifier;
}

/**
 * Sends real SMS OTP via Firebase Phone Auth.
 * Manages reCAPTCHA lifecycle properly across initial requests, retries, and resends.
 */
export async function sendFirebaseOtp(
  phone: string, 
  verifier?: RecaptchaVerifier
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string }> {
  try {
    const cleanDigits = phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanDigits}`;

    // Use provided verifier or obtain the safe singleton
    let activeVerifier = verifier;
    if (!activeVerifier || (activeVerifier as any).destroyed) {
      activeVerifier = initRecaptchaVerifier('recaptcha-container');
    }

    let confirmationResult: ConfirmationResult;
    try {
      confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, activeVerifier);
    } catch (sendError: any) {
      // Auto-recovery if duplicate render was somehow encountered
      if (sendError?.message && sendError.message.includes('already been rendered')) {
        console.warn('[Firebase Auth] Caught duplicate render error during send. Recovering...');
        clearRecaptchaVerifier('recaptcha-container');
        activeVerifier = initRecaptchaVerifier('recaptcha-container');
        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, activeVerifier);
      } else {
        throw sendError;
      }
    }

    return { success: true, confirmationResult };
  } catch (error: any) {
    console.error('[Firebase Auth] Error sending phone OTP:', error);

    // Reset the challenge on error so the user can try again without duplicate render errors
    await resetRecaptchaVerifier();

    let errorMsg = error.message || 'Failed to send OTP via SMS gateway';
    if (error.code === 'auth/invalid-phone-number') {
      errorMsg = 'कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें (Invalid phone number)';
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = 'अत्यधिक प्रयास किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें (Too many requests. Try later)';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMsg = 'SMS कोटा समाप्त हो गया है। कृपया बाद में प्रयास करें (SMS quota exceeded)';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMsg = 'reCAPTCHA सत्यापन विफल रहा। कृपया पुनः प्रयास करें (reCAPTCHA check failed)';
    }
    return { success: false, error: errorMsg };
  }
}
