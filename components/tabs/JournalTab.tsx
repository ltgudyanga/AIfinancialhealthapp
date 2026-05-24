'use client';
import { Brain } from 'lucide-react';
import TrendChart from '@/components/charts/TrendChart';
import type { Transaction, TxForm, Metrics, AIAnalysis, ThemeColors } from '@/lib/types';

interface Props {
  userTransactions: Transaction[];
  txForm: TxForm;
  setTxForm: (f: TxForm) => void;
  handleAddTx: (e: React.FormEvent) => void;
  handleClearJournal: () => void;
  isViewer: boolean;
  aiAnalysis: AIAnalysis | null;
  metrics: Metrics;
  theme: ThemeColors;
}

export default function JournalTab({
  userTransactions, txForm, setTxForm, handleAddTx,
  handleClearJournal, isViewer, aiAnalysis, metrics, theme,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column — entry form + recent list */}
      <div className="lg:col-span-4 space-y-6">
        <div className={`glass-panel p-6 rounded-[2rem] ${isViewer ? 'opacity-80' : ''}`}>
          <h2 className="font-mono text-[11px] text-blue-300 uppercase tracking-widest mb-4">✏️ Daily Entry</h2>
          <form onSubmit={handleAddTx} className="space-y-4">
            <div className="flex gap-2 p-1 bg-blue-900/30 rounded-xl">
              <button type="button" disabled={isViewer} onClick={() => setTxForm({ ...txForm, type: 'inflow' })}
                className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase ${txForm.type === 'inflow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-blue-800/50'}`}>
                💰 In
              </button>
              <button type="button" disabled={isViewer} onClick={() => setTxForm({ ...txForm, type: 'outflow' })}
                className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase ${txForm.type === 'outflow' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-blue-800/50'}`}>
                💸 Out
              </button>
            </div>
            <input type="date" disabled={isViewer} value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })}
              className="w-full p-3 glass-input rounded-xl text-sm font-mono text-blue-300" required />
            <input value={txForm.desc} disabled={isViewer} onChange={e => setTxForm({ ...txForm, desc: e.target.value })}
              placeholder="e.g. Mombe Sales, Fertilizer, Seed" className="w-full p-3 glass-input rounded-xl text-sm" required />
            <div className="flex gap-3">
              <select value={txForm.currency} disabled={isViewer} onChange={e => setTxForm({ ...txForm, currency: e.target.value as 'USD' | 'ZiG' })}
                className="w-1/3 p-3 glass-input rounded-xl text-sm">
                <option value="USD">USD $</option>
                <option value="ZiG">ZiG Zg</option>
              </select>
              <input type="number" step="0.01" disabled={isViewer} value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                placeholder="Amount" className="w-2/3 p-3 glass-input rounded-xl text-sm text-right" required />
            </div>
            <button type="submit" disabled={isViewer}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-3.5 rounded-xl text-[11px] uppercase disabled:opacity-50 disabled:cursor-not-allowed">
              Record Entry
            </button>
          </form>
        </div>

        <div className="glass-panel p-0 rounded-[2rem] flex flex-col h-[400px]">
          <div className="p-4 border-b border-blue-500/20 flex justify-between items-center">
            <h2 className="font-mono text-[11px] text-blue-300 uppercase">Recent Entries</h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] bg-blue-600/30 text-blue-300 px-2 py-1 rounded-full">{userTransactions.length}</span>
              <button disabled={isViewer} onClick={handleClearJournal}
                className="font-mono text-[9px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 px-2 py-1 rounded transition-colors uppercase disabled:opacity-50">
                Reset
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {userTransactions.length === 0
              ? <p className="text-center text-slate-500 text-xs py-10 font-mono">No entries recorded yet.</p>
              : userTransactions.slice(0, 8).map(t => (
                <div key={t.id} className="p-3 bg-blue-900/20 rounded-xl flex justify-between border border-blue-500/20">
                  <div>
                    <p className="font-bold text-sm text-slate-200 flex items-center gap-2">
                      {t.desc}
                      {t.sourceDocId && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[8px] uppercase border border-blue-500/30">Scanned</span>
                      )}
                    </p>
                    <p className="font-mono text-[8px] text-blue-400">{new Date(t.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-mono text-sm font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'inflow' ? '+' : '-'}{t.currency} {(t.amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Right column — AI panel + stats + chart */}
      <div className="lg:col-span-8 space-y-6">
        <div className={`glass-panel p-8 rounded-[2rem] border-l-4 ${theme.card} transition-colors duration-500`}>
          <div className="flex gap-6 items-center">
            <div className={`shrink-0 w-20 h-20 rounded-full flex items-center justify-center ${theme.text} ${theme.bg} transition-colors duration-500`}>
              <Brain size={40} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-black text-xl text-white mb-2">Rural FinBERT Analysis</h2>
              <p className="font-mono text-sm text-slate-300">{aiAnalysis?.insight || 'Record more transactions to enable AI insights.'}</p>
              {aiAnalysis?.simpleLanguage && (
                <p className={`mt-2 text-xs font-bold ${theme.text}`}>
                  🗣️ {aiAnalysis.simpleLanguage.status}: {aiAnalysis.simpleLanguage.advice}
                </p>
              )}
            </div>
          </div>

          {aiAnalysis && (
            <div className="mt-6 pt-5 border-t border-blue-500/20 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/10">
                <span className="text-[10px] text-blue-300 font-mono uppercase block mb-1">Cash Flow Ratio</span>
                <span className={`font-mono font-black ${metrics.ratio >= 1.5 ? 'text-emerald-400' : metrics.ratio >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {metrics.ratio.toFixed(2)}x
                </span>
              </div>
              <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/10">
                <span className="text-[10px] text-blue-300 font-mono uppercase block mb-1">Working Capital</span>
                <span className={`font-mono font-black ${metrics.usdNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${metrics.usdNet.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Health', value: `${aiAnalysis?.health?.score ?? '--'}%` },
            { label: 'Balance', value: `$${metrics.usdNet.toFixed(0)}`, color: metrics.usdNet >= 0 ? 'text-emerald-400' : 'text-rose-400' },
            { label: 'Inflow', value: `$${metrics.totalInUSD.toFixed(0)}`, color: 'text-emerald-400' },
            { label: 'Outflow', value: `$${metrics.totalOutUSD.toFixed(0)}`, color: 'text-rose-400' },
          ].map((s, i) => (
            <div key={i} className="stat-card p-5 rounded-2xl">
              <p className="font-mono text-[9px] text-blue-300 uppercase">{s.label}</p>
              <h3 className={`font-mono text-xl font-black ${s.color ?? 'text-white'}`}>{s.value}</h3>
            </div>
          ))}
        </div>

        <div className="glass-panel p-6 rounded-[2rem]">
          <h2 className="font-mono text-[11px] text-blue-300 uppercase mb-4">📈 Cashflow Trends</h2>
          <TrendChart transactions={userTransactions} />
        </div>
      </div>
    </div>
  );
}
