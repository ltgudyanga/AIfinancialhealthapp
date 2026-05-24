'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import type { Transaction } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function TrendChart({ transactions }: { transactions: Transaction[] }) {
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dayStart = new Date(d).setHours(0, 0, 0, 0);
    const dayEnd = new Date(d).setHours(23, 59, 59, 999);
    const dayTx = transactions.filter(t => t.timestamp >= dayStart && t.timestamp <= dayEnd);
    return {
      date: new Date(dayStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      inflow: dayTx.filter(t => t.type === 'inflow').reduce((acc, t) => acc + t.amount_cents / 100, 0),
      outflow: dayTx.filter(t => t.type === 'outflow').reduce((acc, t) => acc + t.amount_cents / 100, 0),
    };
  });

  const netValues = dailyData.map(d => d.inflow - d.outflow);
  const trend = netValues.map((_, i) => {
    const w = netValues.slice(Math.max(0, i - 6), i + 1);
    return w.reduce((a, b) => a + b, 0) / w.length;
  });

  const data = {
    labels: dailyData.map(d => d.date),
    datasets: [
      { label: 'Money In', data: dailyData.map(d => d.inflow), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true },
      { label: 'Money Out', data: dailyData.map(d => d.outflow), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true },
      { label: 'Net Cashflow', data: netValues, borderColor: '#3b82f6', borderWidth: 3, tension: 0.4, fill: false, pointRadius: 3 },
      { label: '7-Day Trend', data: trend, borderColor: '#f59e0b', borderWidth: 2, tension: 0.4, fill: false, pointRadius: 0, borderDash: [5, 5] },
    ],
  };

  return (
    <div className="w-full h-80">
      <Line data={data as any} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1', font: { family: 'JetBrains Mono', size: 10 } } } },
        scales: {
          x: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(59,130,246,0.1)' }, ticks: { color: '#94a3b8', callback: (v: any) => '$' + v } },
        },
      }} />
    </div>
  );
}
