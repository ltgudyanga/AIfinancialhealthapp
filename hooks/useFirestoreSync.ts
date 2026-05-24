'use client';
import { useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';

export function useFirestoreSync() {
  const store = useAppStore();
  const currentUser = store.currentUser;
  const prevUserId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from Firestore when user changes ────────────────────────────────
  useEffect(() => {
    if (!currentUser) { prevUserId.current = null; return; }
    if (prevUserId.current === currentUser.id) return;
    prevUserId.current = currentUser.id;

    (async () => {
      try {
        const ref = doc(db, 'users', currentUser.id, 'appData', 'main');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          store.loadFromCloud({
            globalTransactions: d.globalTransactions ?? [],
            partners:           d.partners           ?? [],
            plan:               d.plan               ?? store.plan,
            documents:          d.documents          ?? [],
            isSi60Sealed:       d.isSi60Sealed       ?? false,
          });
        } else {
          // Brand-new user — seed with demo data and write it to Firestore
          store.seedDemoData(currentUser.id);
        }
      } catch (err) {
        // Offline or permission error — continue with local data
        console.warn('Firestore load skipped:', err);
        store.setCloudSynced(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ── Save to Firestore (debounced 2 s) via store subscription ─────────────
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (
        !state.cloudSynced ||
        (state.globalTransactions === prev.globalTransactions &&
          state.partners           === prev.partners           &&
          state.plan               === prev.plan               &&
          state.documents          === prev.documents          &&
          state.isSi60Sealed       === prev.isSi60Sealed)
      ) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const s = useAppStore.getState();
          const ref = doc(db, 'users', currentUser.id, 'appData', 'main');
          await setDoc(ref, {
            globalTransactions: s.globalTransactions,
            partners:           s.partners,
            plan:               s.plan,
            documents:          s.documents,
            isSi60Sealed:       s.isSi60Sealed,
            updatedAt:          Date.now(),
          });
        } catch (err) {
          console.warn('Firestore save failed (offline?):', err);
        }
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [currentUser]);
}
