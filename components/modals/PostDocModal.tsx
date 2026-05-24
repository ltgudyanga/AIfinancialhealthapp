'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { ScannedDocument } from '@/lib/types';

interface Props {
  doc: ScannedDocument;
  onClose: () => void;
  onConfirm: (doc: ScannedDocument, type: 'inflow' | 'outflow') => void;
}

export default function PostDocModal({ doc, onClose, onConfirm }: Props) {
  const [selectedType, setSelectedType] = useState<'inflow' | 'outflow'>(doc.extractedData.type || 'outflow');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 rounded-[2rem] w-full max-w-sm animate-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white">Post to Journal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-xs text-slate-300 mb-6 border-l-2 border-blue-500 pl-3">
          Scanned Document: {doc.name}<br />
          Verified Value: {doc.extractedData.currency} {doc.extractedData.amount}
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Confirm Transaction Type</label>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value as 'inflow' | 'outflow')} className="w-full mt-1 p-4 glass-input rounded-xl text-sm font-bold">
              <option value="inflow">💰 Cash Inflow (Income/Receipt)</option>
              <option value="outflow">💸 Cash Outflow (Expense/Payment)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => onConfirm(doc, selectedType)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-black uppercase transition-colors">
              Confirm &amp; Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
