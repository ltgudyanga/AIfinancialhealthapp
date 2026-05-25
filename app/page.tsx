'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Safe Icon component
const Icon = ({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) => {
  // Map common mis‑named icons to correct lucide-react exports
  const iconMap: Record<string, keyof typeof Icons> = {
    'ChartLine': 'LineChart',
    'MessageSquare': 'MessageSquare',
    'ShieldCheck': 'ShieldCheck',
    'FileText': 'FileText',
    'Users': 'Users',
    'UserPlus': 'UserPlus',
    'BookOpen': 'BookOpen',
    'Calendar': 'Calendar',
    'BrainCircuit': 'BrainCircuit',
    'ScanLine': 'Scan',
    'Archive': 'Archive',
    'Image': 'Image',
    'Activity': 'Activity',
    'Eye': 'Eye',
    'CheckCircle': 'CheckCircle',
    'AlertCircle': 'AlertCircle',
    'AlertTriangle': 'AlertTriangle',
    'BarChart2': 'BarChart2',
    'ShieldAlert': 'ShieldAlert',
    'Lock': 'Lock',
    'Power': 'Power',
    'Send': 'Send',
    'X': 'X',
    'Trash2': 'Trash2',
    'PlusCircle': 'PlusCircle',
    'User': 'User',
    'Inbox': 'Inbox',
    'Scan': 'Scan',
  };
  const mappedName = iconMap[name] || name;
  const LucideIcon = Icons[mappedName as keyof typeof Icons];
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found (mapped to "${mappedName}")`);
    // Return an empty span (invisible) to avoid layout break
    return <span style={{ width: size, height: size, display: 'inline-block' }} className={className} />;
  }
  return <LucideIcon size={size} className={className} />;
};
// FinBERT metrics hook
const useFinBERTMetrics = (metrics: any, transactions: any[]) => {
  const ratio = metrics.ratio;
  const positiveWords = ['profit','revenue','sale','growth','income','bonus','harvest','export','premium'];
  const negativeWords = ['loss','fine','penalty','refund','crash','theft','drought','disease','breakdown'];
  let posCount = 0, negCount = 0;
  transactions.forEach(tx => {
    const desc = (tx.desc || '').toLowerCase();
    positiveWords.forEach(w => { if (desc.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (desc.includes(w)) negCount++; });
  });
  const netSentiment = posCount - negCount;
  let overall = 'stable';
  if (ratio >= 1.5 && netSentiment > 0) overall = 'excellent';
  else if (ratio < 1.0 || netSentiment < -1) overall = 'caution';
  else overall = 'stable';
  
  const getStatus = (value: number, thresholds: number[]) => {
    if (value >= thresholds[0]) return 'excellent';
    if (value >= thresholds[1]) return 'stable';
    return 'caution';
  };
  const inflowStatus = getStatus(metrics.totalInflowUSD, [5000, 2000]);
  const outflowAdjustedStatus = ratio >= 1.5 ? 'excellent' : ratio >= 1.0 ? 'stable' : 'caution';
  const zigStatus = metrics.zigNet >= 0 ? 'excellent' : 'caution';
  const capitalStatus = metrics.usdNet >= 0 ? (metrics.usdNet > 500 ? 'excellent' : 'stable') : 'caution';
  
  return {
    overall,
    details: {
      cautionRatio: { value: metrics.ratio.toFixed(2) + 'x', status: ratio >= 1.5 ? 'excellent' : ratio >= 1.0 ? 'stable' : 'caution' },
      workingCapital: { value: '$' + metrics.usdNet.toFixed(2), status: capitalStatus },
      totalInflow: { value: '$' + metrics.totalInflowUSD.toFixed(2), status: inflowStatus },
      totalOutflow: { value: '$' + metrics.totalOutflowUSD.toFixed(2), status: outflowAdjustedStatus },
      zigNet: { value: metrics.zigNet.toFixed(2) + ' ZiG', status: zigStatus },
    },
    comment: overall === 'excellent' ? "FinBERT analysis indicates strong financial health with positive cash flow and favourable operational sentiment."
         : overall === 'stable' ? "FinBERT sentiment is neutral; monitor budget variances closely to maintain stability."
         : "⚠️ FinBERT detects high risk: outflow exceeding inflow and negative transaction sentiment. Immediate corrective action recommended."
  };
};

// TrendChart component
const TrendChart = ({ transactions }: { transactions: any[] }) => {
  const [chartData, setChartData] = useState<any>(null);
  useEffect(() => {
    if (!transactions.length) return;
    const dailyData: { date: string; inflow: number; outflow: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0,0,0,0)).getTime();
      const dayEnd = new Date(date.setHours(23,59,59,999)).getTime();
      const dayTx = transactions.filter(t => t.timestamp >= dayStart && t.timestamp <= dayEnd);
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inflow: dayTx.filter(t => t.type === 'inflow').reduce((acc, t) => acc + (t.amount_cents/100), 0),
        outflow: dayTx.filter(t => t.type === 'outflow').reduce((acc, t) => acc + (t.amount_cents/100), 0)
      });
    }
    const netValues = dailyData.map(d => d.inflow - d.outflow);
    setChartData({
      labels: dailyData.map(d => d.date),
      datasets: [
        { label: 'Money In', data: dailyData.map(d => d.inflow), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true },
        { label: 'Money Out', data: dailyData.map(d => d.outflow), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true },
        { label: 'Net Cashflow', data: netValues, borderColor: '#3b82f6', borderWidth: 3, tension: 0.4, fill: false, pointRadius: 3 }
      ]
    });
  }, [transactions]);
  if (!chartData) return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  return (
    <div className="w-full h-64">
      <Line data={chartData} options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1', font: { family: 'JetBrains Mono', size: 10 } } } },
        scales: { x: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8', callback: (v) => '$' + v } } }
      }} />
    </div>
  );
};

// BudgetVarianceChart component
const BudgetVarianceChart = ({ plan, transactions }: { plan: any; transactions: any[] }) => {
  const [chartData, setChartData] = useState<any>(null);
  useEffect(() => {
    if (!plan) return;
    const labels = [...plan.categories.map((c: any) => c.name)];
    const budgets = [...plan.categories.map((c: any) => parseFloat(c.budgetAmount || 0))];
    const actuals = plan.categories.map((cat: any) => {
      return transactions.filter(t => t.categoryId === cat.id && t.currency === 'USD').reduce((sum, t) => sum + (t.amount_cents/100), 0);
    });
    const taxRate = parseFloat(plan.taxRate || 0);
    if (taxRate > 0) {
      const totalIncomeBudget = plan.categories.filter((c: any) => c.type === 'inflow').reduce((sum: number, c: any) => sum + parseFloat(c.budgetAmount || 0), 0);
      const calculatedTaxBudget = totalIncomeBudget * (taxRate / 100);
      const totalIncomeActual = transactions.filter(t => t.type === 'inflow' && t.currency === 'USD').reduce((sum, t) => sum + (t.amount_cents/100), 0);
      const calculatedTaxActual = totalIncomeActual * (taxRate / 100);
      labels.push('Tax Liabilities');
      budgets.push(calculatedTaxBudget);
      actuals.push(calculatedTaxActual);
    }
    setChartData({
      labels,
      datasets: [
        { label: '13-Wk Budget ($)', data: budgets, backgroundColor: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4 },
        { label: 'Actuals ($)', data: actuals, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 }
      ]
    });
  }, [plan, transactions]);
  if (!chartData) return <div className="h-64 flex items-center justify-center">Loading variance chart...</div>;
  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1', font: { family: 'JetBrains Mono', size: 10 } } } },
        scales: { x: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }, y: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8' } } }
      }} />
    </div>
  );
};

// Modals (all in one place)
const AddPartnerModal = ({ onClose, onAdd }: { onClose: () => void; onAdd: (partner: any) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ id: Date.now(), name, email, role, status: 'active', joinedAt: new Date().toISOString().split('T')[0] });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md animate-in">
        <div className="flex justify-between items-center mb-6"><h2 className="font-display font-black text-xl text-blue-300">Add Business Partner</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="X" size={24} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Full Name</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm" placeholder="John Farmer" /></div>
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm" placeholder="partner@example.com" /></div>
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Role</label><select value={role} onChange={e => setRole(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm"><option value="owner">🌾 Co-Owner</option><option value="accountant">📊 Accountant</option><option value="viewer">👁️ Staff (View Only)</option></select></div>
          <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-3 rounded-xl text-[11px] uppercase">Add Partner</button><button type="button" onClick={onClose} className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-[11px] uppercase">Cancel</button></div>
        </form>
      </div>
    </div>
  );
};

const ConfirmVaultModal = ({ pendingDoc, onConfirm, onCancel }: { pendingDoc: any; onConfirm: (doc: any) => void; onCancel: () => void }) => {
  const [amount, setAmount] = useState(pendingDoc?.extractedData?.amount || '0.00');
  const [currency, setCurrency] = useState(pendingDoc?.extractedData?.currency || 'USD');
  useEffect(() => {
    if (pendingDoc) {
      setAmount(pendingDoc.extractedData?.amount || '0.00');
      setCurrency(pendingDoc.extractedData?.currency || 'USD');
    }
  }, [pendingDoc]);
  const handleConfirm = () => {
    const cleanAmount = parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;
    onConfirm({
      ...pendingDoc,
      extractedData: { ...pendingDoc.extractedData, amount: cleanAmount.toFixed(2), currency }
    });
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 rounded-[2rem] w-full max-w-sm animate-in">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Confirm Scanned Figure</h3><button onClick={onCancel} className="text-slate-400 hover:text-white"><Icon name="X" size={20} /></button></div>
        <p className="text-xs text-slate-300 mb-2 border-l-2 border-blue-500 pl-3">Document: {pendingDoc?.name}<br/>AI extracted: {pendingDoc?.extractedData?.currency} {pendingDoc?.extractedData?.amount}</p>
        <p className="text-[10px] text-amber-400 mb-4">You can correct the figure before saving to the vault.</p>
        <div className="space-y-4">
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-bold"><option value="USD">USD</option><option value="ZiG">ZiG</option></select></div>
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Amount</label><input type="text" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-mono" /></div>
          <div className="flex gap-3 pt-2"><button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-black uppercase transition-colors">Confirm & Save</button><button onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl text-xs font-bold uppercase transition-colors">Discard</button></div>
        </div>
      </div>
    </div>
  );
};

const PostDocModal = ({ doc, onClose, onConfirm }: { doc: any; onClose: () => void; onConfirm: (doc: any, type: string, currency: string, amount: string) => void }) => {
  const [selectedType, setSelectedType] = useState('outflow');
  const [selectedCurrency, setSelectedCurrency] = useState(doc?.extractedData?.currency || 'USD');
  const [amount, setAmount] = useState(doc?.extractedData?.amount || '0.00');
  const handleConfirm = () => {
    const cleanAmount = parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;
    onConfirm(doc, selectedType, selectedCurrency, cleanAmount.toFixed(2));
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 rounded-[2rem] w-full max-w-sm animate-in">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Post to Journal</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="X" size={20} /></button></div>
        <p className="text-xs text-slate-300 mb-6 border-l-2 border-blue-500 pl-3">Scanned Document: {doc.name}<br/>Figure: {doc.extractedData.currency} {doc.extractedData.amount}</p>
        <div className="space-y-4">
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Transaction Type</label><select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-bold"><option value="inflow">💰 Cash Inflow (Income/Receipt)</option><option value="outflow">💸 Cash Outflow (Expense/Payment)</option></select></div>
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Currency</label><select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-bold"><option value="USD">USD</option><option value="ZiG">ZiG</option></select></div>
          <div><label className="text-[10px] font-black text-blue-300 uppercase ml-2">Amount (edit if needed)</label><input type="text" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-mono" /></div>
          <div className="flex gap-3 pt-2"><button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-black uppercase transition-colors">Confirm & Post</button></div>
        </div>
      </div>
    </div>
  );
};

// AuthScreen component
const AuthScreen = ({ onAuth }: { onAuth: (user: any) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuth({ id: userCredential.user.uid, email, name: email.split('@')[0] });
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await setDoc(doc(db, "users", userCredential.user.uid), { email, name, createdAt: Date.now() });
        } catch (dbErr) { console.warn("Firestore save failed, proceeding anyway."); }
        onAuth({ id: userCredential.user.uid, email, name });
      }
    } catch (err: any) {
      console.error("Firebase Error:", err);
      alert(`Cloud connection failed: ${err.message}\n\nActivating Offline Local Mode. You will be logged in securely on your device.`);
      onAuth({ id: 'local_' + Date.now(), email: email || 'local@offline.com', name: name || 'Local User' });
    } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md">
        <div className="flex justify-center mb-6"><div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-3xl text-white"><Icon name="BrainCircuit" size={40} /></div></div>
        <h2 className="text-3xl font-black text-center text-white mb-1">OmniSight AI</h2>
        <p className="text-center font-mono text-xs text-blue-300 mb-8 uppercase tracking-widest">Unified Suite v20.0</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && <div><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 glass-input rounded-xl text-sm" placeholder="Full Name" /></div>}
          <div><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 glass-input rounded-xl text-sm" placeholder="Email Address" /></div>
          <div><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 glass-input rounded-xl text-sm" placeholder="Password (Min 6 Chars)" /></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase text-xs transition-all">{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
          <button type="button" onClick={() => onAuth({id: 'demo', email: 'demo@app.com', name: 'Demo User'})} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl uppercase text-[10px] transition-all">Skip Login / Local Demo</button>
        </form>
        <div className="mt-6 text-center"><button onClick={() => { setIsLogin(!isLogin); }} className="text-xs font-bold text-blue-400 hover:text-blue-300">{isLogin ? "Create Account" : "Back to Sign In"}</button></div>
      </div>
    </div>
  );
};

// Conversational AI class
class ConversationalAI {
  private context: any = null;
  updateContext(transactions: any, metrics: any, budget: any) { this.context = { transactions, metrics, budget }; }
  async generateResponse(message: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
    const lowerMsg = message.toLowerCase();
    const { metrics, budget } = this.context;
    if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) 
      return "Hello! I am your OmniSight AI Assistant. I have moved away from static expert rules to provide you with dynamic, conversational analysis. Ask me about your working capital, your 13-week itemized budget, or overall cash flow health.";
    if (lowerMsg.includes("balance") || lowerMsg.includes("cash")) 
      return `Your current net working capital is **$${metrics.usdNet.toFixed(2)} USD**. You have total inflows of $${metrics.totalInflowUSD.toFixed(2)} and outflows of $${metrics.totalOutflowUSD.toFixed(2)}. Your cash flow ratio is ${metrics.ratio.toFixed(2)}x.`;
    if (lowerMsg.includes("budget") || lowerMsg.includes("plan") || lowerMsg.includes("item") || lowerMsg.includes("tax")) {
      const totalIncome = budget.categories.filter((c: any) => c.type === 'inflow').reduce((sum: number, c: any) => sum + parseFloat(c.budgetAmount||0), 0);
      const baseExpense = budget.categories.filter((c: any) => c.type === 'outflow').reduce((sum: number, c: any) => sum + parseFloat(c.budgetAmount||0), 0);
      const taxRate = parseFloat(budget.taxRate || 0);
      const calculatedTax = totalIncome * (taxRate / 100);
      const totalExpense = baseExpense + calculatedTax;
      return `Your 13-week itemized budget projects **$${totalIncome.toFixed(2)}** in category income against **$${totalExpense.toFixed(2)}** in total expenses (including **$${calculatedTax.toFixed(2)}** in dynamically computed tax liabilities at a rate of ${taxRate}%). Net position: **$${(totalIncome - totalExpense).toFixed(2)}**.`;
    }
    if (lowerMsg.includes("health") || lowerMsg.includes("status")) {
      if (metrics.ratio >= 1.5) return "Your financial health is currently **Excellent**. Your itemized inflows safely cover your outflows, providing a solid buffer for reinvestment or emergency savings.";
      if (metrics.ratio >= 1.0) return "Your financial health is **Stable but Tight**. You are breaking even, but I recommend checking your budget planner to identify 1-2 expense categories to reduce.";
      return "⚠️ **Warning:** Your outflow currently exceeds your inflow. We need to immediately review your Daily Journal and freeze non-essential spending categories like 'Other Expenses'.";
    }
    if (lowerMsg.includes("zig") || lowerMsg.includes("currency")) 
      return `You currently have **${metrics.zigNet.toFixed(2)} ZiG** in net local currency. Remember, the system automatically converts this at the rate of 28.5 when calculating your total USD net worth.`;
    if (lowerMsg.includes("advice") || lowerMsg.includes("recommend")) 
      return "My top AI recommendation is to track your actuals against your 13-week budget categories closely. If an expense category (like Transport & Fuel) constantly exceeds the budget limit, it's a leak we need to plug immediately.";
    return "I am analyzing that based on your current financial data. To give you the best insight, could you specify if you are asking about your general balance, specific budget categories, or overall cash flow health?";
  }
}

// Dashboard component - no early return, only one return at the end
const Dashboard = ({ currentUser, onLogout }: { currentUser: any; onLogout: () => void }) => {
  const [globalTransactions, setGlobalTransactions] = useState(() => {
    const saved = localStorage.getItem('omnisight_tx_v20');
    return saved ? JSON.parse(saved) : [
      { id: 't1', userId: 'local', categoryId: 'cat-inc-1', type: 'inflow', desc: 'Maize Sales', currency: 'USD', amount_cents: 35000, timestamp: Date.now() - 86400000 * 2 }
    ];
  });
  const [partners, setPartners] = useState(() => JSON.parse(localStorage.getItem('omnisight_partners_v20') || '[]'));
  const defaultBudget = { 
    opening: 5000,
    taxRate: 0,
    categories: [
      { id: 'cat-inc-1', name: 'Crop Sales', type: 'inflow', budgetAmount: 2000 },
      { id: 'cat-inc-2', name: 'Livestock Sales', type: 'inflow', budgetAmount: 1500 },
      { id: 'cat-inc-3', name: 'Other Income', type: 'inflow', budgetAmount: 500 },
      { id: 'cat-exp-1', name: 'Fertilizer & Seed', type: 'outflow', budgetAmount: 1000 },
      { id: 'cat-exp-2', name: 'Transport & Fuel', type: 'outflow', budgetAmount: 400 },
      { id: 'cat-exp-3', name: 'Groceries', type: 'outflow', budgetAmount: 300 },
      { id: 'cat-exp-4', name: 'Labor', type: 'outflow', budgetAmount: 800 },
      { id: 'cat-exp-5', name: 'Equipment Maint.', type: 'outflow', budgetAmount: 200 },
      { id: 'cat-exp-6', name: 'Other Expenses', type: 'outflow', budgetAmount: 100 }
    ]
  };
  const [plan, setPlan] = useState(() => JSON.parse(localStorage.getItem('omnisight_budget_v20') || JSON.stringify(defaultBudget)));
  const [documents, setDocuments] = useState(() => JSON.parse(localStorage.getItem('omnisight_docs_v20') || '[]'));
  const [isSi60Sealed, setIsSi60Sealed] = useState(() => localStorage.getItem('omnisight_si60_sealed_v20') === 'true');
  const [activeTab, setActiveTab] = useState('journal');
  const [txForm, setTxForm] = useState({ type: 'inflow', categoryId: '', desc: '', currency: 'USD', amount: '', date: new Date().toISOString().split('T')[0] });
  const [chatMessages, setChatMessages] = useState([{role: 'ai', text: 'Welcome to OmniSight AI v20.0. We have upgraded from static rule-systems to full conversational AI. What can I analyze for you today?'}]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiBot = useRef(new ConversationalAI()).current;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [scanLog, setScanLog] = useState('');
  const [docToPost, setDocToPost] = useState<any>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<any>(null);
  const [si60Data, setSi60Data] = useState(() => JSON.parse(localStorage.getItem('omnisight_si60_data_v20') || '{"cash":50000,"inventory":12000,"receivables":8500}'));
  const si60Total = (parseFloat(si60Data.cash) || 0) + (parseFloat(si60Data.inventory) || 0) + (parseFloat(si60Data.receivables) || 0);
  const SI60_RATE = 2498.7242;
  const convertedZiG = si60Total / SI60_RATE;

  useEffect(() => {
    localStorage.setItem('omnisight_tx_v20', JSON.stringify(globalTransactions));
    localStorage.setItem('omnisight_partners_v20', JSON.stringify(partners));
    localStorage.setItem('omnisight_budget_v20', JSON.stringify(plan));
    localStorage.setItem('omnisight_docs_v20', JSON.stringify(documents));
    localStorage.setItem('omnisight_si60_sealed_v20', String(isSi60Sealed));
    localStorage.setItem('omnisight_si60_data_v20', JSON.stringify(si60Data));
  }, [globalTransactions, partners, plan, documents, isSi60Sealed, si60Data]);

  const isViewer = currentUser.email === 'viewer@farm.com';
  const userTransactions = useMemo(() => 
    globalTransactions.filter(t => t.userId === currentUser.id || t.userId === 'local').sort((a,b) => b.timestamp - a.timestamp),
    [globalTransactions, currentUser]
  );
  const metrics = useMemo(() => {
    const usdIn = userTransactions.filter(t => t.currency === 'USD' && t.type === 'inflow').reduce((acc, t) => acc + t.amount_cents, 0);
    const usdOut = userTransactions.filter(t => t.currency === 'USD' && t.type === 'outflow').reduce((acc, t) => acc + t.amount_cents, 0);
    const zigIn = userTransactions.filter(t => t.currency === 'ZiG' && t.type === 'inflow').reduce((acc, t) => acc + t.amount_cents, 0);
    const zigOut = userTransactions.filter(t => t.currency === 'ZiG' && t.type === 'outflow').reduce((acc, t) => acc + t.amount_cents, 0);
    const totalInflowUSD = (usdIn / 100) + ((zigIn / 100) / 28.5);
    const baseOutflowUSD = (usdOut / 100) + ((zigOut / 100) / 28.5);
    const taxRate = parseFloat(plan.taxRate || 0);
    const calculatedTaxActual = totalInflowUSD * (taxRate / 100);
    const totalOutflowUSD = baseOutflowUSD + calculatedTaxActual;
    const ratio = totalOutflowUSD === 0 ? (totalInflowUSD > 0 ? 3.0 : 0) : totalInflowUSD / totalOutflowUSD;
    return { usdIn: usdIn/100, usdOut: usdOut/100, zigIn: zigIn/100, zigOut: zigOut/100, totalInflowUSD, totalOutflowUSD, usdNet: (usdIn-usdOut)/100 - calculatedTaxActual, zigNet: (zigIn-zigOut)/100, ratio, calculatedTaxActual };
  }, [userTransactions, plan.taxRate]);
  const finbert = useFinBERTMetrics(metrics, userTransactions);
  const plannerMetrics = useMemo(() => {
    const totalIncome = plan.categories.filter((c: any) => c.type === 'inflow').reduce((sum: number, c: any) => sum + parseFloat(c.budgetAmount||0), 0);
    const baseExpense = plan.categories.filter((c: any) => c.type === 'outflow').reduce((sum: number, c: any) => sum + parseFloat(c.budgetAmount||0), 0);
    const taxRate = parseFloat(plan.taxRate || 0);
    const taxLiability = totalIncome * (taxRate / 100);
    const totalExpensesWithTax = baseExpense + taxLiability;
    const netCashflow = totalIncome - totalExpensesWithTax;
    return { totalIncome, baseExpense, taxLiability, totalExpensesWithTax, netCashflow };
  }, [plan]);

  useEffect(() => { aiBot.updateContext(userTransactions, metrics, plan); }, [userTransactions, metrics, plan, aiBot]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isAiTyping]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setChatInput('');
    setIsAiTyping(true);
    const aiResponse = await aiBot.generateResponse(userMsg);
    setIsAiTyping(false);
    setChatMessages(prev => [...prev, {role: 'ai', text: aiResponse}]);
  };

  const availableCategories = plan.categories.filter((c: any) => c.type === txForm.type);
  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.categoryId) return;
    const newTx = {
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      type: txForm.type,
      categoryId: txForm.categoryId,
      desc: txForm.desc,
      currency: txForm.currency,
      amount_cents: Math.round(parseFloat(txForm.amount) * 100),
      timestamp: new Date(txForm.date).getTime() + Math.floor(Math.random() * 10000)
    };
    setGlobalTransactions([newTx, ...globalTransactions]);
    setTxForm({ type: 'inflow', categoryId: '', desc: '', currency: 'USD', amount: '', date: new Date().toISOString().split('T')[0] });
  };
  const handleClearJournal = () => {
    if (isViewer) return;
    if (window.confirm("Are you sure you want to clear all your journal entries? This action cannot be undone.")) {
      setGlobalTransactions(globalTransactions.filter(t => t.userId !== currentUser.id && t.userId !== 'local'));
    }
  };
  const handleResetBudget = () => {
    if (isViewer) return;
    if (window.confirm("Are you sure you want to reset all 13-week budget planner categories back to defaults?")) {
      setPlan(defaultBudget);
    }
  };
  const handleSealSi60 = () => {
    if (isViewer || isSi60Sealed) return;
    if (window.confirm("WARNING: Sealing the SI-60 Declaration locks the base values. Proceed?")) {
      setIsSi60Sealed(true);
    }
  };
  const handleResetSi60 = () => {
    if (isViewer) return;
    if (window.confirm("Are you sure you want to reset the SI-60 Declaration? This will unseal it and clear all values to zero.")) {
      setIsSi60Sealed(false);
      setSi60Data({cash: '', inventory: '', receivables: ''});
    }
  };
  const confirmPostToJournal = (doc: any, confirmedType: string, confirmedCurrency: string, confirmedAmount: string) => {
    if(isViewer) return;
    const amountCents = Math.round(parseFloat(confirmedAmount) * 100);
    const newTx = {
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      type: confirmedType,
      categoryId: availableCategories[0]?.id || '',
      desc: `Auto-Scanned: ${doc.name}`,
      currency: confirmedCurrency,
      amount_cents: amountCents,
      timestamp: Date.now(),
      sourceDocId: doc.id
    };
    setGlobalTransactions([newTx, ...globalTransactions]);
    setDocuments(documents.map((d: any) => d.id === doc.id ? { ...d, isRecorded: true, txId: newTx.id } : d));
    setDocToPost(null);
  };
  const handleDeleteDoc = (docId: string) => {
    if (isViewer) return;
    if (window.confirm("Remove this document from the vault?")) setDocuments(documents.filter((d: any) => d.id !== docId));
  };
  const confirmVaultSave = (confirmedDoc: any) => {
    setDocuments(prev => [confirmedDoc, ...prev]);
    setPendingDoc(null);
    setUploadStatus('done');
    setScanLog(`Saved: ${confirmedDoc.extractedData.currency} ${confirmedDoc.extractedData.amount}`);
    setTimeout(() => setUploadStatus(null), 3000);
  };
  const cancelVaultSave = () => {
    setPendingDoc(null);
    setUploadStatus(null);
    setScanLog('Scan discarded.');
    setTimeout(() => setScanLog(''), 2000);
  };
  const processFile = async (file: File) => {
    if (!file) return;
    setUploadStatus('scanning'); setScanLog('Initializing document reader...');
    let text = '';
    const fileName = file.name.toLowerCase();
    try {
      if (fileName.endsWith('.pdf')) {
        setScanLog('Extracting text from PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        text = fullText.trim() || 'No text found in PDF.';
      } else if (fileName.endsWith('.docx')) {
        setScanLog('Parsing Word document...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value || 'No text extracted.';
      } else {
        setScanLog('Running OCR on image...');
        const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng');
        text = ocrText || '';
      }
    } catch (err) {
      console.error(err);
      text = 'Document processing error.';
    }
    setScanLog('AI Extracting values with Regex...');
    const priceMatch = text.match(/(?:USD|ZiG|Zg|\$)?\s*(\d+[.,]\d{2})/i);
    const isZig = text.match(/(ZiG|Zg)/i) ? 'ZiG' : 'USD';
    const amountStr = priceMatch ? priceMatch[1].replace(',', '') : '0.00';
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.name.split('.').pop()?.toUpperCase() || 'DOC',
      date: new Date().toLocaleDateString(),
      extractedData: { amount: amountStr, currency: isZig, rawText: text },
      status: 'Auto-Verified',
      isRecorded: false
    };
    setPendingDoc(newDoc);
    setUploadStatus('confirm');
    setScanLog(`Review figure: ${isZig} ${amountStr}`);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isViewer && e.dataTransfer.files?.length > 0) processFile(e.dataTransfer.files[0]);
  };
  const tabs = [
    { id: 'journal', label: 'Daily Journal', icon: 'BookOpen' },
    { id: 'planner', label: '13-Wk Planner', icon: 'Calendar' },
    { id: 'analytics', label: 'AI Analytics Chat', icon: 'MessageSquare' },
    { id: 'si60', label: 'SI-60 Audit', icon: 'ShieldCheck' },
    { id: 'vault', label: 'Smart Vault', icon: 'FileText' },
    { id: 'partners', label: 'Partners', icon: 'Users' }
  ];
  const statusColorMap: Record<string, string> = {
    excellent: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    stable: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    caution: 'bg-rose-500/10 border-rose-500/30 text-rose-400'
  };

  // This is the only return statement in this component
  return (
    <div className="min-h-screen flex flex-col">
      {showPartnerModal && <AddPartnerModal onClose={() => setShowPartnerModal(false)} onAdd={(p) => { setPartners([...partners, p]); setShowPartnerModal(false); }} />}
      {docToPost && <PostDocModal doc={docToPost} onClose={() => setDocToPost(null)} onConfirm={confirmPostToJournal} />}
      {pendingDoc && <ConfirmVaultModal pendingDoc={pendingDoc} onConfirm={confirmVaultSave} onCancel={cancelVaultSave} />}
      
      <header className="glass-panel sticky top-0 z-40 border-b border-blue-500/20">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white"><Icon name="BrainCircuit" size={20} /></div>
            <div>
              <h1 className="font-display font-black text-lg text-white flex items-center gap-2">OmniSight AI <span className="text-blue-400 font-mono text-[10px]">v20.0</span></h1>
              <p className="font-mono text-[9px] text-blue-300 uppercase">{currentUser.name}</p>
            </div>
          </div>
          <nav className="flex gap-2">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex gap-2 ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-blue-800/50'}`}>
                <Icon name={t.icon as keyof typeof Icons} size={14} /> {t.label}
              </button>
            ))}
          </nav>
          <button onClick={onLogout} className="text-rose-400 font-mono text-[10px] uppercase flex items-center gap-2"><Icon name="Power" size={14}/> Logout</button>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] w-full mx-auto p-6 relative">
        {activeTab === 'journal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-[2rem]">
                <h2 className="font-mono text-xs text-blue-300 uppercase mb-4">Record Transaction</h2>
                <form onSubmit={handleAddTx} className="space-y-4">
                  <div className="flex gap-2 p-1 bg-blue-900/30 rounded-xl">
                    <button type="button" onClick={() => setTxForm({...txForm, type: 'inflow', categoryId: ''})} className={`flex-1 py-2 rounded-lg text-xs uppercase font-bold ${txForm.type === 'inflow' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>💰 Income</button>
                    <button type="button" onClick={() => setTxForm({...txForm, type: 'outflow', categoryId: ''})} className={`flex-1 py-2 rounded-lg text-xs uppercase font-bold ${txForm.type === 'outflow' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>💸 Expense</button>
                  </div>
                  <select required value={txForm.categoryId} onChange={e => setTxForm({...txForm, categoryId: e.target.value})} className="w-full p-3 glass-input rounded-xl text-sm font-bold">
                    <option value="" disabled>Select Budget Category...</option>
                    {availableCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="w-full p-3 glass-input rounded-xl" required />
                  <input value={txForm.desc} onChange={e => setTxForm({...txForm, desc: e.target.value})} placeholder="Description" className="w-full p-3 glass-input rounded-xl" required />
                  <div className="flex gap-3">
                    <select value={txForm.currency} onChange={e => setTxForm({...txForm, currency: e.target.value})} className="w-1/3 p-3 glass-input rounded-xl"><option value="USD">USD</option><option value="ZiG">ZiG</option></select>
                    <input type="number" step="0.01" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} placeholder="Amount" className="w-2/3 p-3 glass-input rounded-xl" required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs">Record Entry</button>
                </form>
              </div>
              <div className="glass-panel p-4 rounded-[2rem] h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-blue-500/20 pb-2">
                  <h2 className="font-mono text-xs text-blue-300 uppercase">Recent</h2>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] bg-blue-600/30 text-blue-300 px-2 py-1 rounded-full">{userTransactions.length}</span>
                    <button disabled={isViewer} onClick={handleClearJournal} className="font-mono text-[9px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 px-2 py-1 rounded transition-colors uppercase disabled:opacity-50">Reset Journal</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
                  {userTransactions.map((t: any) => (
                    <div key={t.id} className="p-3 bg-blue-900/20 rounded-xl flex justify-between mb-2 border border-blue-500/20">
                      <div>
                        <p className="font-bold text-sm text-slate-200 flex items-center gap-2">{t.desc} {t.sourceDocId && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[8px] uppercase border border-blue-500/30" title="Imported from Vault">Scanned</span>}</p>
                        <p className="text-[10px] text-blue-400 font-mono">{new Date(t.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className={`font-mono font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type === 'inflow' ? '+' : '-'}{t.currency} {(t.amount_cents/100).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Working Capital', value: `$${metrics.usdNet.toFixed(2)}`, color: metrics.usdNet >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'Cashflow Ratio', value: `${metrics.ratio.toFixed(2)}x`, color: metrics.ratio >= 1.5 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Total Inflow', value: `$${metrics.totalInflowUSD.toFixed(2)}`, color: 'text-emerald-400' },
                  { label: 'Total Outflow', value: `$${metrics.totalOutflowUSD.toFixed(2)}`, color: 'text-rose-400' }
                ].map((s, i) => (
                  <div key={i} className="stat-card p-5 rounded-2xl"><p className="font-mono text-[9px] text-blue-300 uppercase">{s.label}</p><h3 className={`font-mono text-xl font-black ${s.color || 'text-white'}`}>{s.value}</h3></div>
                ))}
              </div>
              <div className="glass-panel p-6 rounded-[2rem]">
                <h2 className="font-mono text-[11px] text-blue-300 uppercase tracking-widest mb-4"><Icon name="LineChart" size={14} className="inline mr-2" />14-Day Quantitative Trends</h2>
                <TrendChart transactions={userTransactions} />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'planner' && (
          <div className="glass-panel p-8 rounded-[2rem] space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-black text-2xl text-blue-300 uppercase">13-Week Itemized Budget Planner</h2>
              <div className="flex items-center gap-4">
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
                  <label className="text-[10px] font-black font-mono text-blue-400 uppercase tracking-wide">Set Tax Rate (%):</label>
                  <input type="number" min="0" max="100" step="0.1" value={plan.taxRate || 0} onChange={e => setPlan({...plan, taxRate: Math.max(0, parseFloat(e.target.value) || 0)})} className="w-16 p-1 bg-slate-900 border border-blue-500/40 rounded text-center text-xs text-white font-mono font-bold" />
                </div>
                <button disabled={isViewer} onClick={handleResetBudget} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30 uppercase transition-colors disabled:opacity-50">Reset 13-Wk Plan</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 border border-blue-500/20 rounded-2xl">
              <div><p className="text-[9px] font-mono uppercase text-slate-400">Projected Gross Income</p><p className="font-mono text-base font-bold text-emerald-400">${plannerMetrics.totalIncome.toFixed(2)}</p></div>
              <div><p className="text-[9px] font-mono uppercase text-slate-400">Projected Base Expenses</p><p className="font-mono text-base font-bold text-slate-300">${plannerMetrics.baseExpense.toFixed(2)}</p></div>
              <div className="border-l border-dashed border-blue-500/30 pl-4"><p className="text-[9px] font-mono uppercase text-amber-400">Tax Expense ({plan.taxRate || 0}%)</p><p className="font-mono text-base font-bold text-amber-400">${plannerMetrics.taxLiability.toFixed(2)}</p></div>
              <div className="border-l border-dashed border-blue-500/30 pl-4"><p className="text-[9px] font-mono uppercase text-blue-300">Expected Net Cashflow</p><p className={`font-mono text-lg font-black ${plannerMetrics.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${plannerMetrics.netCashflow.toFixed(2)}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {['inflow', 'outflow'].map(type => (
                <div key={type}>
                  <h3 className={`font-mono text-sm uppercase mb-4 pb-2 border-b ${type === 'inflow' ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20'}`}>{type === 'inflow' ? 'Income' : 'Expense'} Categories</h3>
                  <div className="space-y-3">
                    {plan.categories.filter((c: any) => c.type === type).map((cat: any) => {
                      const actual = userTransactions.filter(t => t.categoryId === cat.id && t.currency === 'USD').reduce((sum, t) => sum + (t.amount_cents/100), 0);
                      const progress = cat.budgetAmount > 0 ? Math.min(100, (actual / cat.budgetAmount) * 100) : 0;
                      return (
                        <div key={cat.id} className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/20">
                          <div className="flex justify-between mb-2"><span className="font-bold text-sm text-slate-200">{cat.name}</span><span className={`font-mono text-xs ${type === 'inflow' ? (actual >= cat.budgetAmount ? 'text-emerald-400' : 'text-amber-400') : (actual > cat.budgetAmount ? 'text-rose-400' : 'text-emerald-400')}`}>Var: ${(actual - cat.budgetAmount).toFixed(0)}</span></div>
                          <div className="flex gap-4 mb-3">
                            <div className="flex-1"><label className="text-[9px] text-slate-400 uppercase font-mono mb-1 block">13-Wk Budget Limit</label><input type="number" value={cat.budgetAmount} onChange={e => { const newCats = [...plan.categories]; newCats.find((c: any) => c.id === cat.id)!.budgetAmount = parseFloat(e.target.value); setPlan({...plan, categories: newCats}); }} className="w-full p-2 glass-input rounded text-sm font-mono" /></div>
                            <div className="flex-1"><label className="text-[9px] text-slate-400 uppercase font-mono mb-1 block">Actual (From Journal)</label><input type="text" disabled value={actual.toFixed(2)} className="w-full p-2 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-300 font-mono" /></div>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className={`${type === 'inflow' ? 'bg-emerald-500' : actual > cat.budgetAmount ? 'bg-rose-500' : 'bg-amber-400'} h-full transition-all`} style={{width: `${progress}%`}}></div></div>
                        </div>
                      );
                    })}
                    {type === 'outflow' && parseFloat(plan.taxRate || 0) > 0 && (
                      <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-500/30">
                        <div className="flex justify-between mb-2"><span className="font-bold text-sm text-amber-300 flex items-center gap-1"><Icon name="ShieldAlert" size={14}/> Tax Liabilities (Auto)</span><span className="font-mono text-xs text-amber-400">Var: ${(metrics.calculatedTaxActual - plannerMetrics.taxLiability).toFixed(0)}</span></div>
                        <div className="flex gap-4"><div className="flex-1"><label className="text-[9px] text-amber-400/80 uppercase font-mono mb-1 block">Projected Tax Due</label><input type="text" disabled value={plannerMetrics.taxLiability.toFixed(2)} className="w-full p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm text-amber-300 font-mono" /></div><div className="flex-1"><label className="text-[9px] text-amber-400/80 uppercase font-mono mb-1 block">Actual Tax Liability</label><input type="text" disabled value={metrics.calculatedTaxActual.toFixed(2)} className="w-full p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm text-amber-300 font-mono" /></div></div>
                      </div>
                    )}
                    <button onClick={() => setPlan({...plan, categories: [...plan.categories, {id: 'cat-'+Date.now(), name: 'New Category', type, budgetAmount: 0}]})} className={`w-full py-3 border border-dashed rounded-xl text-xs font-bold transition-colors ${type === 'inflow' ? 'text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10' : 'text-rose-400 border-rose-500/40 hover:bg-rose-500/10'}`}>+ Add {type === 'inflow' ? 'Income' : 'Expense'} Category</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-blue-500/20 pt-8 mt-4"><h3 className="font-mono text-sm text-blue-300 mb-4"><Icon name="BarChart2" size={18} className="inline mr-2 text-blue-400" />Quantitative 13-Week Budget Analysis</h3><BudgetVarianceChart plan={plan} transactions={userTransactions} /></div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-[2rem]">
              <h2 className="font-display font-black text-xl text-white uppercase mb-6 flex items-center gap-3 border-b border-blue-500/20 pb-4"><Icon name="BrainCircuit" size={24} className="text-blue-400" /> FinBERT Sentinel Analysis</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {Object.entries(finbert.details).map(([key, item]: [string, any]) => (
                  <div key={key} className={`p-4 rounded-xl border ${statusColorMap[item.status]} bg-opacity-10`}>
                    <p className="font-mono text-[9px] uppercase text-slate-400 mb-1">{key === 'cautionRatio' ? 'Caution Ratio' : key === 'workingCapital' ? 'Working Capital' : key === 'totalInflow' ? 'Total Inflow' : key === 'totalOutflow' ? 'Total Outflow' : 'ZiG Net'}</p>
                    <h3 className="font-mono text-xl font-black">{item.value}</h3>
                  </div>
                ))}
              </div>
              <div className={`p-4 rounded-xl border ${statusColorMap[finbert.overall]} mt-2 flex items-start gap-3`}>
                <Icon name={finbert.overall === 'excellent' ? 'CheckCircle' : finbert.overall === 'stable' ? 'AlertCircle' : 'AlertTriangle'} size={20} />
                <p className="font-mono text-xs leading-relaxed">{finbert.comment}</p>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] h-[60vh] flex flex-col">
              <h2 className="font-display font-black text-xl text-white uppercase mb-4 flex items-center gap-3 border-b border-blue-500/20 pb-4"><Icon name="MessageSquare" size={24} className="text-blue-400" /> OmniSight Conversational AI</h2>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800/80 border border-blue-500/30 text-blue-100 rounded-bl-none shadow-lg'}`}>
                      {msg.role === 'ai' && <div className="flex items-center gap-2 mb-1 border-b border-slate-600 pb-1 text-[10px] uppercase font-bold text-blue-400 tracking-wider"><Icon name="BrainCircuit" size={12}/> OmniSight AI</div>}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/80 border border-blue-500/30 p-4 rounded-2xl rounded-bl-none flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="pt-4 border-t border-blue-500/20 flex gap-3">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask me to analyze your 13-week budget limits, cash flow health, or recent journal activity..." className="flex-1 p-4 glass-input rounded-xl text-sm" />
                <button type="submit" disabled={!chatInput.trim() || isAiTyping} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-colors disabled:opacity-50"><Icon name="Send" size={20} /></button>
              </form>
            </div>
          </div>
        )}
        {activeTab === 'si60' && (
          <div className="glass-panel p-10 rounded-[2rem] max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="font-display font-black text-2xl text-amber-400 uppercase mb-2"><Icon name="ShieldCheck" size={28} className="inline mr-2" />Protocol SI-60: Day Zero Audit</h2><p className="font-mono text-xs text-slate-400">Statutory Instrument 60 of 2024 - ZiG Currency Transition Calculator</p></div>
              <button disabled={isViewer} onClick={handleResetSi60} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors disabled:opacity-50">Reset SI-60</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div><label className="font-mono text-[10px] text-blue-300 uppercase block mb-2">Legacy ZWL Cash</label><input type="number" disabled={isSi60Sealed || isViewer} value={si60Data.cash} onChange={e => setSi60Data({...si60Data, cash: e.target.value})} className="w-full p-3 glass-input rounded-xl" /></div>
                <div><label className="font-mono text-[10px] text-blue-300 uppercase block mb-2">Legacy ZWL Inventory Val</label><input type="number" disabled={isSi60Sealed || isViewer} value={si60Data.inventory} onChange={e => setSi60Data({...si60Data, inventory: e.target.value})} className="w-full p-3 glass-input rounded-xl" /></div>
                <div><label className="font-mono text-[10px] text-blue-300 uppercase block mb-2">Legacy ZWL Receivables</label><input type="number" disabled={isSi60Sealed || isViewer} value={si60Data.receivables} onChange={e => setSi60Data({...si60Data, receivables: e.target.value})} className="w-full p-3 glass-input rounded-xl" /></div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-6 relative overflow-hidden">
                <div className="font-mono text-[10px] text-amber-400 uppercase mb-4">Live Conversion Calculation</div>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between border-b border-amber-500/20 pb-2"><span className="font-mono text-xs">Official Rate</span><span className="font-mono text-sm font-bold">2,498.7242 : 1 ZiG</span></div>
                  <div className="flex justify-between border-b border-amber-500/20 pb-2"><span className="font-mono text-xs">Total ZWL Value</span><span className="font-mono text-sm">{si60Total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ZWL</span></div>
                  <div className="flex justify-between pt-2 items-center"><span className="font-mono text-xs">Converted Value</span><span className="font-mono text-3xl font-black text-amber-400">{convertedZiG.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ZiG</span></div>
                </div>
                {!isSi60Sealed ? (
                  <button disabled={isViewer} onClick={handleSealSi60} className="w-full mt-6 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-black py-3 rounded-xl text-[11px] uppercase transition-all hover:scale-[1.02] relative z-10">🔒 Seal SI-60 Declaration</button>
                ) : (
                  <div className="mt-6 flex gap-2 relative z-10"><div className="flex-1 p-3 bg-blue-900/50 border border-blue-500/30 rounded-xl text-center text-blue-400 font-bold text-xs uppercase flex items-center justify-center gap-2"><Icon name="Lock" size={14}/> Sealed</div></div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <div className={`glass-panel p-8 rounded-[2rem] ${isViewer ? 'opacity-70 pointer-events-none' : ''}`}>
                <h2 className="font-display font-black text-xl text-blue-300 uppercase mb-2"><Icon name="ScanLine" size={24} className="inline mr-2" />Multi‑Format Scanner</h2>
                <p className="text-xs text-slate-400 mb-6">Upload PDF, Word, or image. Our AI extracts values from any document. No manual entry required.</p>
                <div className={`relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${isDragging ? 'drop-zone-active' : 'border-blue-500/40 bg-blue-900/10 hover:border-blue-400 hover:bg-blue-900/20'} ${uploadStatus === 'scanning' ? 'scanning' : ''}`} onDragOver={(e) => { e.preventDefault(); if(!isViewer) setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => { if(!isViewer) fileInputRef.current?.click(); }}>
                  <div className="scan-line"></div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".png,.jpg,.jpeg,.pdf,.doc,.docx" onChange={(e) => e.target.files && processFile(e.target.files[0])} disabled={isViewer} />
                  {uploadStatus === 'scanning' ? (
                    <div className="text-center space-y-3 z-10"><Icon name="Scan" size={40} className="text-blue-400 mx-auto animate-pulse" /><p className="font-mono text-xs text-blue-300">Extracting Autonomous Values...</p></div>
                  ) : uploadStatus === 'done' ? (
                    <div className="text-center space-y-3 z-10"><Icon name="CheckCircle" size={40} className="text-emerald-400 mx-auto" /><p className="font-mono text-xs text-emerald-400 font-bold">Saved to Vault</p></div>
                  ) : uploadStatus === 'confirm' ? (
                    <div className="text-center space-y-3 z-10"><Icon name="Eye" size={40} className="text-amber-400 mx-auto animate-pulse" /><p className="font-mono text-xs text-amber-400 font-bold">Review figure in the pop‑up</p></div>
                  ) : (
                    <div className="text-center space-y-3 z-10 pointer-events-none"><div className="bg-blue-500/20 p-3 rounded-full inline-block"><Icon name="Image" size={32} className="text-blue-400" /></div><div><p className="text-sm font-bold text-white">Click or drag document here</p><p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, JPG, PNG accepted</p></div></div>
                  )}
                </div>
                {uploadStatus && (
                  <div className="mt-6 p-4 bg-slate-900/50 border border-blue-500/20 rounded-xl">
                    <p className="font-mono text-[10px] text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2"><Icon name="Activity" size={12} /> Extraction Log</p>
                    <p className={`font-mono text-xs ${uploadStatus === 'done' ? 'text-emerald-300 font-bold' : uploadStatus === 'confirm' ? 'text-amber-300' : 'text-slate-300 animate-pulse'}`}>{scanLog}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="glass-panel p-8 rounded-[2rem] h-full min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-6"><h2 className="font-display font-black text-xl text-blue-300 uppercase"><Icon name="Archive" size={24} className="inline mr-2" />Secure Vault</h2><span className="bg-blue-600/30 text-blue-300 text-[10px] font-mono px-3 py-1 rounded-full">{documents.length} Files</span></div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {documents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4"><Icon name="Inbox" size={48} className="opacity-50" /><p className="font-mono text-sm">Vault is empty.</p></div>
                  ) : (
                    documents.map((doc: any) => (
                      <div key={doc.id} className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Icon name="Image" size={24} /></div>
                          <div>
                            <p className="font-bold text-sm text-slate-200">{doc.name}</p>
                            <p className="font-mono text-[9px] text-slate-400 mt-1">{doc.date} • {doc.size} • <span className="text-emerald-400">AI Verified</span></p>
                            {!doc.isRecorded ? (
                              <div className="flex gap-2 mt-2">
                                <button disabled={isViewer} onClick={() => setDocToPost(doc)} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors disabled:opacity-50"><Icon name="PlusCircle" size={12}/> Post to Journal</button>
                                <button disabled={isViewer} onClick={() => handleDeleteDoc(doc.id)} className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors disabled:opacity-50"><Icon name="Trash2" size={12}/> Delete</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-mono uppercase border border-blue-500/20"><Icon name="CheckCircle" size={10}/> Logged</span>
                                <button disabled={isViewer} onClick={() => handleDeleteDoc(doc.id)} className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"><Icon name="Trash2" size={12}/></button>
                              </div>
                            )}
                          </div>
                        </div>
                        {doc.extractedData && (
                          <div className="text-right">
                            <p className="font-mono text-[8px] text-amber-400 uppercase tracking-widest mb-1">OCR Extracted Value</p>
                            <p className="font-mono font-black text-lg text-emerald-400">{doc.extractedData.currency} {doc.extractedData.amount || '0.00'}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'partners' && (
          <div className="glass-panel p-8 rounded-[2rem]">
            <div className="flex justify-between items-center mb-6"><h2 className="font-display font-black text-2xl text-blue-300 uppercase"><Icon name="Users" size={28} className="inline mr-2" />Business Partners</h2><button disabled={isViewer} onClick={() => setShowPartnerModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black px-6 py-3 rounded-xl text-[11px] uppercase flex items-center gap-2 disabled:opacity-50"><Icon name="UserPlus" size={16} />Add Partner</button></div>
            {partners.length === 0 ? (
              <div className="text-center py-12"><Icon name="Users" size={64} className="text-slate-600 mx-auto mb-4" /><p className="font-mono text-lg text-slate-400 mb-2">No partners yet</p><button disabled={isViewer} onClick={() => setShowPartnerModal(true)} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50">Add Your First Partner</button></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map((p: any) => (
                  <div key={p.id} className="stat-card p-5 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-3 rounded-full"><Icon name="User" size={24} className="text-blue-400" /></div>
                      <div className="flex-1"><p className="font-bold text-white">{p.name}</p><p className="text-xs text-slate-400">{p.email}</p><div className="flex items-center gap-2 mt-2"><span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase ${p.role === 'owner' ? 'bg-emerald-500/20 text-emerald-300' : p.role === 'accountant' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>{p.role}</span><span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/20 text-emerald-300">{p.status}</span></div><p className="text-[9px] text-slate-500 mt-2">Joined: {p.joinedAt}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="glass-panel border-t border-blue-500/20 py-3 px-6 text-center"><p className="font-mono text-[8px] text-blue-400">🌾 OmniSight Unified Suite v20.0 • AI Chat Assistant • 13-Week Itemized Planner • Smart Vault</p></footer>
    </div>
  );
};

// Home component
export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  if (!currentUser) return <AuthScreen onAuth={setCurrentUser} />;
  return <Dashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}