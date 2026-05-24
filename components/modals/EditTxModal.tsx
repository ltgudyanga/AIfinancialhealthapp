'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { Transaction, TxForm } from '@/lib/types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Transaction>) => void;
}

export default function EditTxModal({ transaction, onClose, onSave }: Props) {
  const [form, setForm] = useState<TxForm>({
    type:     transaction.type,
    desc:     transaction.desc,
    currency: transaction.currency,
    amount:   (transaction.amount_cents / 100).toString(),
    date:     new Date(transaction.timestamp).toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(transaction.id, {
      type:         form.type,
      desc:         form.desc,
      currency:     form.currency,
      amount_cents: Math.round(parseFloat(form.amount) * 100),
      timestamp:    new Date(form.date).getTime(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md animate-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-black text-xl text-blue-300">Edit Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-blue-900/30 rounded-xl">
            <button type="button" onClick={() => setForm({ ...form, type: 'inflow' })}
              className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase ${form.type === 'inflow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-blue-800/50'}`}>
              💰 Inflow
            </button>
            <button type="button" onClick={() => setForm({ ...form, type: 'outflow' })}
              className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase ${form.type === 'outflow' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-blue-800/50'}`}>
              💸 Outflow
            </button>
          </div>

          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full p-3 glass-input rounded-xl text-sm font-mono text-blue-300" required />

          <input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
            placeholder="Description" className="w-full p-3 glass-input rounded-xl text-sm" required />

          <div className="flex gap-3">
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value as 'USD' | 'ZiG' })}
              className="w-1/3 p-3 glass-input rounded-xl text-sm">
              <option value="USD">USD $</option>
              <option value="ZiG">ZiG Zg</option>
            </select>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="Amount" className="w-2/3 p-3 glass-input rounded-xl text-sm text-right" required />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-3 rounded-xl text-[11px] uppercase">
              Save Changes
            </button>
            <button type="button" onClick={onClose}
              className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-[11px] uppercase">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
