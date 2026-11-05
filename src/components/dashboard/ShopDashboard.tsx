import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  FileCheck2,
  AlertTriangle,
  Receipt,
  PlusCircle,
  Table,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  Eye,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Building,
  Plus,
  Edit2,
  ShieldAlert,
  X,
  Check
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { Sale, TransferOut } from '../../types';

interface ShopDashboardProps {
  onOpenRecordSale: () => void;
  onViewSpreadsheet: () => void;
  onSelectSale: (sale: Sale) => void;
}

export const ShopDashboard: React.FC<ShopDashboardProps> = ({
  onOpenRecordSale,
  onViewSpreadsheet,
  onSelectSale
}) => {
  const {
    summary,
    filteredSales,
    currentShop,
    currentMonthKey,
    currentShopId,
    setCurrentShopId,
    adamaMainConsolidation,
    isAdamaMainConsolidation,
    addTransferOut,
    updateTransferOut,
    shops,
    products
  } = useShop();

  const { language, isSuperAdmin } = useAuth();
  const t = getTranslation(language);

  const isAdamaMain = currentShopId === 'adama_main' || isAdamaMainConsolidation;

  // Transfer Out Modal State on Adama Main Dashboard
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [targetShopId, setTargetShopId] = useState<string>('adama_main');
  const [toAmount, setToAmount] = useState<string>('');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toRef, setToRef] = useState<string>('');
  const [toNotes, setToNotes] = useState<string>('');
  const [isSubmittingTO, setIsSubmittingTO] = useState(false);
  const [toError, setToError] = useState('');
  const [toSuccess, setToSuccess] = useState('');

  // Transfer Out Edit Modal State
  const [editingTransfer, setEditingTransfer] = useState<TransferOut | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editReason, setEditReason] = useState('');

  // Daily totals calculation
  const dailyTotals = React.useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach((s) => {
      const day = s.salesDate.split('-')[2] || s.salesDate;
      map[day] = (map[day] || 0) + s.salesAmount;
    });
    return Object.entries(map)
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [filteredSales]);

  const maxDaily = Math.max(...dailyTotals.map((d) => d.total), 1);

  // Recent 6 transactions
  const recentTransactions = React.useMemo(() => {
    return [...filteredSales]
      .sort((a, b) => new Date(b.createdAt || b.salesDate).getTime() - new Date(a.createdAt || a.salesDate).getTime())
      .slice(0, 6);
  }, [filteredSales]);

  // Handle Allocate Regional Float submit
  const handleAllocateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(toAmount);
    if (isNaN(num) || num <= 0) {
      setToError('Please enter a valid transfer amount.');
      return;
    }
    if (!toRef.trim()) {
      setToError('Please enter a reference number (e.g. TO-ADM-MAIN-02).');
      return;
    }

    setIsSubmittingTO(true);
    setToError('');
    setToSuccess('');

    try {
      const targetShop = shops.find((s) => s.id === targetShopId);
      await addTransferOut({
        shopId: targetShopId,
        shopName: targetShop?.name || targetShopId,
        productId: 'float',
        productName: 'FLOAT',
        monthKey: currentMonthKey,
        amount: num,
        date: toDate,
        refNumber: toRef.trim(),
        notes: toNotes.trim() || undefined,
        createdBy: 'Superadmin'
      });

      setToAmount('');
      setToRef('');
      setToNotes('');
      setToSuccess('Transfer Out batch allocated successfully!');
      setTimeout(() => {
        setShowAllocateModal(false);
        setToSuccess('');
      }, 1200);
    } catch (err: any) {
      setToError(err.message || 'Failed to allocate Transfer Out.');
    } finally {
      setIsSubmittingTO(false);
    }
  };

  // Handle Edit Transfer submit
  const handleSaveTransferCorrection = async () => {
    if (!editingTransfer) return;
    if (!editReason.trim()) {
      alert('A mandatory audit reason is required.');
      return;
    }
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    await updateTransferOut(
      editingTransfer.id,
      {
        amount: num,
        refNumber: editRef.trim()
      },
      editReason.trim()
    );

    setEditingTransfer(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#202B38] tracking-tight">
              {isAdamaMain
                ? t.adamaMainTitle
                : currentShopId === 'all'
                ? t.allShops
                : currentShop?.name || 'Shop Dashboard'}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isAdamaMain
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-[#EAF4FC] text-[#2878B9] border-[#DCEEFF]'
              }`}
            >
              {isAdamaMain ? 'Administrative Consolidation Account' : 'Operational Account'}
            </span>
          </div>
          <p className="text-xs text-[#778493] mt-0.5">
            {isAdamaMain ? (
              <span>{t.adamaMainSubtitle} • Reporting Cycle: <strong className="text-[#202B38]">{currentMonthKey}</strong></span>
            ) : (
              <span>
                {t.reportingCycle}: <strong className="text-[#202B38]">{currentMonthKey}</strong> • Currency: <strong>ETB</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdamaMain && isSuperAdmin && (
            <button
              onClick={() => {
                setToError('');
                setToSuccess('');
                setShowAllocateModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Allocate Regional Float</span>
            </button>
          )}

          <button
            onClick={onViewSpreadsheet}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-semibold text-[#202B38] transition-colors"
          >
            <Table className="w-4 h-4 text-[#2878B9]" />
            <span>{t.viewRecords}</span>
          </button>
        </div>
      </div>

      {/* ADAMA MAIN CONSTITUENT 5-BRANCH MATRIX */}
      {isAdamaMain && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#2878B9]" />
                <span>Consolidated Operational Branches (5 Accounts)</span>
              </h2>
              <p className="text-xs text-[#778493]">
                Aggregating real-time figures from Adama, Hawassa, Borena, Bale, and Assela.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#2878B9] bg-[#EAF4FC] px-2.5 py-1 rounded-lg">
                5 Branches Linked
              </span>
              <span className="text-[11px] font-medium text-[#778493] bg-[#F7FAFD] px-2.5 py-1 rounded-lg border border-[#E8EDF2]">
                Jemo, Chiro & Shashemene Excluded
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {adamaMainConsolidation.branchBreakdowns.map((branch) => (
              <div
                key={branch.shop.id}
                onClick={() => setCurrentShopId(branch.shop.id)}
                className="p-3.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC]/60 hover:border-[#2878B9] cursor-pointer transition-all space-y-2 group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#202B38] group-hover:text-[#2878B9]">
                    {branch.shop.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#778493] group-hover:text-[#2878B9]" />
                </div>
                <div className="space-y-1">
                  <div>
                    <div className="text-sm font-bold text-[#202B38]">
                      {formatCurrency(branch.salesTotal)}
                    </div>
                    <div className="text-[10px] text-[#778493]">
                      Sales • {branch.invoiceCount} invoices
                    </div>
                  </div>
                  <div className="pt-1 border-t border-[#E8EDF2]/60 flex items-center justify-between text-[10px]">
                    <span className="text-[#778493]">Deposited:</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(branch.depositedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#778493]">Allocated Float:</span>
                    <span className="font-semibold text-[#2878B9]">{formatCurrency(branch.transferOutTotal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Essential Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sales */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs hover:border-[#DCEEFF] transition-colors">
          <div className="flex items-center justify-between text-[#778493] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t.totalSales}</span>
            <DollarSign className="w-3.5 h-3.5 text-[#2878B9]" />
          </div>
          <div className="text-lg font-bold text-[#202B38] truncate" title={formatCurrency(summary.totalSales)}>
            {formatCurrency(summary.totalSales)}
          </div>
          <div className="text-[10px] text-[#778493] mt-1 flex items-center gap-1">
            <span>{summary.invoiceCount} {t.invoiceCount}</span>
          </div>
        </div>

        {/* Total Deposits */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs hover:border-[#DCEEFF] transition-colors">
          <div className="flex items-center justify-between text-[#778493] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t.totalDeposited}</span>
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-[#202B38] truncate" title={formatCurrency(summary.totalDeposited)}>
            {formatCurrency(summary.totalDeposited)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">
            {t.bankVerified}
          </div>
        </div>

        {/* Transfer Out */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs hover:border-[#DCEEFF] transition-colors">
          <div className="flex items-center justify-between text-[#778493] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t.transferOut}</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#2878B9]" />
          </div>
          <div className="text-lg font-bold text-[#202B38] truncate" title={formatCurrency(summary.totalTransferOut)}>
            {formatCurrency(summary.totalTransferOut)}
          </div>
          <div className="text-[10px] text-[#778493] mt-1">
            {isAdamaMain ? 'Regional Float Pool' : t.allocatedByHq}
          </div>
        </div>

        {/* Remaining Float */}
        <div className="p-4 rounded-2xl bg-[#EAF4FC]/60 border border-[#DCEEFF] shadow-2xs">
          <div className="flex items-center justify-between text-[#2878B9] mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.remainingFloat}</span>
            <Building2 className="w-3.5 h-3.5 text-[#2878B9]" />
          </div>
          <div className="text-lg font-bold text-[#2878B9] truncate" title={formatCurrency(summary.closingBalance)}>
            {formatCurrency(summary.closingBalance)}
          </div>
          <div className="text-[10px] text-[#778493] mt-1">
            {t.sohBalance}
          </div>
        </div>

        {/* Up Front Commission */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
          <div className="flex items-center justify-between text-[#778493] mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t.upfrontCommission}</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#2878B9]" />
          </div>
          <div className="text-lg font-bold text-[#202B38] truncate" title={formatCurrency(summary.commissionAmount)}>
            {formatCurrency(summary.commissionAmount)}
          </div>
          <div className="text-[10px] text-[#778493] mt-1">
            {(summary.commissionRate * 100).toFixed(1)}% rate
          </div>
        </div>

        {/* Difference */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs ${
            summary.difference === 0
              ? 'bg-emerald-50/50 border-emerald-200'
              : summary.difference < 0
              ? 'bg-[#EAF4FC]/70 border-[#DCEEFF]'
              : 'bg-amber-50/50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-[#778493] mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.difference}</span>
            {summary.difference !== 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </div>
          <div
            className={`text-lg font-bold truncate ${
              summary.difference < 0 ? 'text-[#2878B9]' : summary.difference > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
            title={formatCurrency(summary.difference)}
          >
            {formatCurrency(summary.difference)}
          </div>
          <div className="text-[10px] font-medium text-[#778493] mt-1">
            {summary.status === 'Balanced' ? t.balanced : summary.status === 'Shortage' ? t.shortage : t.overage} (SOH - Comm)
          </div>
        </div>
      </div>

      {/* ADAMA MAIN INTEGRATED TRANSFER OUT MANAGEMENT PANEL */}
      {isAdamaMain && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38] flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-[#2878B9]" />
                <span>Regional Transfer Out Allocations ({currentMonthKey})</span>
              </h2>
              <p className="text-xs text-[#778493]">
                Float batches injected by Moderntech Superadmin into Adama Main or constituent branches.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setToError('');
                  setToSuccess('');
                  setShowAllocateModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Allocate Transfer Out Batch</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
                <tr>
                  <th className="py-2.5 px-4">Ref Number</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Allocated To</th>
                  <th className="py-2.5 px-4 text-right">Amount (ETB)</th>
                  <th className="py-2.5 px-4">Notes</th>
                  {isSuperAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {adamaMainConsolidation.regionalTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#778493]">
                      No regional Transfer Out batches recorded for {currentMonthKey} yet.
                    </td>
                  </tr>
                ) : (
                  adamaMainConsolidation.regionalTransfers.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F7FAFD] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#202B38]">{item.refNumber}</td>
                      <td className="py-3 px-4 text-[#778493]">{item.date}</td>
                      <td className="py-3 px-4 font-medium text-[#202B38]">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.shopId === 'adama_main' ? 'bg-purple-100 text-purple-800' : 'bg-[#EAF4FC] text-[#2878B9]'
                        }`}>
                          {item.shopName || item.shopId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#2878B9]">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-[#778493] truncate max-w-[200px]">
                        {item.notes || '-'}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingTransfer(item);
                              setEditAmount(item.amount.toString());
                              setEditRef(item.refNumber);
                              setEditReason('');
                            }}
                            className="p-1 text-[#2878B9] hover:bg-[#EAF4FC] rounded"
                            title="Edit with mandatory audit reason"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Chart & Evidence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#202B38]">{t.dailyActivity}</h2>
              <p className="text-xs text-[#778493]">
                {isAdamaMain ? 'Combined regional float sales across the 5 constituent branches' : `Sales distribution for ${currentMonthKey}`}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#2878B9] bg-[#EAF4FC] px-2.5 py-1 rounded-lg">
              {dailyTotals.length} {t.activeDays}
            </span>
          </div>

          {dailyTotals.length > 0 ? (
            <div className="h-48 flex items-end gap-1.5 pt-4 overflow-x-auto pb-2">
              {dailyTotals.map((item) => {
                const heightPercent = Math.max(12, Math.round((item.total / maxDaily) * 100));
                return (
                  <div
                    key={item.day}
                    className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#202B38] text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap pointer-events-none z-10 shadow-sm">
                      Day {item.day}: ETB {item.total.toLocaleString()}
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-[#EAF4FC] group-hover:bg-[#2878B9] rounded-t-md transition-all duration-200"
                    />

                    <span className="text-[9px] text-[#778493] font-mono group-hover:text-[#202B38]">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-[#778493] border border-dashed border-[#E8EDF2] rounded-xl">
              No sales recorded for this period yet.
            </div>
          )}
        </div>

        {/* Evidence & Reconciliation Box */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#202B38]">{t.evidenceReconciliation}</h2>
            <p className="text-xs text-[#778493]">Bank slips & document verification</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#F7FAFD] border border-[#E8EDF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#202B38]">{t.reconciledInvoices}</div>
                  <div className="text-[10px] text-[#778493]">Deposits match sales amount</div>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-700">
                {filteredSales.filter((s) => s.status === 'reconciled').length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F7FAFD] border border-[#E8EDF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#202B38]">{t.partialDeposits}</div>
                  <div className="text-[10px] text-[#778493]">Awaiting remaining deposits</div>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-700">
                {filteredSales.filter((s) => s.status === 'partial').length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F7FAFD] border border-[#E8EDF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2878B9] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#202B38]">{t.pendingEvidence}</div>
                  <div className="text-[10px] text-[#778493]">Missing slips</div>
                </div>
              </div>
              <span className="text-sm font-bold text-[#2878B9]">
                {summary.pendingEvidenceCount}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onViewSpreadsheet}
              className="w-full py-2.5 rounded-xl border border-[#DCEEFF] bg-[#EAF4FC] hover:bg-[#DCEEFF] text-[#2878B9] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{t.auditCompleteSpreadsheet}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E8EDF2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#202B38]">{t.recentSales}</h2>
            <p className="text-xs text-[#778493]">
              {isAdamaMain ? 'Latest transactions across Adama, Hawassa, Borena, Bale, Assela' : `Latest transactions for ${currentShop?.name}`}
            </p>
          </div>

          <button
            onClick={onViewSpreadsheet}
            className="text-xs text-[#2878B9] hover:underline font-semibold flex items-center gap-1"
          >
            <span>{t.seeAllRecords} ({filteredSales.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
              <tr>
                <th className="py-3 px-4">{t.colDate}</th>
                <th className="py-3 px-4">{t.colInvoice}</th>
                <th className="py-3 px-4">{t.colShop}</th>
                <th className="py-3 px-4 text-right">{t.colAmount}</th>
                <th className="py-3 px-4 text-right">{t.colDeposited}</th>
                <th className="py-3 px-4 text-center">{t.colEvidence}</th>
                <th className="py-3 px-4 text-center">{t.colStatus}</th>
                <th className="py-3 px-4 text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF2]">
              {recentTransactions.map((sale) => (
                <tr
                  key={sale.id}
                  onClick={() => onSelectSale(sale)}
                  className="hover:bg-[#EAF4FC]/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-[#202B38] whitespace-nowrap">
                    {sale.salesDate}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-[#202B38]">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-[#778493]">
                    {sale.shopName} {sale.districtName ? `(${sale.districtName})` : ''}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#202B38]">
                    {formatCurrency(sale.salesAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#202B38]">
                    {formatCurrency(sale.totalDeposited)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#EAF4FC] text-[#2878B9]">
                      <FileCheck2 className="w-3 h-3" />
                      {(sale.invoiceImages?.length || 0) + (sale.bankDeposits?.length || 0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sale.status === 'reconciled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {sale.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSale(sale);
                      }}
                      className="p-1 rounded text-[#2878B9] hover:bg-[#EAF4FC]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Superadmin Allocate Regional Float Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E8EDF2] shadow-xl text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#2878B9]" />
                <h3 className="text-sm font-bold text-[#202B38]">Allocate Regional Float</h3>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-[#778493] hover:text-[#202B38] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {toError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {toError}
              </div>
            )}

            {toSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" />
                <span>{toSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAllocateTransfer} className="space-y-3">
              <div>
                <label className="block text-[#778493] mb-1 font-medium">Target Account *</label>
                <select
                  value={targetShopId}
                  onChange={(e) => setTargetShopId(e.target.value)}
                  className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold"
                >
                  <option value="adama_main">ADAMA MAIN (Regional Consolidation Pool)</option>
                  <option value="adama">Adama Shop</option>
                  <option value="hawassa">Hawassa Shop</option>
                  <option value="borena">Borena Shop</option>
                  <option value="bale">Bale Shop</option>
                  <option value="assela">Assela Shop</option>
                </select>
                <p className="text-[10px] text-[#2878B9] mt-1 font-medium">
                  {targetShopId === 'adama_main'
                    ? 'Funds the shared regional float pool for all 5 constituent branches.'
                    : 'Allocates directly to the specified operational branch.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#778493] mb-1 font-medium">Transfer Date *</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#778493] mb-1 font-medium">Ref Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. TO-ADM-MAIN-02"
                    value={toRef}
                    onChange={(e) => setToRef(e.target.value)}
                    className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-mono font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Transfer Amount (ETB) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#2878B9]">ETB</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Dispatch batch reference or telecom transaction details..."
                  value={toNotes}
                  onChange={(e) => setToNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8EDF2]">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3.5 py-2 border border-[#E8EDF2] rounded-xl text-[#778493] hover:bg-[#F7FAFD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTO}
                  className="px-4 py-2 bg-[#2878B9] hover:bg-[#1e6197] text-white font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isSubmittingTO ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Superadmin Edit Transfer Dialog */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3.5 border border-[#E8EDF2] shadow-xl text-xs">
            <h3 className="text-sm font-bold text-[#202B38]">Edit Transfer Out #{editingTransfer.refNumber}</h3>

            <div>
              <label className="block text-[#778493] mb-1">Ref Number</label>
              <input
                type="text"
                value={editRef}
                onChange={(e) => setEditRef(e.target.value)}
                className="w-full p-2 border border-[#E8EDF2] rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-[#778493] mb-1">Amount (ETB)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full p-2 border border-[#E8EDF2] rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-[#778493] mb-1 font-semibold text-red-600">
                Mandatory Audit Reason *
              </label>
              <textarea
                rows={2}
                placeholder="Audit reason for modifying this financial transfer..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full p-2 border border-red-300 rounded-lg"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8EDF2]">
              <button
                type="button"
                onClick={() => setEditingTransfer(null)}
                className="px-3.5 py-1.5 border border-[#E8EDF2] rounded-lg text-[#778493]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTransferCorrection}
                className="px-4 py-1.5 bg-[#2878B9] text-white font-semibold rounded-lg"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
