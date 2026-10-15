// ==============================================================================
// TataDana Native Report & Export Engine (PDF & Excel)
// Generates beautifully branded Fintech financial statements on-demand
// ==============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction } from '@/types/database';

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  transactionCount: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
}

export function calculateReportSummary(transactions: Transaction[]): ReportSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = new Map<string, number>();

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
      const cat = tx.category_name || 'Lain-lain';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + tx.amount);
    }
  });

  const netCashflow = totalIncome - totalExpense;

  const topCategories = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalIncome,
    totalExpense,
    netCashflow,
    transactionCount: transactions.length,
    topCategories,
  };
}

export function generateExcelReport(
  transactions: Transaction[],
  userName: string,
  periodTitle: string
): Blob {
  const summary = calculateReportSummary(transactions);

  // Sheet 1: Transaksi
  const txData = transactions.map((t, idx) => ({
    No: idx + 1,
    Tanggal: new Date(t.transaction_date).toLocaleDateString('id-ID'),
    Jenis: t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
    Kategori: t.category_name || '-',
    Dompet: t.wallet_name || '-',
    Nominal: t.amount,
    Catatan: t.description,
    Sumber: t.source,
  }));

  const wb = XLSX.utils.book_new();
  const wsTx = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

  // Sheet 2: Ringkasan
  const summaryData = [
    { Parameter: 'Nama Pengguna', Nilai: userName },
    { Parameter: 'Periode Laporan', Nilai: periodTitle },
    { Parameter: 'Total Pemasukan (IDR)', Nilai: summary.totalIncome },
    { Parameter: 'Total Pengeluaran (IDR)', Nilai: summary.totalExpense },
    { Parameter: 'Net Cashflow (IDR)', Nilai: summary.netCashflow },
    { Parameter: 'Jumlah Transaksi', Nilai: summary.transactionCount },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Keuangan');

  // Generate ArrayBuffer and Blob
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generatePDFReport(
  transactions: Transaction[],
  userName: string,
  periodTitle: string
): Blob {
  const doc = new jsPDF();
  const summary = calculateReportSummary(transactions);

  // Header Branding
  doc.setFillColor(249, 115, 22); // Orange #F97316
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('TataDana — Laporan Keuangan Pribadi', 14, 15);

  // Document Info
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.text(`Pengguna: ${userName}`, 14, 32);
  doc.text(`Periode: ${periodTitle}`, 14, 38);
  doc.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')} WIB`, 14, 44);

  // Summary Metrics Box
  doc.setFillColor(254, 243, 199); // Soft yellow/amber
  doc.roundedRect(14, 48, 182, 22, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text(`Total Pemasukan: Rp${summary.totalIncome.toLocaleString('id-ID')}`, 20, 56);
  doc.text(`Total Pengeluaran: Rp${summary.totalExpense.toLocaleString('id-ID')}`, 80, 56);
  doc.text(`Net Cashflow: Rp${summary.netCashflow.toLocaleString('id-ID')}`, 140, 56);
  doc.text(`Total Catatan: ${summary.transactionCount} Transaksi`, 20, 64);

  // Table Data
  const tableRows = transactions.map((t, idx) => [
    (idx + 1).toString(),
    new Date(t.transaction_date).toLocaleDateString('id-ID'),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.category_name || '-',
    t.wallet_name || '-',
    `Rp${t.amount.toLocaleString('id-ID')}`,
    t.description.length > 25 ? t.description.substring(0, 25) + '...' : t.description,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Nominal', 'Catatan']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Output as Blob
  return doc.output('blob');
}
