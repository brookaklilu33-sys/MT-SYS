import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, fbSignOut } from '../services/firebase';
import { UserProfile, UserRole, Language } from '../types';
import { INITIAL_USERS } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole, shopId?: string) => void;
  isSuperAdmin: boolean;
  hasAccessToShop: (shopId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('moderntech_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('moderntech_lang', lang);
    if (userProfile) {
      setUserProfile((prev) => (prev ? { ...prev, preferredLanguage: lang } : prev));
    }
  };

  // Load active user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          const isBrook = user.email?.toLowerCase() === 'brookaklilu33@gmail.com';

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            if (isBrook && data.role !== 'superadmin') {
              const updatedProfile: UserProfile = {
                ...data,
                role: 'superadmin',
                shopIds: ['adama_main', 'adama', 'hawassa', 'borena', 'bale', 'assela', 'shashemene', 'chiro', 'jemo']
              };
              await setDoc(userDocRef, updatedProfile, { merge: true });
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(data);
              if (data.preferredLanguage) {
                setLanguageState(data.preferredLanguage);
              }
            }
          } else {
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || 'user@moderntechethiopia.com',
              displayName: user.displayName || (isBrook ? 'Brook Aklilu (Superadmin)' : 'Moderntech User'),
              role: isBrook ? 'superadmin' : 'shop_manager',
              shopIds: isBrook
                ? ['adama_main', 'adama', 'hawassa', 'borena', 'bale', 'assela', 'shashemene', 'chiro', 'jemo']
                : ['jemo'],
              status: 'active',
              preferredLanguage: language,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.warn('Could not write new user doc immediately:', err);
            }
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          const isBrook = user.email?.toLowerCase() === 'brookaklilu33@gmail.com';
          setUserProfile({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Moderntech User',
            role: isBrook ? 'superadmin' : 'shop_manager',
            shopIds: isBrook
              ? ['adama_main', 'adama', 'hawassa', 'borena', 'bale', 'assela', 'shashemene', 'chiro', 'jemo']
              : ['jemo'],
            status: 'active',
            preferredLanguage: language
          });
        }
      } else {
        // Fallback default demo account: Brook as superadmin
        const defaultSuperAdmin = INITIAL_USERS[0];
        setUserProfile(defaultSuperAdmin);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUserProfile(INITIAL_USERS[0]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const switchDemoRole = (role: UserRole, shopId?: string) => {
    if (role === 'superadmin') {
      setUserProfile(INITIAL_USERS[0]);
    } else if (shopId === 'jemo') {
      setUserProfile(INITIAL_USERS[1]);
    } else if (shopId === 'adama') {
      setUserProfile(INITIAL_USERS[2]);
    } else if (shopId === 'hawassa') {
      setUserProfile(INITIAL_USERS[3]);
    } else if (shopId === 'chiro') {
      setUserProfile(INITIAL_USERS[4]);
    } else {
      setUserProfile({
        id: `demo-${role}-${shopId || 'custom'}`,
        email: `${role}.${shopId || 'shop'}@moderntechethiopia.com`,
        displayName: `${role.toUpperCase()} - ${shopId || 'General'}`,
        role,
        shopIds: shopId ? [shopId] : ['jemo'],
        status: 'active',
        preferredLanguage: language
      });
    }
  };

  const isSuperAdmin = userProfile?.role === 'superadmin' && userProfile?.status === 'active';

  const hasAccessToShop = (shopId: string): boolean => {
    if (!userProfile || userProfile.status !== 'active') return false;
    if (userProfile.role === 'superadmin') return true;
    return userProfile.shopIds.includes(shopId);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        language,
        setLanguage,
        signInWithGoogle,
        signOut,
        switchDemoRole,
        isSuperAdmin,
        hasAccessToShop
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
