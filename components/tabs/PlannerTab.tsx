'use client';
import { Calendar, BarChart2, TrendingUp, Brain, Lightbulb, Target } from 'lucide-react';
import VarianceChart from '@/components/charts/VarianceChart';
import BalanceChart from '@/components/charts/BalanceChart';
import type { Plan, PlannerMetrics, BudgetAnalysis } from '@/lib/types';

interface Props {
  plan: Plan;
  setPlan: (p: Plan) => void;
  plannerMetrics: PlannerMetrics;
  budgetAnalysis: BudgetAnalysis;
  quickFill: { budgetInflow: string; budgetOutflow: string };
  setQuickFill: (q: { budgetInflow: string; budgetOutflow: string }) => void;
  handleQuickFill: () => void;
  resetPlan: () => void;
  isViewer: boolean;
}

const riskColors = {
  low:      { wrap: 'bg-emerald-500/10 border-emerald-500/30', icon: 'bg-emerald-500/20 text-emerald-400', badge: 'bg-emerald-500/30 text-emerald-300' },
  medium:   { wrap: 'bg-amber-500/10 border-amber-500/30',    icon: 'bg-amber-500/20 text-amber-400',     badge: 'bg-amber-500/30 text-amber-300' },
  high:     { wrap: 'bg-orange-500/10 border-orange-500/30',  icon: 'bg-orange-500/20 text-orange-400',   badge: 'bg-orange-500/30 text-orange-300' },
  critical: { wrap: 'bg-rose-500/10 border-rose-500/30',      icon: 'bg-rose-500/20 text-rose-400',       badge: 'bg-rose-500/30 text-rose-300' },
};

export default function PlannerTab({
  plan, setPlan, plannerMetrics, budgetAnalysis,
  quickFill, setQuickFill, handleQuickFill, resetPlan, isViewer,
}: Props) {
  const rc = riskColors[budgetAnalysis.riskLevel];

  const updateWeek = (idx: number, field: keyof Plan['weeks'][0], value: string) => {
    const weeks = [...plan.weeks];
    weeks[idx] = { ...weeks[idx], [field]: value };
    setPlan({ ...plan, weeks });
  };

  return (
    <div className="glass-panel p-8 rounded-[2rem]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-black text-2xl text-blue-300 uppercase flex items-center gap-2">
          <Calendar size={28} className="text-blue-400" /> 13-Week Budget Planner
        </h2>
        <div className="flex gap-3">
          <button disabled={isViewer} onClick={resetPlan}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">
            Reset
          </button>
          {plannerMetrics.crashWeek && (
            <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 px-4 py-2 rounded-xl font-mono text-xs font-bold animate-pulse">
              ⚠️ Cash Shortage: Week {plannerMetrics.crashWeek}
            </div>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="text-[10px] font-black text-blue-300 uppercase block mb-2">Starting Cash ($)</label>
          <input type="number" disabled={isViewer} value={plan.opening}
            onChange={e => setPlan({ ...plan, opening: parseFloat(e.target.value) || 0 })}
            className="w-full p-3 glass-input rounded-xl font-mono" />
        </div>
        <div>
          <label className="text-[10px] font-black text-amber-400 uppercase block mb-2">Tax Rate %</label>
          <input type="number" disabled={isViewer} value={plan.taxRate}
            onChange={e => setPlan({ ...plan, taxRate: parseFloat(e.target.value) || 0 })}
            className="w-full p-3 glass-input rounded-xl font-mono border-amber-500/30" />
        </div>
        <div>
          <label className="text-[10px] font-black text-emerald-400 uppercase block mb-2">Quick Budget In</label>
          <input type="number" disabled={isViewer} value={quickFill.budgetInflow}
            onChange={e => setQuickFill({ ...quickFill, budgetInflow: e.target.value })}
            className="w-full p-3 glass-input rounded-xl font-mono" placeholder="All weeks" />
        </div>
        <div>
          <label className="text-[10px] font-black text-rose-400 uppercase block mb-2">Quick Budget Out</label>
          <input type="number" disabled={isViewer} value={quickFill.budgetOutflow}
            onChange={e => setQuickFill({ ...quickFill, budgetOutflow: e.target.value })}
            className="w-full p-3 glass-input rounded-xl font-mono" placeholder="All weeks" />
        </div>
        <div className="flex items-end">
          <button disabled={isViewer} onClick={handleQuickFill}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[10px] uppercase disabled:opacity-50">
            Apply to All
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {plan.weeks.map((w, idx) => {
          const weekData = plannerMetrics.weeksMapped[idx];
          const isNegative = weekData.balance < 0;
          const hasActuals = w.actualInflow !== '' || w.actualOutflow !== '';
          return (
            <div key={w.week} className={`p-3 rounded-xl border ${isNegative ? 'border-rose-500/50 bg-rose-500/10' : hasActuals ? 'border-blue-500/30 bg-blue-900/20' : 'border-blue-500/20 bg-blue-900/20'}`}>
              <div className="font-mono text-[10px] font-black text-blue-300 text-center mb-2">Week {w.week}</div>
              <div className="space-y-1.5">
                <input type="number" disabled={isViewer} value={w.budgetInflow}
                  onChange={e => updateWeek(idx, 'budgetInflow', e.target.value)}
                  className="w-full p-1.5 glass-input rounded text-[9px] font-mono text-center text-emerald-300" placeholder="Budget In" />
                <input type="number" disabled={isViewer} value={w.budgetOutflow}
                  onChange={e => updateWeek(idx, 'budgetOutflow', e.target.value)}
                  className="w-full p-1.5 glass-input rounded text-[9px] font-mono text-center text-rose-300" placeholder="Budget Out" />
                <input type="number" disabled={isViewer} value={w.actualInflow}
                  onChange={e => updateWeek(idx, 'actualInflow', e.target.value)}
                  className="w-full p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-mono text-center text-emerald-300 disabled:opacity-50" placeholder="Actual In" />
                <input type="number" disabled={isViewer} value={w.actualOutflow}
                  onChange={e => updateWeek(idx, 'actualOutflow', e.target.value)}
                  className="w-full p-1.5 bg-rose-500/10 border border-rose-500/30 rounded text-[9px] font-mono text-center text-rose-300 disabled:opacity-50" placeholder="Actual Out" />
              </div>
              <div className="mt-2 pt-2 border-t border-blue-500/20 flex justify-between text-[8px] font-mono">
                <span className="text-amber-400">Tax: ${weekData.tax.toFixed(0)}</span>
                <span className={weekData.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>Var: ${weekData.variance.toFixed(0)}</span>
              </div>
              <div className={`mt-1 text-center font-mono text-xs font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                Bal: ${weekData.balance.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-mono text-sm text-blue-300 mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-blue-400" /> Weekly Variance</h3>
          <div className="h-64"><VarianceChart weeks={plan.weeks} plannerMetrics={plannerMetrics} /></div>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-mono text-sm text-blue-300 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-400" /> Cumulative Balance</h3>
          <div className="h-64"><BalanceChart weeks={plan.weeks} plannerMetrics={plannerMetrics} opening={plan.opening} /></div>
        </div>
      </div>

      {/* FinBERT Feasibility */}
      <div className="space-y-6">
        <div className={`p-6 rounded-2xl border ${rc.wrap}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${rc.icon}`}><Brain size={32} /></div>
            <div className="flex-1">
              <h3 className="font-display font-black text-lg text-white mb-2 flex items-center gap-3">
                FinBERT Feasibility
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono ${rc.badge}`}>
                  Score: {budgetAnalysis.feasibilityScore.toFixed(0)}/100
                </span>
              </h3>
              <p className="text-sm text-slate-300">{budgetAnalysis.analysis}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-mono text-sm text-blue-300 mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-amber-400" /> Recommendations</h4>
            <ul className="space-y-3">
              {budgetAnalysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-emerald-400">▶</span>{rec}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-mono text-sm text-blue-300 mb-4 flex items-center gap-2"><Target size={18} className="text-blue-400" /> Key Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-2 bg-blue-900/30 rounded-lg">
                <span>Budget Ratio</span>
                <span className={`font-mono font-bold ${budgetAnalysis.budgetRatio >= 1.2 ? 'text-emerald-400' : budgetAnalysis.budgetRatio >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {budgetAnalysis.budgetRatio.toFixed(2)}x
                </span>
              </div>
              {budgetAnalysis.hasActuals && (
                <div className="flex justify-between p-2 bg-blue-900/30 rounded-lg">
                  <span>Actual Ratio</span>
                  <span className={`font-mono font-bold ${budgetAnalysis.actualRatio >= 1.2 ? 'text-emerald-400' : budgetAnalysis.actualRatio >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {budgetAnalysis.actualRatio.toFixed(2)}x
                  </span>
                </div>
              )}
              <div className="flex justify-between p-2 bg-blue-900/30 rounded-lg">
                <span>Final Balance</span>
                <span className={`font-mono font-bold ${plannerMetrics.finalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${plannerMetrics.finalBalance.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-blue-900/30 rounded-lg">
                <span>Total Tax</span>
                <span className="font-mono font-bold text-amber-400">${plannerMetrics.totalTax.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
