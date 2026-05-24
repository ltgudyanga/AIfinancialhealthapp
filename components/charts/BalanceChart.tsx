'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import type { PlanWeek, PlannerMetrics } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Props {
  weeks: PlanWeek[];
  plannerMetrics: PlannerMetrics;
  opening: number;
}

export default function BalanceChart({ weeks, plannerMetrics, opening }: Props) {
  const balances = [parseFloat(String(opening || 0)), ...plannerMetrics.weeksMapped.map(w => w.balance)];

  const data = {
    labels: ['Start', ...weeks.map(w => `W${w.week}`)],
    datasets: [{
      label: 'Cash Balance',
      data: balances,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: balances.map(b => b >= 0 ? '#10b981' : '#ef4444'),
      pointRadius: 4,
    }],
  };

  return (
    <Line data={data} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#cbd5e1' } } },
      scales: {
        x: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8', callback: (v: any) => '$' + v } },
      },
    }} />
  );
}
