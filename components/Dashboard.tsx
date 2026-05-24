'use client';
import { useState, useEffect, useMemo } from 'react';
import { BrainCircuit, Eye, Power, Cloud, CloudOff } from 'lucide-react';

import { useAppStore } from '@/store/useAppStore';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { RuralFinancialAdvisor } from '@/lib/advisor';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav from '@/components/BottomNav';
import AddPartnerModal from '@/components/modals/AddPartnerModal';
import PostDocModal from '@/components/modals/PostDocModal';
import VerifyScanModal from '@/components/modals/VerifyScanModal';
import JournalTab from '@/components/tabs/JournalTab';
import PlannerTab from '@/components/tabs/PlannerTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import SI60Tab from '@/components/tabs/SI60Tab';
import VaultTab from '@/components/tabs/VaultTab';
import PartnersTab from '@/components/tabs/PartnersTab';

import type {
  Transaction, Metrics, PlannerMetrics, AIAnalysis,
  TxForm, ThemeColors, ExtractedData, ScannedDocument, TabId, ScanVerifyState,
} from '@/lib/types';

const ZIG_RATE   = 28.5;
const SI60_RATE  = 2498.7242;
const advisor    = new RuralFinancialAdvisor();

const TAB_LIST = [
  { id: 'journal'   as TabId, label: 'Daily Journal',  icon: '📒' },
  { id: 'planner'   as TabId, label: 'Budget Planner', icon: '📅' },
  { id: 'analytics' as TabId, label: 'AI Analytics',   icon: '📈' },
  { id: 'si60'      as TabId, label: 'SI-60 Audit',    icon: '🛡️' },
  { id: 'vault'     as TabId, label: 'Smart Vault',    icon: '🗄️' },
  { id: 'partners'  as TabId, label: 'Partners',       icon: '👥' },
];

function getTheme(grade: string): ThemeColors {
  switch (grade) {
    case 'A': return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', card: 'border-emerald-500' };
    case 'B': return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   card: 'border-amber-500'   };
    case 'C': return { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  card: 'border-orange-500'  };
    case 'D': return { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    card: 'border-rose-500'    };
    default:  return { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    card: 'border-blue-500'    };
  }
}

export default function Dashboard() {
  // ── Store ─────────────────────────────────────────────────────────────────
  const {
  currentUser: currentUserRaw,
  globalTransactions, addTransaction, updateTransaction, removeTransaction, clearUserTransactions,
  partners, setPartners, addPartner,
  plan, setPlan,
  documents, addDocument, updateDocument, removeDocument,
  isSi60Sealed, setIsSi60Sealed,
  quickFill, setQuickFill,
  cloudSynced,
} = useAppStore();

useFirestoreSync();

// ── Check authentication before declaring hooks/state dependent on user data ─
if (!currentUserRaw) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <p className="font-mono text-xs text-blue-400 animate-pulse">
        Loading session configurations...
      </p>
    </div>
  );
}

// Safely cast now that the null check guard has executed successfully
const currentUser = currentUserRaw;

  useFirestoreSync();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('journal');
  const [txForm, setTxForm] = useState<TxForm>({
    type: 'inflow', desc: '', currency: 'USD', amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [docToPost, setDocToPost] = useState<ScannedDocument | null>(null);
  const [scanVerify, setScanVerify] = useState<ScanVerifyState | null>(null);
  const [si60Data, setSi60Data] = useState({ cash: 50000, inventory: 12000, receivables: 8500 });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'scanning' | 'verify' | 'done' | null>(null);
  const [scanLog, setScanLog] = useState('');

  // ── Derived ───────────────────────────────────────────────────────────────
  const isViewer = useMemo(() => {
  if (currentUser.email === 'viewer@farm.com') return true;
  const record = partners.find(p => p.email === currentUser.email);
  return record?.role === 'viewer';
}, [currentUser, partners]);

  const userTransactions = useMemo(
    () => globalTransactions.filter(t => t.userId === currentUser.id).sort((a, b) => b.timestamp - a.timestamp),
    [globalTransactions, currentUser.id],
  );

  const metrics: Metrics = useMemo(() => {
    const sum = (filter: (t: Transaction) => boolean) =>
      userTransactions.filter(filter).reduce((a, t) => a + t.amount_cents, 0);
    const usdIn  = sum(t => t.currency === 'USD' && t.type === 'inflow');
    const usdOut = sum(t => t.currency === 'USD' && t.type === 'outflow');
    const zigIn  = sum(t => t.currency === 'ZiG' && t.type === 'inflow');
    const zigOut = sum(t => t.currency === 'ZiG' && t.type === 'outflow');
    const totalInUSD  = usdIn  / 100 + zigIn  / 100 / ZIG_RATE;
    const totalOutUSD = usdOut / 100 + zigOut / 100 / ZIG_RATE;
    const ratio = totalOutUSD === 0 ? (totalInUSD > 0 ? 3 : 0) : totalInUSD / totalOutUSD;
    return {
      usdIn: usdIn / 100, usdOut: usdOut / 100,
      zigIn: zigIn / 100, zigOut: zigOut / 100,
      totalInUSD, totalOutUSD,
      usdNet: (usdIn - usdOut) / 100, zigNet: (zigIn - zigOut) / 100,
      ratio,
      status: ratio >= 1.5 ? 'OPTIMAL' : ratio >= 1.0 ? 'WARNING' : 'CRITICAL',
    };
  }, [userTransactions]);

  const plannerMetrics: PlannerMetrics = useMemo(() => {
    let balance = parseFloat(String(plan.opening || 0));
    let totalTax = 0, crashWeek: number | null = null;
    const weeksMapped = plan.weeks.map(w => {
      const aIn  = parseFloat(w.actualInflow  || '0');
      const aOut = parseFloat(w.actualOutflow || '0');
      const bIn  = parseFloat(w.budgetInflow  || '0');
      const bOut = parseFloat(w.budgetOutflow || '0');
      const actualNet = aIn - aOut;
      const weekTax = actualNet > 0 ? actualNet * (plan.taxRate / 100) : 0;
      totalTax += weekTax;
      balance  += actualNet - weekTax;
      if (balance < 0 && !crashWeek) crashWeek = w.week;
      return { week: w.week, balance, tax: weekTax, variance: actualNet - (bIn - bOut), budgetNet: bIn - bOut, actualNet };
    });
    return { weeksMapped, finalBalance: balance, totalTax, crashWeek };
  }, [plan]);

  const budgetAnalysis = useMemo(
    () => advisor.analyzeBudgetFeasibility(plan, plannerMetrics),
    [plan, plannerMetrics],
  );

  const scanReport = useMemo(() => {
    const unrecorded = documents.filter(d => !d.isRecorded);
    return {
      unrecorded: unrecorded.length,
      pendingUSD: unrecorded.filter(d => d.extractedData?.currency === 'USD').reduce((a, d) => a + parseFloat(d.extractedData.amount), 0),
      pendingZiG: unrecorded.filter(d => d.extractedData?.currency === 'ZiG').reduce((a, d) => a + parseFloat(d.extractedData.amount), 0),
    };
  }, [documents]);

  const si60Total   = Object.values(si60Data).reduce((a, v) => a + (parseFloat(String(v)) || 0), 0);
  const convertedZiG = si60Total / SI60_RATE;
  const healthGrade  = aiAnalysis?.health?.grade ?? '?';
  const theme        = getTheme(healthGrade);

  useEffect(() => {
    if (userTransactions.length > 0) setAiAnalysis(advisor.analyzeFinBERT(userTransactions, metrics));
  }, [userTransactions, metrics]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || isViewer) return;
    addTransaction({
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      type: txForm.type, desc: txForm.desc, currency: txForm.currency,
      amount_cents: Math.round(parseFloat(txForm.amount) * 100),
      timestamp: new Date(txForm.date).getTime() + Math.floor(Math.random() * 10000),
    });
    setTxForm({ type: 'inflow', desc: '', currency: 'USD', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleClearJournal = () => {
    if (isViewer) return;
    if (!window.confirm('Clear all your journal entries? This cannot be undone.')) return;
    clearUserTransactions(currentUser.id);
  };

  const handleQuickFill = () => {
    if (isViewer) return;
    setPlan({
      ...plan,
      weeks: plan.weeks.map(w => ({
        ...w,
        budgetInflow:  quickFill.budgetInflow  || w.budgetInflow,
        budgetOutflow: quickFill.budgetOutflow || w.budgetOutflow,
      })),
    });
  };

  const resetPlan = () => {
    if (isViewer) return;
    setPlan({ opening: 5000, taxRate: 15, weeks: Array.from({ length: 13 }, (_, i) => ({ week: i + 1, budgetInflow: '2000', budgetOutflow: '1500', actualInflow: '', actualOutflow: '' })) });
    setQuickFill({ budgetInflow: '', budgetOutflow: '' });
  };

  const confirmPostToJournal = (doc: ScannedDocument, type: 'inflow' | 'outflow') => {
    if (isViewer) return;
    const newTx: Transaction = {
      id: 'tx-' + Date.now(), userId: currentUser.id,
      type, desc: `Scanned: ${doc.name}`,
      currency: doc.extractedData.currency,
      amount_cents: Math.round(parseFloat(doc.extractedData.amount) * 100),
      timestamp: Date.now(), sourceDocId: doc.id,
    };
    addTransaction(newTx);
    updateDocument(doc.id, { isRecorded: true, txId: newTx.id });
    setDocToPost(null);
  };

  const handleDeleteDoc = (id: string) => {
    if (isViewer) return;
    if (!window.confirm('Remove this document from the vault?')) return;
    removeDocument(id);
  };

  const handleSealSi60 = () => {
    if (isViewer || isSi60Sealed) return;
    if (window.confirm('WARNING: Sealing the SI-60 Declaration is permanent. Proceed?')) setIsSi60Sealed(true);
  };

  // Real OCR via Tesseract.js (dynamically imported)
  const processFile = async (file: File) => {
    if (!file || isViewer) return;
    setUploadStatus('scanning');
    setScanLog('Loading OCR engine...');

    try {
      const Tesseract = (await import('tesseract.js')).default;
      setScanLog('Scanning document...');
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text')
            setScanLog(`Scanning... ${(m.progress * 100).toFixed(0)}%`);
        },
      });

      // Extract the largest number (likely the total amount)
      const matches = text.match(/\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?/g) ?? [];
      const amounts = matches.map(m => parseFloat(m.replace(/[,\s]/g, ''))).filter(Boolean);
      const suggested = amounts.length > 0 ? Math.max(...amounts).toFixed(2) : '';

      setScanLog(suggested ? `Detected amount: ${suggested} — please verify below.` : 'No amount detected — please enter manually.');
      setUploadStatus('verify');
      setScanVerify({ file, suggestedAmount: suggested });
    } catch {
      setScanLog('OCR unavailable — please enter amount manually.');
      setUploadStatus('verify');
      setScanVerify({ file, suggestedAmount: '' });
    }
  };

  const handleVerifyConfirm = (extractedData: ExtractedData) => {
    if (!scanVerify) return;
    addDocument({
      id: 'doc-' + Date.now(),
      name: scanVerify.file.name,
      size: (scanVerify.file.size / 1024).toFixed(1) + ' KB',
      type: scanVerify.file.name.split('.').pop()?.toUpperCase() ?? 'DOC',
      date: new Date().toLocaleDateString(),
      extractedData, status: 'Verified', isRecorded: false,
    });
    setUploadStatus('done');
    setScanLog(`Verified: ${extractedData.currency} ${extractedData.amount}`);
    setScanVerify(null);
    setTimeout(() => setUploadStatus(null), 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      {/* Modals */}
      {showPartnerModal && (
        <AddPartnerModal onClose={() => setShowPartnerModal(false)} onAdd={(p) => { addPartner(p); setShowPartnerModal(false); }} />
      )}
      {docToPost && (
        <PostDocModal doc={docToPost} onClose={() => setDocToPost(null)} onConfirm={confirmPostToJournal} />
      )}
      {scanVerify && (
        <VerifyScanModal
          file={scanVerify.file}
          suggestedAmount={scanVerify.suggestedAmount}
          onClose={() => { setScanVerify(null); setUploadStatus(null); setScanLog(''); }}
          onConfirm={handleVerifyConfirm}
        />
      )}

      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-blue-500/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-2xl text-white">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="font-display font-black text-base sm:text-lg text-white leading-none flex items-center gap-2 flex-wrap">
                OmniSight
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${theme.bg} ${theme.text} border ${theme.border}`}>
                  Grade {healthGrade}
                </span>
                {isViewer && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Eye size={10} /> VIEWER
                  </span>
                )}
                <span title={cloudSynced ? 'Cloud synced' : 'Syncing...'} className="cursor-default">
                  {cloudSynced
                    ? <Cloud size={12} className="text-emerald-400 opacity-70" />
                    : <CloudOff size={12} className="text-amber-400 animate-pulse" />
                  }
                </span>
              </h1>
              <p className="font-mono text-[9px] text-blue-300 uppercase tracking-widest mt-0.5 hidden sm:block">
                {currentUser.name || currentUser.email} • {partners.length} Partners
              </p>
            </div>
          </div>

          {/* Tab nav — hidden on mobile (BottomNav handles it) */}
          <nav className="hidden sm:flex gap-1 bg-blue-900/30 p-1 rounded-2xl border border-blue-500/20 overflow-x-auto">
            {TAB_LIST.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-300 hover:bg-blue-800/50'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <button onClick={() => { useAppStore.getState().setCurrentUser(null); }}
            className="text-rose-400 hover:text-rose-300 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 shrink-0">
            <Power size={14} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6">
        <ErrorBoundary>
          {activeTab === 'journal' && (
            <JournalTab
              userTransactions={userTransactions}
              txForm={txForm} setTxForm={setTxForm}
              handleAddTx={handleAddTx}
              handleClearJournal={handleClearJournal}
              isViewer={isViewer}
              aiAnalysis={aiAnalysis}
              metrics={metrics}
              theme={theme}
            />
          )}
          {activeTab === 'planner' && (
            <PlannerTab
              plan={plan} setPlan={setPlan}
              plannerMetrics={plannerMetrics}
              budgetAnalysis={budgetAnalysis}
              quickFill={quickFill} setQuickFill={setQuickFill}
              handleQuickFill={handleQuickFill}
              resetPlan={resetPlan}
              isViewer={isViewer}
              currentUserEmail={currentUser.email}
            />
          )}
          {activeTab === 'analytics' && (
            aiAnalysis
              ? <AnalyticsTab aiAnalysis={aiAnalysis} theme={theme} />
              : <div className="glass-panel p-12 rounded-[2rem] text-center"><p className="font-mono text-slate-400">Record transactions to unlock AI Analytics.</p></div>
          )}
          {activeTab === 'si60' && (
            <SI60Tab
              si60Data={si60Data} setSi60Data={setSi60Data}
              si60Total={si60Total} convertedZiG={convertedZiG}
              isSi60Sealed={isSi60Sealed} handleSealSi60={handleSealSi60}
              isViewer={isViewer}
            />
          )}
          {activeTab === 'vault' && (
            <VaultTab
              documents={documents}
              isDragging={isDragging} setIsDragging={setIsDragging}
              uploadStatus={uploadStatus}
              scanLog={scanLog}
              scanReport={scanReport}
              isViewer={isViewer}
              onFileSelected={processFile}
              onPostDoc={setDocToPost}
              onDeleteDoc={handleDeleteDoc}
            />
          )}
          {activeTab === 'partners' && (
            <PartnersTab
              partners={partners}
              isViewer={isViewer}
              onAddClick={() => setShowPartnerModal(true)}
            />
          )}
        </ErrorBoundary>
      </main>

      <footer className="glass-panel border-t border-blue-500/20 py-3 px-6 text-center hidden sm:block">
        <p className="font-mono text-[8px] text-blue-400">
          🌾 OmniSight Unified Suite v16.0 • Journal • Budget Planner • Analytics • SI-60 • Smart Vault • Offline-Ready
        </p>
      </footer>

      {/* Mobile bottom navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
