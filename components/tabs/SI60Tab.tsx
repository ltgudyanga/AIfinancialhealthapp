'use client';
import { ShieldCheck, CheckCircle, Lock } from 'lucide-react';

interface SI60Data {
  cash: number;
  inventory: number;
  receivables: number;
}

interface Props {
  si60Data: SI60Data;
  setSi60Data: (d: SI60Data) => void;
  si60Total: number;
  convertedZiG: number;
  isSi60Sealed: boolean;
  handleSealSi60: () => void;
  isViewer: boolean;
}

const SI60_REQUIREMENTS = [
  'Revalue ZWL assets at official rate of 2498.7242',
  'Convert ZWL cash within 21 days',
  'Update all accounting records to ZiG base',
  'File transitional return with Zimra',
];

export default function SI60Tab({ si60Data, setSi60Data, si60Total, convertedZiG, isSi60Sealed, handleSealSi60, isViewer }: Props) {
  const disabled = isSi60Sealed || isViewer;

  return (
    <div className="glass-panel p-10 rounded-[2rem] max-w-4xl mx-auto">
      <h2 className="font-display font-black text-2xl text-amber-400 uppercase mb-2 flex items-center gap-2">
        <ShieldCheck size={28} /> Protocol SI-60: Day Zero Audit
      </h2>
      <p className="font-mono text-xs text-slate-400 mb-8">
        Statutory Instrument 60 of 2024 – ZiG Currency Transition Calculator
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[
            { label: 'Legacy ZWL Cash', field: 'cash' },
            { label: 'Legacy ZWL Inventory Val', field: 'inventory' },
            { label: 'Legacy ZWL Receivables', field: 'receivables' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="font-mono text-[10px] text-blue-300 uppercase block mb-2">{label}</label>
              <input
                type="number"
                disabled={disabled}
                value={si60Data[field as keyof SI60Data]}
                onChange={e => setSi60Data({ ...si60Data, [field]: e.target.value })}
                className="w-full p-3 glass-input rounded-xl"
              />
            </div>
          ))}
        </div>

        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-6">
          <div className="font-mono text-[10px] text-amber-400 uppercase mb-4">Live Conversion Calculation</div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-amber-500/20 pb-2">
              <span className="font-mono text-xs">Official SI-60 Rate</span>
              <span className="font-mono text-sm font-bold">2,498.7242 ZWL : 1 ZiG</span>
            </div>
            <div className="flex justify-between border-b border-amber-500/20 pb-2">
              <span className="font-mono text-xs">Total ZWL Value</span>
              <span className="font-mono text-sm">{si60Total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZWL</span>
            </div>
            <div className="flex justify-between pt-2 items-center">
              <span className="font-mono text-xs">Converted Value</span>
              <span className="font-mono text-3xl font-black text-amber-400">
                {convertedZiG.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZiG
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900/30 rounded-xl">
            <p className="font-mono text-[9px] text-blue-300 uppercase mb-2">Compliance Status</p>
            <p className={`font-bold text-sm flex items-center gap-1 ${isSi60Sealed ? 'text-blue-400' : 'text-emerald-400'}`}>
              {isSi60Sealed ? <Lock size={16} /> : <CheckCircle size={16} />}
              {isSi60Sealed ? 'Permanently Sealed' : 'Ready for Day Zero Transfer'}
            </p>
          </div>

          <button
            disabled={disabled}
            onClick={handleSealSi60}
            className={`w-full mt-6 text-white font-black py-3 rounded-xl text-[11px] uppercase transition-all ${isSi60Sealed ? 'bg-slate-700 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-amber-600 to-amber-800 hover:scale-[1.02]'}`}
          >
            {isSi60Sealed ? '🔒 Locked & Sealed' : '🔒 Seal SI-60 Declaration'}
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 rounded-xl">
        <h3 className="font-mono text-xs text-blue-300 mb-3">📋 SI-60 Requirements Guide</h3>
        <div className="space-y-2">
          {SI60_REQUIREMENTS.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
