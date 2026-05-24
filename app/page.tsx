'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Page() {
  const [authLoading, setAuthLoading] = useState(true);
  const { currentUser, setCurrentUser } = useAppStore();

  useEffect(() => {
    // Firebase resolves auth state from its own persistence (IndexedDB)
    // — no need to manually store the user
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id:   user.uid,
          email: user.email!,
          name:  user.displayName ?? user.email!.split('@')[0],
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [setCurrentUser]);

  if (authLoading) return <LoadingSkeleton />;
  if (!currentUser) return <AuthScreen onAuth={setCurrentUser} />;
  return <Dashboard />;
}
