import React from 'react';
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
  Building
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { Sale } from '../../types';

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
  const { summary, filteredSales, currentShop, currentMonthKey, currentShopId, adamaMainBreakdown, setCurrentShopId } = useShop();
  const { language, isSuperAdmin } = useAuth();
  const t = getTranslation(language);

  const isAdamaMain = currentShopId === 'adama_main';

  // Compute daily sales breakdown for visual activity trend
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
              {isAdamaMain ? 'Regional HQ Consolidation' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-[#778493] mt-0.5">
            {isAdamaMain ? (
              <span>{t.adamaMainSubtitle}</span>
            ) : (
              <span>
                {t.reportingCycle}: <strong className="text-[#202B38]">{currentMonthKey}</strong> • Currency: <strong>ETB</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onViewSpreadsheet}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-semibold text-[#202B38] transition-colors"
          >
            <Table className="w-4 h-4 text-[#2878B9]" />
            <span>{t.viewRecords}</span>
          </button>

          {!isAdamaMain && (
            <button
              onClick={onOpenRecordSale}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ {t.recordSale}</span>
            </button>
          )}
        </div>
      </div>

      {/* SPECIAL ADAMA MAIN REGIONAL CONSOLIDATION BANNER & BRANCH BREAKDOWN */}
      {isAdamaMain && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#2878B9]" />
                <span>{t.consolidatedBranches}</span>
              </h2>
              <p className="text-xs text-[#778493]">{t.excludedShopsNote}</p>
            </div>
            <span className="text-xs font-bold text-[#2878B9] bg-[#EAF4FC] px-2.5 py-1 rounded-lg">
              5 Regional Branches Linked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {adamaMainBreakdown.map(({ shop, salesTotal, invoiceCount, deposited }) => (
              <div
                key={shop.id}
                onClick={() => setCurrentShopId(shop.id)}
                className="p-3.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC]/50 hover:border-[#2878B9] cursor-pointer transition-all space-y-2 group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#202B38] group-hover:text-[#2878B9]">
                    {shop.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#778493] group-hover:text-[#2878B9]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#202B38]">
                    {formatCurrency(salesTotal)}
                  </div>
                  <div className="text-[10px] text-[#778493]">
                    {invoiceCount} invoices • Deposited: {formatCurrency(deposited)}
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
            {t.allocatedByHq}
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

      {/* Activity Chart & Evidence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#202B38]">{t.dailyActivity}</h2>
              <p className="text-xs text-[#778493]">
                {isAdamaMain ? 'Combined regional float transactions across the 5 branches' : `Sales distribution for ${currentMonthKey}`}
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
    </div>
  );
};
