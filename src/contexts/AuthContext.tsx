import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';

// Define types
type Restaurant = {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  description?: string;
  email: string;
  phone?: string;
  createdAt: any;
  colorPalette?: {
    primary: string;
    secondary: string;
  };
};

interface AuthContextType {
  currentUser: User | null;
  restaurant: Restaurant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, extraData?: Partial<Restaurant>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateRestaurantProfile: (restaurantData: Partial<Restaurant>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch restaurant data
        try {
          const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
          if (restaurantDoc.exists()) {
            setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant);
          }
        } catch (error) {
          console.error('Error fetching restaurant data:', error);
        }
      } else {
        setRestaurant(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await logActivity({
        userId: cred.user.uid,
        userEmail: email,
        action: 'login',
        entityType: 'restaurant',
      });
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, extraData?: Partial<Restaurant>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'restaurants', userCredential.user.uid), {
        email,
        createdAt: serverTimestamp(),
        ...(extraData || {})
      });
      await logActivity({
        userId: userCredential.user.uid,
        userEmail: email,
        action: 'signup',
        entityType: 'restaurant',
      });
      navigate('/profile-setup');
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const restaurantDoc = await getDoc(doc(db, 'restaurants', userCredential.user.uid));
      if (!restaurantDoc.exists()) {
        await setDoc(doc(db, 'restaurants', userCredential.user.uid), {
          email: userCredential.user.email,
          name: userCredential.user.displayName || '',
          createdAt: serverTimestamp()
        });
        await logActivity({
          userId: userCredential.user.uid,
          userEmail: userCredential.user.email || '',
          action: 'signup_google',
          entityType: 'restaurant',
        });
        navigate('/profile-setup');
      } else {
        await logActivity({
          userId: userCredential.user.uid,
          userEmail: userCredential.user.email || '',
          action: 'login_google',
          entityType: 'restaurant',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const user = auth.currentUser;
      await firebaseSignOut(auth);
      if (user) {
        await logActivity({
          userId: user.uid,
          userEmail: user.email || '',
          action: 'logout',
          entityType: 'restaurant',
        });
      }
      navigate('/login');
    } catch (error) {
      throw error;
    }
  };

  const updateRestaurantProfile = async (restaurantData: Partial<Restaurant>) => {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      await setDoc(doc(db, 'restaurants', currentUser.uid), {
        ...restaurantData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update local state
      if (restaurant) {
        setRestaurant({
          ...restaurant,
          ...restaurantData
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    restaurant,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateRestaurantProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};