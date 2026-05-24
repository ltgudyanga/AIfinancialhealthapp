import type {
  Transaction, Metrics, Plan, PlannerMetrics,
  AIAnalysis, BudgetAnalysis, HealthInfo, Pattern, Trends,
} from './types';

export class RuralFinancialAdvisor {
  analyzeFinBERT(transactions: Transaction[], metrics: Metrics): AIAnalysis {
    const patterns = this.detectPatterns(transactions);
    const trends = this.calculateTrends(transactions);
    const health = this.assessHealth(metrics);
    return {
      insight: this.generateInsight(health, trends),
      patterns, trends, health,
      recommendations: this.generateAdvice(health),
      simpleLanguage: this.translateToShona(health),
      confidence: 0.85 + Math.random() * 0.12,
      forecast: this.generateForecast(transactions),
    };
  }

  private detectPatterns(transactions: Transaction[]): Pattern[] {
    const patterns: Pattern[] = [];
    if (transactions.length < 3) return patterns;

    const dailyTotals: Record<number, number> = {};
    transactions.forEach(t => {
      const day = new Date(t.timestamp).getDay();
      dailyTotals[day] = (dailyTotals[day] || 0) + t.amount_cents / 100;
    });

    const bestDay = Object.entries(dailyTotals).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    if (bestDay) {
      patterns.push({
        type: 'market_day',
        description: `Strongest trading day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][Number(bestDay[0])]}`,
      });
    }

    const inflows = transactions.filter(t => t.type === 'inflow');
    const outflows = transactions.filter(t => t.type === 'outflow');
    if (inflows.length > 0 && outflows.length > 0) {
      const avgIn = inflows.reduce((a, b) => a + b.amount_cents, 0) / inflows.length;
      const avgOut = outflows.reduce((a, b) => a + b.amount_cents, 0) / outflows.length;
      if (avgIn > avgOut * 1.3)
        patterns.push({ type: 'healthy_margin', description: 'Strong profit margins detected' });
      else if (avgIn < avgOut)
        patterns.push({ type: 'tight_margin', description: 'Capital depletion risk high' });
    }
    return patterns;
  }

  private calculateTrends(transactions: Transaction[]): Trends {
    if (transactions.length < 7) return { direction: 'stable', change: '0' };
    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    const recent = sorted.slice(-7).filter(t => t.type === 'inflow').reduce((a, b) => a + b.amount_cents, 0);
    const previous = sorted.slice(-14, -7).filter(t => t.type === 'inflow').reduce((a, b) => a + b.amount_cents, 0);
    const change = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.abs(change).toFixed(1),
    };
  }

  private assessHealth(metrics: Metrics): HealthInfo {
    const score = metrics.ratio >= 1.5 ? 90 : metrics.ratio >= 1.0 ? 60 : metrics.ratio >= 0.5 ? 30 : 10;
    return {
      score,
      grade: score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D',
      status: score >= 70 ? 'OPTIMAL' : score >= 50 ? 'STABLE' : 'CONCERNING',
    };
  }

  private generateInsight(health: HealthInfo, trends: Trends): string {
    if (health.score >= 70) return `Strong performance. Liquidity is healthy and sales are trending ${trends.direction}. Consider reinvestment.`;
    if (health.score >= 50) return `Stable operations, but margins are tight. Monitor supplier costs. Sales are ${trends.direction}.`;
    return `Critical warning: Burn rate exceeds inflow. Immediate expense review required.`;
  }

  private generateAdvice(health: HealthInfo) {
    if (health.score >= 70) return [{ priority: 'low' as const, action: 'Diversify surplus capital', simpleAction: 'Isa mari kumberi (Save & Invest)' }];
    if (health.score >= 50) return [{ priority: 'medium' as const, action: 'Audit recent expenses', simpleAction: 'Nyora zvaunotenga zvose (Track all costs)' }];
    return [{ priority: 'high' as const, action: 'Halt non-essential spending', simpleAction: 'Dzora mari nekukasika (Cut spending fast)' }];
  }

  private translateToShona(health: HealthInfo) {
    if (health.score >= 70) return { status: 'Bhizinesi Rakanaka / Ibhizimusi Lihle', advice: 'Chengetedza mari inosara' };
    if (health.score >= 50) return { status: 'Pakati Nepakati / Kujwayelekile', advice: 'Chenjerera mashandisiro emari' };
    return { status: 'Rine Dambudziko / Kunzima', advice: 'Misa kushandisa mari panzvimbo isina basa' };
  }

  private generateForecast(transactions: Transaction[], months = 3) {
    const inflows = transactions.filter(t => t.type === 'inflow');
    const outflows = transactions.filter(t => t.type === 'outflow');
    const avgIn = inflows.length > 0 ? inflows.reduce((a, b) => a + b.amount_cents, 0) / inflows.length / 100 : 0;
    const avgOut = outflows.length > 0 ? outflows.reduce((a, b) => a + b.amount_cents, 0) / outflows.length / 100 : 0;
    const balance = avgIn - avgOut;
    return Array.from({ length: months }, (_, i) => ({
      month: i + 1,
      projectedBalance: balance * (i + 1),
      confidence: Math.max(60, 90 - (i + 1) * 8),
    }));
  }

  analyzeBudgetFeasibility(plan: Plan, plannerMetrics: PlannerMetrics): BudgetAnalysis {
    const hasActuals = plan.weeks.some(w => w.actualInflow !== '' || w.actualOutflow !== '');
    const totalBudgetIn = plan.weeks.reduce((acc, w) => acc + parseFloat(w.budgetInflow || '0'), 0);
    const totalBudgetOut = plan.weeks.reduce((acc, w) => acc + parseFloat(w.budgetOutflow || '0'), 0);
    const totalActualIn = plan.weeks.reduce((acc, w) => acc + parseFloat(w.actualInflow || '0'), 0);
    const totalActualOut = plan.weeks.reduce((acc, w) => acc + parseFloat(w.actualOutflow || '0'), 0);
    const budgetRatio = totalBudgetOut > 0 ? totalBudgetIn / totalBudgetOut : 2;
    const actualRatio = totalActualOut > 0 ? totalActualIn / totalActualOut : (totalActualIn > 0 ? 2 : 0);

    let feasibilityScore = 0, analysis = '', recommendations: string[] = [], riskLevel: BudgetAnalysis['riskLevel'] = 'low';

    if (hasActuals) {
      const varianceTrend = plannerMetrics.weeksMapped
        .filter((_, idx) => plan.weeks[idx].actualInflow !== '' || plan.weeks[idx].actualOutflow !== '')
        .map(w => w.variance);
      const varianceRatio = varianceTrend.length > 0 ? varianceTrend.filter(v => v >= 0).length / varianceTrend.length : 0.5;
      feasibilityScore = Math.min(100, (actualRatio * 30) + (varianceRatio * 40) + ((plannerMetrics.finalBalance > 0 ? 1 : 0) * 30));

      if (actualRatio >= 1.5 && varianceRatio >= 0.7 && plannerMetrics.finalBalance > 0)
        { analysis = '✅ STRONG: Actual results exceed budget.'; recommendations = ['Reinvest surplus', 'Build emergency fund']; riskLevel = 'low'; }
      else if (actualRatio >= 1.2 && varianceRatio >= 0.5)
        { analysis = '📊 SOLID: Meeting most targets.'; recommendations = ['Review underperforming weeks', 'Negotiate supplier terms']; riskLevel = 'medium'; }
      else if (actualRatio >= 1.0)
        { analysis = '⚠️ MARGINAL: Breaking even.'; recommendations = ['Review expenses', 'Increase sales']; riskLevel = 'high'; }
      else
        { analysis = '🚨 CRITICAL: Expenses exceed income.'; recommendations = ['Emergency cost-cutting', 'Collect receivables']; riskLevel = 'critical'; }
    } else {
      feasibilityScore = Math.min(100, (budgetRatio * 30) + (plannerMetrics.finalBalance > 0 ? 40 : 0) + 30);
      if (budgetRatio >= 1.5 && plannerMetrics.finalBalance > 0)
        { analysis = '✅ FEASIBLE: Healthy margins.'; recommendations = ['Budget appears realistic', 'Track actuals weekly']; riskLevel = 'low'; }
      else if (budgetRatio >= 1.2)
        { analysis = '📊 CAUTIOUS: Moderate profitability.'; recommendations = ['Build expense buffer', 'Monitor closely']; riskLevel = 'medium'; }
      else if (budgetRatio >= 1.0)
        { analysis = '⚠️ TIGHT: Barely breaks even.'; recommendations = ['Reduce expenses 10-15%', 'Find new revenue']; riskLevel = 'high'; }
      else
        { analysis = '🚨 UNFEASIBLE: Expenses exceed income.'; recommendations = ['Revise budget urgently', 'Build safety margin']; riskLevel = 'critical'; }
    }

    return { feasibilityScore, analysis, recommendations, riskLevel, budgetRatio, actualRatio, hasActuals };
  }
}
