export interface Transaction {
  id: string;
  userId: string;
  type: 'inflow' | 'outflow';
  desc: string;
  currency: 'USD' | 'ZiG';
  amount_cents: number;
  timestamp: number;
  sourceDocId?: string;
}

export interface Partner {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'accountant' | 'viewer';
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface PlanWeek {
  week: number;
  budgetInflow: string;
  budgetOutflow: string;
  actualInflow: string;
  actualOutflow: string;
}

export interface Plan {
  opening: number;
  taxRate: number;
  weeks: PlanWeek[];
}

export interface ExtractedData {
  amount: string;
  currency: 'USD' | 'ZiG';
  type: 'inflow' | 'outflow';
}

export interface ScannedDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  extractedData: ExtractedData;
  status: string;
  isRecorded: boolean;
  txId?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export interface Metrics {
  usdIn: number;
  usdOut: number;
  zigIn: number;
  zigOut: number;
  totalInUSD: number;
  totalOutUSD: number;
  usdNet: number;
  zigNet: number;
  ratio: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

export interface WeekMapped {
  week: number;
  balance: number;
  tax: number;
  variance: number;
  budgetNet: number;
  actualNet: number;
}

export interface PlannerMetrics {
  weeksMapped: WeekMapped[];
  finalBalance: number;
  totalTax: number;
  crashWeek: number | null;
}

export interface HealthInfo {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'OPTIMAL' | 'STABLE' | 'CONCERNING';
}

export interface Pattern {
  type: string;
  description: string;
}

export interface Trends {
  direction: 'up' | 'down' | 'stable';
  change: string;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  action: string;
  simpleAction: string;
}

export interface SimpleLanguage {
  status: string;
  advice: string;
}

export interface ForecastItem {
  month: number;
  projectedBalance: number;
  confidence: number;
}

export interface AIAnalysis {
  insight: string;
  patterns: Pattern[];
  trends: Trends;
  health: HealthInfo;
  recommendations: Recommendation[];
  simpleLanguage: SimpleLanguage;
  confidence: number;
  forecast: ForecastItem[];
}

export interface BudgetAnalysis {
  feasibilityScore: number;
  analysis: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  budgetRatio: number;
  actualRatio: number;
  hasActuals: boolean;
}

export interface ThemeColors {
  text: string;
  bg: string;
  border: string;
  card: string;
}

export interface TxForm {
  type: 'inflow' | 'outflow';
  desc: string;
  currency: 'USD' | 'ZiG';
  amount: string;
  date: string;
}

export type TabId = 'journal' | 'planner' | 'analytics' | 'si60' | 'vault' | 'partners';

export interface ScanVerifyState {
  file: File;
  suggestedAmount: string;
}
