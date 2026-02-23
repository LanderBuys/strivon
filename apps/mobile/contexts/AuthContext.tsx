import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithCredential,
  GoogleAuthProvider,
  reload,
  type User,
  type UserCredential,
} from 'firebase/auth';
import Constants from 'expo-constants';
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
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  isGoogleSignInEnabled: boolean;
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

  const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | null | undefined;
  const isExpoGo = Constants.appOwnership === 'expo';
  const isGoogleSignInEnabled = !!auth && !!webClientId && !isExpoGo;

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/c9191bf1-b405-4f89-8e9f-359573d39c96', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '24ea76' },
      body: JSON.stringify({
        sessionId: '24ea76',
        location: 'AuthContext.tsx:AuthProvider',
        message: 'AuthProvider mounted',
        data: { isExpoGo, isGoogleSignInEnabled, hasAuth: !!auth, hasWebClientId: !!webClientId },
        timestamp: Date.now(),
        hypothesisId: 'H1',
      }),
    }).catch(() => {});
  }, [isExpoGo, isGoogleSignInEnabled, auth, webClientId]);
  // #endregion

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Auth not configured');
    if (!webClientId) throw new Error('Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    if (isExpoGo) throw new Error('Google Sign-In is not available in Expo Go. Use a development build.');
    const { GoogleSignin: GS } = require('@react-native-google-signin/google-signin');
    GS.configure({ webClientId });
    const res = await GS.signIn({});
    if (res.type === 'cancelled') throw new Error('Sign-in was cancelled.');
    let idToken = res.data.idToken ?? null;
    if (!idToken) {
      const tokens = await GS.getTokens();
      idToken = tokens.idToken;
    }
    if (!idToken) throw new Error('Could not get Google ID token.');
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  }, [auth, webClientId, isExpoGo]);

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
    await sendEmailVerification(auth.currentUser);
  }, [auth]);

  const reloadUser = useCallback(async () => {
    if (!auth?.currentUser) return;
    await auth.currentUser.getIdToken(true);
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
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    sendVerificationEmail,
    reloadUser,
    isGoogleSignInEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
