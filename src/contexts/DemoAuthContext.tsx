import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  ConfirmationResult,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';

// Demo account type
type DemoAccount = {
  id: string;
  email: string;
  phone: string;
  createdAt: any;
  expiresAt: any;
  active: boolean;
  expired: boolean;
  name: string;
  logo: string;
  colorPalette: {
    primary: string;
    secondary: string;
  };
};

interface DemoAuthContextType {
  currentUser: User | null;
  demoAccount: DemoAccount | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, phone: string) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithPhone: (phone: string, appVerifier: any) => Promise<ConfirmationResult>;
  signInWithPhoneAndPassword: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
};

export const DemoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch demo account data
        try {
          const demoDoc = await getDoc(doc(db, 'demoAccounts', user.uid));
          if (demoDoc.exists()) {
            setDemoAccount({ id: demoDoc.id, ...demoDoc.data() } as DemoAccount);
          } else {
            setDemoAccount(null);
          }
        } catch (error) {
          setDemoAccount(null);
        }
      } else {
        setDemoAccount(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[DemoAuth] signIn start', { email });
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Check for demo account
      const demoDoc = await getDoc(doc(db, 'demoAccounts', cred.user.uid));
      if (!demoDoc.exists()) {
        console.error('[DemoAuth] No demo account found for user');
        throw new Error('No demo account found for this user');
      }
      const demoData = demoDoc.data();
      if (demoData.expired) {
        console.error('[DemoAuth] Demo account expired');
        throw new Error('Demo account expired');
      }
      await logActivity({
        userId: cred.user.uid,
        userEmail: email,
        action: 'demo_login',
        entityType: 'demoAccount',
        entityId: cred.user.uid,
      });
      console.log('[DemoAuth] signIn success, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('[DemoAuth] signIn error', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, phone: string) => {
    try {
      console.log('[DemoAuth] signUp start', { email, phone });
      // Check for existing demo account by email
      const q = await import('firebase/firestore').then(firestore => firestore.query);
      const where = await import('firebase/firestore').then(firestore => firestore.where);
      const getDocs = await import('firebase/firestore').then(firestore => firestore.getDocs);
      const collection = await import('firebase/firestore').then(firestore => firestore.collection);
      const dbRef = collection(db, 'demoAccounts');
      const emailQuery = q(dbRef, where('email', '==', email));
      const snapshot = await getDocs(emailQuery);
      let docId;
      if (!snapshot.empty) {
        docId = snapshot.docs[0].id;
        console.log('[DemoAuth] Existing demo account found, docId:', docId);
        // Link password to Google account if not already linked
        try {
          console.log('[DemoAuth] Attempting signInWithEmailAndPassword for password link check');
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
          console.log('[DemoAuth] Linking password to Google account', err);
          const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
          const credential = EmailAuthProvider.credential(email, password);
          const providers = auth.currentUser?.providerData.map(p => p.providerId);
          if (!providers || !providers.includes('password')) {
            await linkWithCredential(auth.currentUser!, credential);
          } else {
            console.log('[DemoAuth] Password provider already linked, skipping linkWithCredential');
          }
        }
        console.log('[DemoAuth] Updating demo account document');
        await setDoc(doc(db, 'demoAccounts', docId), {
          email,
          phone,
          updatedAt: serverTimestamp(),
          active: true,
          expired: false,
          name: 'Camairetech',
          logo: '/public/icons/icon-192x192.png',
          colorPalette: {
            primary: '#1D4ED8',
            secondary: '#F59E42',
          },
        }, { merge: true });
        console.log('[DemoAuth] Logging activity for demo_signup_update');
        await logActivity({
          userId: docId,
          userEmail: email,
          action: 'demo_signup_update',
          entityType: 'demoAccount',
        });
      } else {
        if (auth.currentUser) {
          // User is signed in with Google, link password
          console.log('[DemoAuth] No existing demo account, user is signed in, linking password');
          const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
          const credential = EmailAuthProvider.credential(email, password);
          const providers = auth.currentUser?.providerData.map(p => p.providerId);
          if (!providers || !providers.includes('password')) {
            await linkWithCredential(auth.currentUser, credential);
          } else {
            console.log('[DemoAuth] Password provider already linked, skipping linkWithCredential');
          }
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          await setDoc(doc(db, 'demoAccounts', auth.currentUser.uid), {
            email,
            phone,
            createdAt: serverTimestamp(),
            expiresAt,
            active: true,
            expired: false,
            name: 'Camairetech',
            logo: '/public/icons/icon-192x192.png',
            colorPalette: {
              primary: '#1D4ED8',
              secondary: '#F59E42',
            },
          });
          console.log('[DemoAuth] Logging activity for demo_signup_google_linked');
          await logActivity({
            userId: auth.currentUser.uid,
            userEmail: email,
            action: 'demo_signup_google_linked',
            entityType: 'demoAccount',
            entityId: null,
          });
        } else {
          // No user signed in, create new account (should not happen in Google flow)
          console.log('[DemoAuth] No existing demo account, creating new');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          await setDoc(doc(db, 'demoAccounts', userCredential.user.uid), {
            email,
            phone,
            createdAt: serverTimestamp(),
            expiresAt,
            active: true,
            expired: false,
            name: 'Camairetech',
            logo: '/public/icons/icon-192x192.png',
            colorPalette: {
              primary: '#1D4ED8',
              secondary: '#F59E42',
            },
          });
          console.log('[DemoAuth] Logging activity for demo_signup');
          await logActivity({
            userId: userCredential.user.uid,
            userEmail: email,
            action: 'demo_signup',
            entityType: 'demoAccount',
          });
        }
      }
      console.log('[DemoAuth] Signup complete, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('[DemoAuth] signUp error', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[DemoAuth] signInWithGoogle start');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const email = userCredential.user.email;
      if (!email) throw new Error('No email found from Google account');
      // Check for demo account
      const demoDoc = await getDoc(doc(db, 'demoAccounts', userCredential.user.uid));
      if (!demoDoc.exists()) {
        console.error('[DemoAuth] No demo account found for user after Google sign-in');
        throw new Error('No demo account found for this user');
      }
      const demoData = demoDoc.data();
      if (demoData.expired) {
        console.error('[DemoAuth] Demo account expired');
        throw new Error('Demo account expired');
      }
      await logActivity({
        userId: userCredential.user.uid,
        userEmail: email,
        action: 'demo_login_google',
        entityType: 'demoAccount',
        entityId: userCredential.user.uid,
      });
      console.log('[DemoAuth] signInWithGoogle success, navigating to dashboard');
      navigate('/dashboard');
      return userCredential.user;
    } catch (error) {
      console.error('[DemoAuth] signInWithGoogle error', error);
      throw error;
    }
  };

  // Phone auth (requires appVerifier from reCAPTCHA)
  const signInWithPhone = async (phone: string, appVerifier: any) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      // The confirmationResult.confirm(code) should be called in the UI after user enters the code
      await logActivity({
        userId: currentUser?.uid,
        userEmail: phone,
        action: 'demo_login_phone',
        entityType: 'demoAccount',
      });
      return confirmationResult;
    } catch (error) {
      throw error;
    }
  };

  const signInWithPhoneAndPassword = async (phone: string, password: string) => {
    try {
      console.log('[DemoAuth] signInWithPhoneAndPassword start', { phone });
      // Look up demo account by phone number
      const q = await import('firebase/firestore').then(firestore => firestore.query);
      const where = await import('firebase/firestore').then(firestore => firestore.where);
      const getDocs = await import('firebase/firestore').then(firestore => firestore.getDocs);
      const collection = await import('firebase/firestore').then(firestore => firestore.collection);
      const dbRef = collection(db, 'demoAccounts');
      const phoneQuery = q(dbRef, where('phone', '==', phone));
      const snapshot = await getDocs(phoneQuery);
      if (snapshot.empty) {
        console.error('[DemoAuth] No demo account found with this phone number');
        throw new Error('No demo account found with this phone number');
      }
      const docData = snapshot.docs[0].data();
      const email = docData.email;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (docData.expired) {
        console.error('[DemoAuth] Demo account expired');
        throw new Error('Demo account expired');
      }
      await logActivity({
        userId: cred.user.uid,
        userEmail: email,
        action: 'demo_login_phone_password',
        entityType: 'demoAccount',
        entityId: cred.user.uid,
      });
      console.log('[DemoAuth] signInWithPhoneAndPassword success, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('[DemoAuth] signInWithPhoneAndPassword error', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await logActivity({
        userId: currentUser?.uid,
        userEmail: currentUser?.email || '',
        action: 'demo_logout',
        entityType: 'demoAccount',
      });
      navigate('/demo-login');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    demoAccount,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    signInWithPhoneAndPassword,
    signOut,
  };

  return (
    <DemoAuthContext.Provider value={value}>
      {!loading && children}
    </DemoAuthContext.Provider>
  );
};

export const useIsDemoUser = () => {
  const { demoAccount, loading } = useDemoAuth();
  return !loading && !!demoAccount;
}; 