'use client';
import { Users, UserPlus, User } from 'lucide-react';
import type { Partner } from '@/lib/types';

interface Props {
  partners: Partner[];
  isViewer: boolean;
  onAddClick: () => void;
}

export default function PartnersTab({ partners, isViewer, onAddClick }: Props) {
  return (
    <div className="glass-panel p-8 rounded-[2rem]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-black text-2xl text-blue-300 uppercase flex items-center gap-2">
          <Users size={28} /> Business Partners
        </h2>
        <button
          disabled={isViewer}
          onClick={onAddClick}
          className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black px-6 py-3 rounded-xl text-[11px] uppercase flex items-center gap-2 disabled:opacity-50"
        >
          <UserPlus size={16} /> Add Partner
        </button>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-12">
          <Users size={64} className="text-slate-600 mx-auto mb-4" />
          <p className="font-mono text-lg text-slate-400 mb-2">No partners yet</p>
          <button disabled={isViewer} onClick={onAddClick}
            className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50">
            Add Your First Partner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map(p => (
            <div key={p.id} className="stat-card p-5 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <User size={24} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase ${p.role === 'owner' ? 'bg-emerald-500/20 text-emerald-300' : p.role === 'accountant' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>
                      {p.role}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/20 text-emerald-300">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2">Joined: {p.joinedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
