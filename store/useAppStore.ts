import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Transaction, Partner, Plan, ScannedDocument, CurrentUser } from '@/lib/types';

const DEFAULT_PARTNERS: Partner[] = [
  { id: 1, name: 'Tendai Moyo',   email: 'tendai@farm.com', role: 'owner',      status: 'active', joinedAt: '2024-01-15' },
  { id: 2, name: 'Grace Sibanda', email: 'grace@farm.com',  role: 'accountant', status: 'active', joinedAt: '2024-02-01' },
];

export const DEFAULT_PLAN: Plan = {
  opening: 5000, taxRate: 15,
  weeks: Array.from({ length: 13 }, (_, i) => ({
    week: i + 1,
    budgetInflow: '2000', budgetOutflow: '1500',
    actualInflow: i < 4 ? String(2000 + i * 100) : '',
    actualOutflow: i < 4 ? String(1500 + i * 50)  : '',
  })),
};

interface AppState {
  currentUser: CurrentUser | null;
  globalTransactions: Transaction[];
  partners: Partner[];
  plan: Plan;
  documents: ScannedDocument[];
  isSi60Sealed: boolean;
  quickFill: { budgetInflow: string; budgetOutflow: string };
  cloudSynced: boolean;

  // Auth
  setCurrentUser: (u: CurrentUser | null) => void;

  // Transactions
  setGlobalTransactions: (t: Transaction[]) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  clearUserTransactions: (userId: string) => void;

  // Partners
  setPartners: (p: Partner[]) => void;
  addPartner: (p: Partner) => void;

  // Plan
  setPlan: (p: Plan) => void;

  // Documents
  setDocuments: (d: ScannedDocument[]) => void;
  addDocument: (d: ScannedDocument) => void;
  updateDocument: (id: string, patch: Partial<ScannedDocument>) => void;
  removeDocument: (id: string) => void;

  // Misc
  setIsSi60Sealed: (v: boolean) => void;
  setQuickFill: (q: { budgetInflow: string; budgetOutflow: string }) => void;
  setCloudSynced: (v: boolean) => void;

  // Batch load (from Firestore)
  loadFromCloud: (data: Partial<Pick<AppState, 'globalTransactions' | 'partners' | 'plan' | 'documents' | 'isSi60Sealed'>>) => void;

  // Seed demo data for first-time users
  seedDemoData: (userId: string) => void;
}

const safeLocalStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return localStorage;
});

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      globalTransactions: [],
      partners: DEFAULT_PARTNERS,
      plan: DEFAULT_PLAN,
      documents: [],
      isSi60Sealed: false,
      quickFill: { budgetInflow: '', budgetOutflow: '' },
      cloudSynced: false,

      setCurrentUser: (u) => set({ currentUser: u }),

      setGlobalTransactions: (t) => set({ globalTransactions: t }),
      addTransaction: (t) => set((s) => ({ globalTransactions: [t, ...s.globalTransactions] })),
      updateTransaction: (id, patch) =>
        set((s) => ({ globalTransactions: s.globalTransactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTransaction: (id) =>
        set((s) => ({ globalTransactions: s.globalTransactions.filter((t) => t.id !== id) })),
      clearUserTransactions: (userId) =>
        set((s) => ({
          globalTransactions: s.globalTransactions.filter((t) => t.userId !== userId),
          documents: s.documents.map((d) => ({ ...d, isRecorded: false, txId: undefined })),
        })),

      setPartners: (p) => set({ partners: p }),
      addPartner: (p) => set((s) => ({ partners: [...s.partners, p] })),

      setPlan: (p) => set({ plan: p }),

      setDocuments: (d) => set({ documents: d }),
      addDocument: (d) => set((s) => ({ documents: [d, ...s.documents] })),
      updateDocument: (id, patch) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      setIsSi60Sealed: (v) => set({ isSi60Sealed: v }),
      setQuickFill: (q) => set({ quickFill: q }),
      setCloudSynced: (v) => set({ cloudSynced: v }),

      loadFromCloud: (data) => set({ ...data, cloudSynced: true }),

      seedDemoData: (userId) =>
        set({
          globalTransactions: [
            { id: 't1', userId, type: 'inflow',  desc: 'Maize Sales', currency: 'USD', amount_cents: 35000, timestamp: Date.now() - 86400000 * 2 },
            { id: 't2', userId, type: 'outflow', desc: 'Fertilizer',  currency: 'USD', amount_cents: 15000, timestamp: Date.now() - 86400000 * 5 },
            { id: 't3', userId, type: 'inflow',  desc: 'Vegetables',  currency: 'ZiG', amount_cents: 8500,  timestamp: Date.now() - 86400000 },
          ],
          partners: DEFAULT_PARTNERS,
          plan: DEFAULT_PLAN,
          cloudSynced: true,
        }),
    }),
    {
      name: 'omnisight-store-v1',
      storage: safeLocalStorage,
      // Don't persist currentUser or cloudSynced — Firebase/runtime own those
      partialize: (s) => ({
        globalTransactions: s.globalTransactions,
        partners: s.partners,
        plan: s.plan,
        documents: s.documents,
        isSi60Sealed: s.isSi60Sealed,
      }),
    }
  )
);
