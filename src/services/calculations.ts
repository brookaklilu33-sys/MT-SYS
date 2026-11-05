import { FloatReconciliationSummary, Sale, TransferOut } from '../types';

export interface CalculationOptions {
  commissionRate?: number; // default 0.01 (1%)
  calculationBasis?: 'transfer_out' | 'total_sales';
}

/**
 * Calculates the complete Float reconciliation summary according to Moderntech business rules.
 * Closing Float Balance (SOH) = Opening Balance (BBF) + Total Transfer Out - Total Sales
 * Commission / 1% Up Front = commissionRate * (basis === 'transfer_out' ? Total Transfer Out : Total Sales)
 * Difference = Closing Float Balance - Commission
 */
export function calculateReconciliation(
  openingBalance: number,
  transfers: TransferOut[],
  sales: Sale[],
  options: CalculationOptions = {}
): FloatReconciliationSummary {
  const commissionRate = options.commissionRate ?? 0.01;
  const basis = options.calculationBasis ?? 'transfer_out';

  const totalTransferOut = transfers.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalSales = sales.reduce((sum, s) => sum + (Number(s.salesAmount) || 0), 0);
  const totalDeposited = sales.reduce((sum, s) => sum + (Number(s.totalDeposited) || 0), 0);

  const closingBalance = openingBalance + totalTransferOut - totalSales;

  const baseForCommission = basis === 'transfer_out' ? totalTransferOut : totalSales;
  const rawCommission = baseForCommission * commissionRate;
  const commissionAmount = Math.round(rawCommission);

  const difference = closingBalance - commissionAmount;

  let status: 'Balanced' | 'Shortage' | 'Overage' = 'Balanced';
  if (difference > 0) {
    status = 'Shortage'; // SOH > Agent Commission
  } else if (difference < 0) {
    status = 'Overage'; // SOH < Agent Commission
  }

  const invoiceCount = sales.length;
  const pendingEvidenceCount = sales.filter(
    (s) => s.status === 'evidence_pending' || s.status === 'unreconciled' || (!s.invoiceImages?.length && !s.bankDeposits?.length)
  ).length;

  const unreconciledDepositAmount = Math.max(0, totalSales - totalDeposited);

  return {
    openingBalance,
    totalTransferOut,
    totalSales,
    totalDeposited,
    closingBalance,
    commissionRate,
    commissionAmount,
    difference,
    status,
    invoiceCount,
    pendingEvidenceCount,
    unreconciledDepositAmount
  };
}

/**
 * Validates the calculation engine using the official October 2026 reference test case
 */
export function runCalculationSelfTest(): boolean {
  const openingBalance = -1021;
  const dummyTransfers: TransferOut[] = [
    {
      id: 'test-to-1',
      shopId: 'jemo',
      productId: 'float',
      monthKey: '2026-10',
      amount: 1600000,
      date: '2026-10-01',
      refNumber: 'TO 1-20',
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-to-2',
      shopId: 'jemo',
      productId: 'float',
      monthKey: '2026-10',
      amount: 976071,
      date: '2026-10-21',
      refNumber: 'TO 21-31',
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    }
  ];

  const dummySales: Sale[] = [
    {
      id: 'test-sale',
      shopId: 'jemo',
      productId: 'float',
      monthKey: '2026-10',
      salesDate: '2026-10-31',
      invoiceNumber: 'TOTAL',
      salesAmount: 2549410,
      quantity: 1,
      unitPrice: 2549410,
      invoiceImages: [],
      bankDeposits: [],
      totalDeposited: 2549410,
      depositDifference: 0,
      status: 'reconciled',
      createdBy: 'tester',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const result = calculateReconciliation(openingBalance, dummyTransfers, dummySales);

  const passes =
    result.totalTransferOut === 2576071 &&
    result.totalSales === 2549410 &&
    result.closingBalance === 25640 &&
    result.commissionAmount === 25761 &&
    result.difference === -121;

  if (!passes) {
    console.error('Calculation self-test failed! Received:', result);
  }

  return passes;
}

// Run test on load
runCalculationSelfTest();

/**
 * Format currency in ETB (Ethiopian Birr) with thousands separators and clean sign
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'ETB 0.00';
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}ETB ${absFormatted}`;
}

/**
 * Format number with comma separators without currency prefix
 */
export function formatNumber(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}${absFormatted}`;
}
