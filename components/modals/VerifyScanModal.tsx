'use client';
import { useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import type { ExtractedData } from '@/lib/types';

interface Props {
  file: File;
  onClose: () => void;
  onConfirm: (data: ExtractedData) => void;
}

export default function VerifyScanModal({ file, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ amount: parseFloat(amount).toFixed(2), currency, type });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md animate-in border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
            <ScanLine size={24} className="text-amber-400" /> Verify Receipt Data
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6">
          <p className="text-sm text-amber-200">
            <strong>Manual Verification Required.</strong><br />
            Please enter the exact total from the scanned document below to ensure 100% accuracy.
          </p>
          <p className="text-xs font-mono text-amber-400/70 mt-2 truncate">File: {file.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Transaction Type</label>
            <select value={type} onChange={e => setType(e.target.value as 'inflow' | 'outflow')} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-bold">
              <option value="outflow">💸 Expense / Receipt (Money Out)</option>
              <option value="inflow">💰 Income / Invoice (Money In)</option>
            </select>
          </div>
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'ZiG')} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-bold">
                <option value="USD">USD $</option>
                <option value="ZiG">ZiG</option>
              </select>
            </div>
            <div className="w-2/3">
              <label className="text-[10px] font-black text-emerald-400 uppercase ml-2">Exact Amount</label>
              <input
                type="number" step="0.01" required
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full mt-1 p-4 glass-input rounded-xl text-lg font-mono font-black text-emerald-400 focus:border-emerald-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black py-4 rounded-xl text-[12px] uppercase tracking-widest transition-all mt-4 shadow-lg shadow-emerald-900/50">
            Confirm &amp; Save to Vault
          </button>
        </form>
      </div>
    </div>
  );
}
