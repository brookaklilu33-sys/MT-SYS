import * as XLSX from 'xlsx';
import { Sale, TransferOut, FloatReconciliationSummary, Shop, AuditLog } from '../types';

interface ExportExcelOptions {
  shopName: string;
  shopCode: string;
  monthKey: string;
  sales: Sale[];
  transfers: TransferOut[];
  summary: FloatReconciliationSummary;
  auditLogs: AuditLog[];
}

export function exportShopLedgerToExcel({
  shopName,
  shopCode,
  monthKey,
  sales,
  transfers,
  summary,
  auditLogs
}: ExportExcelOptions) {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: SALES & FLOAT RECONCILIATION LEDGER ---
  const sheetData: any[][] = [];

  // Title rows
  sheetData.push(['MODERNTECH SHOP ERP — MULTI-BRANCH SALES & FLOAT RECONCILIATION REPORT']);
  sheetData.push([`Shop / Branch: ${shopName} (${shopCode})`, '', `Reporting Month: ${monthKey}`, '', `Exported: ${new Date().toLocaleString()}`]);
  sheetData.push([]); // blank line

  // Section 1: Float Funding & Transfer Out Table Header
  sheetData.push(['1. FLOAT FUNDING & HQ ALLOCATIONS (TRANSFER OUT / PURCHASES)']);
  sheetData.push(['Ref #', 'Type', 'Reference No', 'Date', 'Product ITEM', 'Quantity', 'Amount (ETB)', 'Notes', 'Authorizing Admin']);
  
  // Beginning Balance Row
  sheetData.push([
    1,
    'BBF',
    'Beginning Balance',
    `${monthKey}-01`,
    'FLOAT / MPESA',
    1,
    summary.openingBalance,
    'Opening float balance carried forward',
    'System / HQ'
  ]);

  // Transfer Out Rows
  transfers.forEach((to, idx) => {
    sheetData.push([
      idx + 2,
      'Transfer Out (HQ)',
      to.refNumber,
      to.date,
      to.productName || 'FLOAT',
      1,
      to.amount,
      to.notes || 'Float allocated by Moderntech Admin',
      to.createdBy || 'Admin'
    ]);
  });

  // Transfer Out Total
  sheetData.push(['', '', 'TOTAL TRANSFER OUT / PURCHASES:', '', '', '', summary.totalTransferOut, '', '']);
  sheetData.push([]); // blank line

  // Section 2: Daily Sales Ledger
  sheetData.push(['2. DAILY SALES TRANSACTION LEDGER']);
  sheetData.push([
    'Ref #',
    'Shop Name',
    'District',
    'Invoice / Ref #',
    'Product ITEM',
    'Sales Date',
    'Quantity',
    'Unit Price (ETB)',
    'Total Sales (ETB)',
    'Bank Deposited (ETB)',
    'Variance (ETB)',
    'Reconciliation Status',
    'Attached Receipts',
    'Encoder / Cashier',
    'Last Updated'
  ]);

  sales.forEach((s, idx) => {
    sheetData.push([
      idx + 1,
      s.shopName || shopName,
      s.districtName || 'General',
      s.invoiceNumber,
      s.productName || 'FLOAT',
      s.salesDate,
      s.quantity,
      s.unitPrice,
      s.salesAmount,
      s.totalDeposited,
      s.depositDifference,
      s.status.toUpperCase(),
      (s.invoiceImages?.length || 0) + (s.bankDeposits?.length || 0),
      s.createdByName || s.createdBy,
      s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''
    ]);
  });

  // Sales Totals
  const totalQty = sales.reduce((sum, s) => sum + (s.quantity || 1), 0);
  sheetData.push([
    'TOTAL',
    '',
    '',
    `${sales.length} Invoices`,
    '',
    '',
    totalQty,
    '',
    summary.totalSales,
    summary.totalDeposited,
    summary.unreconciledDepositAmount,
    '',
    '',
    '',
    ''
  ]);

  sheetData.push([]); // blank line

  // Section 3: Monthly Float Reconciliation Summary
  sheetData.push(['3. PURCHASE IN OUT AND SALES SUMMARY FOR THE MONTH']);
  sheetData.push([
    'BBF (Opening)',
    'Transfer Out (TO)',
    'Total Sales',
    'Closing SOH',
    'ACTSOH',
    `Up Front Commission (${(summary.commissionRate * 100).toFixed(1)}%)`,
    'Difference',
    'Carried Forward (C/F)',
    'Reconciliation Status'
  ]);

  sheetData.push([
    summary.openingBalance,
    summary.totalTransferOut,
    summary.totalSales,
    summary.closingBalance,
    '-',
    summary.commissionAmount,
    summary.difference,
    summary.closingBalance,
    summary.status
  ]);

  sheetData.push([]);
  sheetData.push(['* Formula: SOH = BBF + Transfer Out - Total Sales']);
  sheetData.push(['* Formula: Up Front = 1% * Transfer Out (or Total Sales based on HQ policy)']);
  sheetData.push(['* Shortage Rule: SOH > Agent Commission => Shortage | SOH < Agent Commission => Overage']);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Ref #
    { wch: 18 }, // Shop
    { wch: 16 }, // District
    { wch: 18 }, // Invoice #
    { wch: 16 }, // Product
    { wch: 14 }, // Date
    { wch: 10 }, // Qty
    { wch: 16 }, // Unit Price
    { wch: 18 }, // Total Sales
    { wch: 18 }, // Bank Deposited
    { wch: 16 }, // Variance
    { wch: 20 }, // Status
    { wch: 16 }, // Receipts
    { wch: 20 }, // Encoder
    { wch: 14 }  // Updated
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sales & Float Ledger');

  // --- SHEET 2: AUDIT LOG TRAIL ---
  if (auditLogs && auditLogs.length > 0) {
    const auditData: any[][] = [];
    auditData.push(['MODERNTECH SHOP ERP — AUDIT TRAIL LOG']);
    auditData.push([`Shop: ${shopName}`, '', `Month: ${monthKey}`, '', `Total Events: ${auditLogs.length}`]);
    auditData.push([]);
    auditData.push(['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Performed By', 'User Email', 'Details / Description', 'Correction Reason']);

    auditLogs.forEach((log) => {
      auditData.push([
        new Date(log.timestamp).toLocaleString(),
        log.action,
        log.entityType,
        log.entityId,
        log.performedBy,
        log.performedByEmail,
        log.details,
        log.reason || '-'
      ]);
    });

    const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
    wsAudit['!cols'] = [
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 26 },
      { wch: 45 },
      { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Trail');
  }

  // Trigger file download
  const safeFilename = `Moderntech_${shopCode || 'Shop'}_Ledger_${monthKey}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}
