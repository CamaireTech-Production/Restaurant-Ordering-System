import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  ConfirmationResult,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import {
  query as firestoreQuery,
  where as firestoreWhere,
  getDocs as firestoreGetDocs,
  collection as firestoreCollection,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { DemoAccount } from '../types';
import { getNetworkErrorMessage, retryWithNetworkCheck } from '../utils/networkUtils';

interface DemoAuthContextType {
  currentUser: User | null;
  demoAccount: DemoAccount | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, phone: string, extraData?: Partial<DemoAccount>) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithPhone: (phone: string, appVerifier: any) => Promise<ConfirmationResult>;
  signInWithPhoneAndPassword: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDemoAccount: () => Promise<void>;
}

export const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);
export const DemoAuthContextSafe = React.createContext<DemoAuthContextType | undefined>(undefined);

export const useDemoAuth = () => {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  return ctx;
};

export const useDemoAuthSafe = () => useContext(DemoAuthContextSafe);

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

  useEffect(() => {
    if (!currentUser) return;
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        signOut();
      }, 30 * 60 * 1000); // 30 minutes
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [currentUser]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[DemoAuth] signIn start', { email });
      
      const cred = await retryWithNetworkCheck(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });
      
      // Check for demo account
      const demoDocRef = doc(db, 'demoAccounts', cred.user.uid);
      const demoDoc = await retryWithNetworkCheck(async () => {
        return await getDoc(demoDocRef);
      });
      
      if (!demoDoc.exists()) {
        console.error('[DemoAuth] No demo account found for user');
        throw new Error('No demo account found for this user');
      }
      
      const demoData = demoDoc.data();
      const now = new Date();
      if (!demoData.expired && demoData.expiresAt && demoData.active && new Date(demoData.expiresAt) < now) {
        // Expire the account
        await retryWithNetworkCheck(async () => {
          await setDoc(demoDocRef, { active: false, expired: true }, { merge: true });
        });
        await retryWithNetworkCheck(async () => {
          await logActivity({
            userId: cred.user.uid,
            userEmail: email,
            action: 'demo_account_expired_on_login',
            entityType: 'demoAccount',
            entityId: cred.user.uid,
            details: { expiredAt: demoData.expiresAt, expiredBy: 'login' },
          });
        });
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      }
      
      if (demoData.expired) {
        console.error('[DemoAuth] Demo account expired');
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      }
      
      await retryWithNetworkCheck(async () => {
        await logActivity({
          userId: cred.user.uid,
          userEmail: email,
          action: 'demo_login',
          entityType: 'demoAccount',
          entityId: cred.user.uid,
        });
      });
      
      console.log('[DemoAuth] signIn success, navigating to dashboard');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[DemoAuth] signIn error', error);
      
      // Enhance error message for better user experience
      if (error.message === 'No demo account found for this user') {
        throw new Error('No demo account found for this user');
      } else if (error.message === 'EXPIRED_DEMO_ACCOUNT') {
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      } else {
        // Use network-aware error message
        const enhancedError = new Error(getNetworkErrorMessage(error));
        (enhancedError as any).code = error.code;
        throw enhancedError;
      }
    }
  };

  const signUp = async (email: string, password: string, phone: string, extraData?: Partial<DemoAccount>) => {
    try {
      console.log('[DemoAuth] signUp start', { email, phone });
      
      // Check for existing demo account by email
      const q = firestoreQuery;
      const where = firestoreWhere;
      const getDocs = firestoreGetDocs;
      const collection = firestoreCollection;
      
      const snapshot = await retryWithNetworkCheck(async () => {
        const dbRef = collection(db, 'demoAccounts');
        const emailQuery = q(dbRef, where('email', '==', email));
        return await getDocs(emailQuery);
      });
      
      if (!snapshot.empty) {
        // If a demo account with this email exists, throw error
        throw new Error('DEMO_EMAIL_EXISTS');
      } else {
        if (auth.currentUser) {
          // User is signed in with Google, link password
          console.log('[DemoAuth] No existing demo account, user is signed in, linking password');
          
          if (!auth.currentUser?.providerData.map(p => p.providerId) || !auth.currentUser?.providerData.map(p => p.providerId).includes('password')) {
            await retryWithNetworkCheck(async () => {
              if (auth.currentUser) {
                await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password));
              }
            });
          } else {
            console.log('[DemoAuth] Password provider already linked, skipping linkWithCredential');
          }
          
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          
          await retryWithNetworkCheck(async () => {
            if (auth.currentUser) {
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
                ...extraData,
              });
            }
          });
          
          console.log('[DemoAuth] Logging activity for demo_signup_google_linked');
          await retryWithNetworkCheck(async () => {
            if (auth.currentUser) {
              await logActivity({
                userId: auth.currentUser.uid,
                userEmail: email,
                action: 'demo_signup_google_linked',
                entityType: 'demoAccount',
                entityId: null,
              });
            }
          });
        } else {
          // No user signed in, create new account (should not happen in Google flow)
          console.log('[DemoAuth] No existing demo account, creating new');
          const userCredential = await retryWithNetworkCheck(async () => {
            return await createUserWithEmailAndPassword(auth, email, password);
          });
          
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          
          await retryWithNetworkCheck(async () => {
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
              ...extraData,
            });
          });
          
          console.log('[DemoAuth] Logging activity for demo_signup');
          await retryWithNetworkCheck(async () => {
            await logActivity({
              userId: userCredential.user.uid,
              userEmail: email,
              action: 'demo_signup',
              entityType: 'demoAccount',
            });
          });
        }
      }
      console.log('[DemoAuth] Signup complete, navigating to dashboard');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[DemoAuth] signUp error', error);
      
      // Enhance error message for better user experience
      if (error.message === 'DEMO_EMAIL_EXISTS') {
        throw new Error('DEMO_EMAIL_EXISTS');
      } else {
        // Use network-aware error message
        const enhancedError = new Error(getNetworkErrorMessage(error));
        (enhancedError as any).code = error.code;
        throw enhancedError;
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[DemoAuth] signInWithGoogle start');
      const provider = new GoogleAuthProvider();
      const userCredential = await retryWithNetworkCheck(async () => {
        return await signInWithPopup(auth, provider);
      });
      const email = userCredential.user.email;
      if (!email) throw new Error('No email found from Google account');
      
      // Check for demo account
      const demoDocRef = doc(db, 'demoAccounts', userCredential.user.uid);
      const demoDoc = await retryWithNetworkCheck(async () => {
        return await getDoc(demoDocRef);
      });
      
      if (!demoDoc.exists()) {
        console.error('[DemoAuth] No demo account found for user after Google sign-in');
        throw new Error('No demo account found for this user');
      }
      
      const demoData = demoDoc.data();
      const now = new Date();
      if (!demoData.expired && demoData.expiresAt && demoData.active && new Date(demoData.expiresAt) < now) {
        // Expire the account
        await retryWithNetworkCheck(async () => {
          await setDoc(demoDocRef, { active: false, expired: true }, { merge: true });
        });
        await retryWithNetworkCheck(async () => {
          await logActivity({
            userId: userCredential.user.uid,
            userEmail: email,
            action: 'demo_account_expired_on_login',
            entityType: 'demoAccount',
            entityId: userCredential.user.uid,
            details: { expiredAt: demoData.expiresAt, expiredBy: 'login' },
          });
        });
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      }
      
      if (demoData.expired) {
        console.error('[DemoAuth] Demo account expired');
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      }
      
      await retryWithNetworkCheck(async () => {
        await logActivity({
          userId: userCredential.user.uid,
          userEmail: email,
          action: 'demo_login_google',
          entityType: 'demoAccount',
          entityId: userCredential.user.uid,
        });
      });
      
      console.log('[DemoAuth] signInWithGoogle success, navigating to dashboard');
      navigate('/dashboard');
      return userCredential.user;
    } catch (error: any) {
      console.error('[DemoAuth] signInWithGoogle error', error);
      
      // Enhance error message for better user experience
      if (error.message === 'No demo account found for this user') {
        throw new Error('No demo account found for this user');
      } else if (error.message === 'EXPIRED_DEMO_ACCOUNT') {
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      } else {
        // Use network-aware error message
        const enhancedError = new Error(getNetworkErrorMessage(error));
        (enhancedError as any).code = error.code;
        throw enhancedError;
      }
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
      const q = firestoreQuery;
      const where = firestoreWhere;
      const getDocs = firestoreGetDocs;
      const collection = firestoreCollection;
      
      const snapshot = await retryWithNetworkCheck(async () => {
        const dbRef = collection(db, 'demoAccounts');
        const phoneQuery = q(dbRef, where('phone', '==', phone));
        return await getDocs(phoneQuery);
      });
      
      if (snapshot.empty) {
        console.error('[DemoAuth] No demo account found with this phone number');
        throw new Error('No demo account found with this phone number');
      }
      
      const docData = snapshot.docs[0].data();
      const email = docData.email;
      
      const cred = await retryWithNetworkCheck(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });
      
      const demoDocRef = doc(db, 'demoAccounts', cred.user.uid);
      const demoDoc = await retryWithNetworkCheck(async () => {
        return await getDoc(demoDocRef);
      });
      
      if (!demoDoc.exists()) {
        console.error('[DemoAuth] No demo account found for user after phone login');
        throw new Error('No demo account found for this user');
      }
      
      const demoData = demoDoc.data();
      const now = new Date();
      if (demoData && !demoData.expired && demoData.expiresAt && demoData.active && new Date(demoData.expiresAt) < now) {
        // Expire the account
        await retryWithNetworkCheck(async () => {
          await setDoc(demoDocRef, { active: false, expired: true }, { merge: true });
        });
        await retryWithNetworkCheck(async () => {
          await logActivity({
            userId: cred.user.uid,
            userEmail: email,
            action: 'demo_account_expired_on_login',
            entityType: 'demoAccount',
            entityId: cred.user.uid,
            details: { expiredAt: demoData.expiresAt, expiredBy: 'login' },
          });
        });
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      }
      
      if (demoData && demoData.expired) {
        console.error('[DemoAuth] Demo account expired');
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      }
      
      await retryWithNetworkCheck(async () => {
        await logActivity({
          userId: cred.user.uid,
          userEmail: email,
          action: 'demo_login_phone_password',
          entityType: 'demoAccount',
          entityId: cred.user.uid,
        });
      });
      
      console.log('[DemoAuth] signInWithPhoneAndPassword success, navigating to dashboard');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[DemoAuth] signInWithPhoneAndPassword error', error);
      
      // Enhance error message for better user experience
      if (error.message === 'No demo account found with this phone number') {
        throw new Error('No demo account found with this phone number');
      } else if (error.message === 'No demo account found for this user') {
        throw new Error('No demo account found for this user');
      } else if (error.message === 'EXPIRED_DEMO_ACCOUNT') {
        throw new Error('EXPIRED_DEMO_ACCOUNT');
      } else {
        // Use network-aware error message
        const enhancedError = new Error(getNetworkErrorMessage(error));
        (enhancedError as any).code = error.code;
        throw enhancedError;
      }
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
      // Hard redirect to demo-login to prevent dashboard flash
      window.location.replace('/demo-login');
    } catch (error) {
      throw error;
    }
  };

  // Add a method to refresh the demoAccount from Firestore
  const refreshDemoAccount = async () => {
    if (!currentUser) return;
    try {
      const demoDoc = await getDoc(doc(db, 'demoAccounts', currentUser.uid));
      if (demoDoc.exists()) {
        setDemoAccount({ id: demoDoc.id, ...demoDoc.data() } as DemoAccount);
      }
    } catch (error) {
      // Optionally handle error
    }
  };

  const contextValue = {
    currentUser,
    demoAccount,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    signInWithPhoneAndPassword,
    signOut,
    refreshDemoAccount,
  };

  return (
    <DemoAuthContext.Provider value={contextValue}>
      <DemoAuthContextSafe.Provider value={contextValue}>
        {!loading && children}
      </DemoAuthContextSafe.Provider>
    </DemoAuthContext.Provider>
  );
};

export const useIsDemoUser = () => {
  const { demoAccount, loading } = useDemoAuth();
  return !loading && !!demoAccount;
}; 