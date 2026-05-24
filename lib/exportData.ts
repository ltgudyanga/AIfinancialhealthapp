import Papa from 'papaparse';
import type { Transaction, Plan, PlannerMetrics } from './types';

// ── CSV ───────────────────────────────────────────────────────────────────

export function exportTransactionsCSV(transactions: Transaction[]) {
  const rows = transactions.map((t) => ({
    Date:        new Date(t.timestamp).toLocaleDateString(),
    Description: t.desc,
    Type:        t.type,
    Currency:    t.currency,
    Amount:      (t.amount_cents / 100).toFixed(2),
    Source:      t.sourceDocId ? 'Scanned' : 'Manual',
  }));
  triggerDownload(Papa.unparse(rows), 'journal.csv', 'text/csv');
}

export function exportBudgetCSV(plan: Plan, plannerMetrics: PlannerMetrics) {
  const rows = plan.weeks.map((w, i) => {
    const wm = plannerMetrics.weeksMapped[i];
    return {
      Week:       `W${w.week}`,
      'Budget In':  w.budgetInflow  || '0',
      'Budget Out': w.budgetOutflow || '0',
      'Actual In':  w.actualInflow  || '—',
      'Actual Out': w.actualOutflow || '—',
      Variance:    wm.variance.toFixed(2),
      Balance:     wm.balance.toFixed(2),
      Tax:         wm.tax.toFixed(2),
    };
  });
  triggerDownload(Papa.unparse(rows), 'budget-plan.csv', 'text/csv');
}

// ── PDF (dynamic import keeps jspdf out of the initial bundle) ────────────

export async function exportTransactionsPDF(transactions: Transaction[], userEmail: string) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text('OmniSight — Financial Journal', 14, 15);
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(`${userEmail}  |  Exported ${new Date().toLocaleDateString()}`, 14, 22);
  pdf.setTextColor(0);

  autoTable(pdf, {
    startY: 27,
    head: [['Date', 'Description', 'Type', 'Currency', 'Amount', 'Source']],
    body: transactions.map((t) => [
      new Date(t.timestamp).toLocaleDateString(),
      t.desc,
      t.type,
      t.currency,
      (t.amount_cents / 100).toFixed(2),
      t.sourceDocId ? 'Scanned' : 'Manual',
    ]),
    headStyles: { fillColor: [30, 58, 138] },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    styles: { fontSize: 8 },
  });

  pdf.save('journal.pdf');
}

export async function exportBudgetPDF(plan: Plan, plannerMetrics: PlannerMetrics) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const pdf = new jsPDF('landscape');
  pdf.setFontSize(16);
  pdf.text('OmniSight — 13-Week Budget Plan', 14, 15);
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(
    `Opening: $${plan.opening}  |  Tax: ${plan.taxRate}%  |  Final Balance: $${plannerMetrics.finalBalance.toFixed(0)}  |  Exported ${new Date().toLocaleDateString()}`,
    14, 22
  );
  pdf.setTextColor(0);

  autoTable(pdf, {
    startY: 27,
    head: [['Week', 'Budget In', 'Budget Out', 'Actual In', 'Actual Out', 'Variance', 'Tax', 'Balance']],
    body: plan.weeks.map((w, i) => {
      const wm = plannerMetrics.weeksMapped[i];
      return [
        `W${w.week}`,
        w.budgetInflow  || '—',
        w.budgetOutflow || '—',
        w.actualInflow  || '—',
        w.actualOutflow || '—',
        wm.variance.toFixed(0),
        wm.tax.toFixed(0),
        wm.balance.toFixed(0),
      ];
    }),
    headStyles: { fillColor: [30, 58, 138] },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    styles: { fontSize: 8 },
  });

  pdf.save('budget-plan.pdf');
}

// ── Helper ────────────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
