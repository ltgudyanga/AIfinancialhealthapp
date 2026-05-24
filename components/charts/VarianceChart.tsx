'use client';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import type { PlanWeek, PlannerMetrics } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  weeks: PlanWeek[];
  plannerMetrics: PlannerMetrics;
}

export default function VarianceChart({ weeks, plannerMetrics }: Props) {
  const variances = weeks.map((_, idx) => plannerMetrics.weeksMapped[idx].variance);

  const data = {
    labels: weeks.map(w => `W${w.week}`),
    datasets: [{
      label: 'Variance ($)',
      data: variances,
      backgroundColor: variances.map(v => v >= 0 ? '#10b981' : '#ef4444'),
      borderRadius: 4,
    }],
  };

  return (
    <Bar data={data} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8', callback: (v: any) => '$' + v } },
      },
    }} />
  );
}
