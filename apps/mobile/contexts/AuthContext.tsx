import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { analyticsService } from '@/lib/services/analyticsService';
import { ensureFirestoreUser } from '@/lib/firestore/users';

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

function mapFirebaseUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email ?? null,
    emailVerified: u.emailVerified,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirebaseEnabled: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isFirebaseEnabled = isFirebaseConfigured();
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const next = firebaseUser ? mapFirebaseUser(firebaseUser) : null;
      setUser(next);
      analyticsService.setUserId(next?.uid ?? null);
      if (firebaseUser) {
        ensureFirestoreUser(
          firebaseUser.uid,
          firebaseUser.email ?? null,
          firebaseUser.displayName ?? null,
          firebaseUser.photoURL ?? null
        ).catch(() => {});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error('Auth not configured');
      return signInWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error('Auth not configured');
      return createUserWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
    setUser(null);
  }, [auth]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!auth) throw new Error('Auth not configured');
      await sendPasswordResetEmail(auth, email);
    },
    [auth]
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!auth?.currentUser) throw new Error('Not signed in');
    await sendEmailVerification(auth.currentUser, {
      url: 'https://strivon-e9ca5.firebaseapp.com',
      handleCodeInApp: false,
    });
  }, [auth]);

  const reloadUser = useCallback(async () => {
    if (!auth?.currentUser) return;
    await reload(auth.currentUser);
    const next = mapFirebaseUser(auth.currentUser);
    setUser(next);
  }, [auth]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isFirebaseEnabled,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    sendVerificationEmail,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
