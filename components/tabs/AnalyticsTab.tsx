'use client';
import { BrainCircuit } from 'lucide-react';
import type { AIAnalysis, ThemeColors } from '@/lib/types';

interface Props {
  aiAnalysis: AIAnalysis;
  theme: ThemeColors;
}

export default function AnalyticsTab({ aiAnalysis, theme }: Props) {
  return (
    <div className="space-y-6">
      <div className={`glass-panel p-8 rounded-[2rem] border ${theme.border} ${theme.bg} transition-colors duration-500`}>
        <h2 className="font-display font-black text-2xl text-white uppercase mb-6 flex items-center gap-2">
          <BrainCircuit size={28} /> AI Business Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card p-6 rounded-2xl text-center">
            <p className="font-mono text-[10px] text-blue-300 uppercase mb-2">Health Grade</p>
            <p className={`text-6xl font-black ${theme.text}`}>{aiAnalysis.health.grade}</p>
            <p className="text-sm text-slate-400 mt-2">{aiAnalysis.health.status}</p>
          </div>

          <div className="stat-card p-6 rounded-2xl">
            <p className="font-mono text-[10px] text-blue-300 uppercase mb-3">Patterns</p>
            {aiAnalysis.patterns.map((p, i) => (
              <div key={i} className="mb-2 p-2 bg-slate-900/30 rounded-lg">
                <p className={`text-xs font-bold ${theme.text}`}>{p.type}</p>
                <p className="text-[10px] text-slate-400">{p.description}</p>
              </div>
            ))}
          </div>

          <div className="stat-card p-6 rounded-2xl">
            <p className="font-mono text-[10px] text-blue-300 uppercase mb-3">Sales Trend</p>
            <div className="text-center">
              <p className={`text-4xl font-black ${aiAnalysis.trends.direction === 'up' ? 'text-emerald-400' : aiAnalysis.trends.direction === 'down' ? 'text-rose-400' : 'text-amber-400'}`}>
                {aiAnalysis.trends.direction === 'up' ? '↑' : aiAnalysis.trends.direction === 'down' ? '↓' : '→'} {aiAnalysis.trends.change}%
              </p>
              <p className="text-sm text-slate-400 mt-2">vs last week</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/30 rounded-2xl">
          <h3 className="font-mono text-sm text-blue-300 mb-4">💡 Smart Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiAnalysis.recommendations.map((rec, i) => (
              <div key={i} className={`p-4 rounded-xl border ${rec.priority === 'high' ? 'border-rose-500/30 bg-rose-500/10' : rec.priority === 'medium' ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                <p className="font-bold text-white">{rec.action}</p>
                <p className={`text-xs font-mono mt-1 ${theme.text}`}>{rec.simpleAction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
