"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  reload,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

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
      if (firebaseUser && typeof window !== "undefined") {
        const { ensureFirestoreUser } = await import("@/lib/firestore/users");
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
      if (!auth) throw new Error("Auth not configured");
      return signInWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error("Auth not configured");
      return createUserWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error("Auth not configured");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }, [auth]);

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
  }, [auth]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!auth) throw new Error("Auth not configured");
      await sendPasswordResetEmail(auth, email);
    },
    [auth]
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Not signed in");
    await sendEmailVerification(auth.currentUser);
  }, [auth]);

  const reloadUser = useCallback(async () => {
    if (!auth?.currentUser) return;
    await reload(auth.currentUser);
    setUser(mapFirebaseUser(auth.currentUser));
  }, [auth]);

  const isGoogleSignInEnabled = !!auth;

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

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
