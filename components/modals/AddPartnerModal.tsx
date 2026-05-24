'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { Partner } from '@/lib/types';

interface Props {
  onClose: () => void;
  onAdd: (partner: Partner) => void;
}

export default function AddPartnerModal({ onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Partner['role']>('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ id: Date.now(), name, email, role, status: 'active', joinedAt: new Date().toISOString().split('T')[0] });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md animate-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-black text-xl text-blue-300">Add Business Partner</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm" placeholder="John Farmer" />
          </div>
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 p-4 glass-input rounded-xl text-sm" placeholder="partner@example.com" />
          </div>
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as Partner['role'])} className="w-full mt-1 p-4 glass-input rounded-xl text-sm">
              <option value="owner">🌾 Co-Owner</option>
              <option value="accountant">📊 Accountant</option>
              <option value="viewer">👁️ Staff (View Only)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-3 rounded-xl text-[11px] uppercase">Add Partner</button>
            <button type="button" onClick={onClose} className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-[11px] uppercase">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
