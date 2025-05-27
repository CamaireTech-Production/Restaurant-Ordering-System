import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let analytics: any = undefined;

// Only load dotenv in Node.js (not in browser)
let env: any = {};
if (typeof process !== 'undefined' && process.env && !('VITE_FIREBASE_API_KEY' in process.env)) {
  // Use dynamic import for dotenv in ESM
  const dotenvModule = await import('dotenv');
  dotenvModule.config();
  env = process.env;
} else if (typeof import.meta !== 'undefined' && import.meta.env) {
  env = import.meta.env;
}

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Only initialize analytics in the browser
if (typeof window !== 'undefined') {
  const { getAnalytics } = await import('firebase/analytics');
  analytics = getAnalytics(app);
}
export { analytics };