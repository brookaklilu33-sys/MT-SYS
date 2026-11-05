import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Printer,
  ArrowUpDown,
  FileCheck2,
  PlusCircle,
  Eye,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { Sale } from '../../types';

interface ShopSpreadsheetProps {
  onOpenRecordSale: () => void;
  onSelectSale: (sale: Sale) => void;
}

export const ShopSpreadsheet: React.FC<ShopSpreadsheetProps> = ({
  onOpenRecordSale,
  onSelectSale
}) => {
  const {
    currentShop,
    currentShopId,
    currentMonthKey,
    filteredSales,
    filteredTransfers,
    summary,
    activeDistricts,
    shops
  } = useShop();

  const { language } = useAuth();
  const t = getTranslation(language);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubShop, setSelectedSubShop] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isAdamaMain = currentShopId === 'adama_main';

  // Filter and search sales
  const processedSales = useMemo(() => {
    return filteredSales
      .filter((sale) => {
        const matchesSearch =
          sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.notes && sale.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (sale.shopName && sale.shopName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSubShop =
          selectedSubShop === 'all' ? true : sale.shopId === selectedSubShop;

        const matchesDistrict =
          selectedDistrict === 'all' ? true : sale.districtId === selectedDistrict;

        const matchesStatus =
          statusFilter === 'all' ? true : sale.status === statusFilter;

        return matchesSearch && matchesSubShop && matchesDistrict && matchesStatus;
      })
      .sort((a, b) => {
        const diff = new Date(a.salesDate).getTime() - new Date(b.salesDate).getTime();
        return sortDirection === 'asc' ? diff : -diff;
      });
  }, [filteredSales, searchTerm, selectedSubShop, selectedDistrict, statusFilter, sortDirection]);

  // Export to standard CSV
  const handleExportCSV = () => {
    const headers = [
      t.colRef,
      t.colShop,
      t.colDistrict,
      t.colInvoice,
      t.colProduct,
      t.colDate,
      t.quantityLabel,
      t.unitPriceLabel,
      t.colAmount,
      t.colDeposited,
      t.variance,
      t.colStatus,
      t.colEncoder,
      t.colLastUpdated
    ];

    const rows = processedSales.map((s, idx) => [
      idx + 1,
      s.shopName || s.shopId,
      s.districtName || 'General',
      s.invoiceNumber,
      s.productName || 'FLOAT',
      s.salesDate,
      s.quantity,
      s.unitPrice,
      s.salesAmount,
      s.totalDeposited,
      s.depositDifference,
      s.status,
      s.createdByName || s.createdBy,
      new Date(s.updatedAt || s.createdAt).toLocaleDateString()
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Moderntech_${currentShop?.code || 'Ledger'}_Sales_${currentMonthKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8EDF2] shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#202B38]">
                {isAdamaMain
                  ? 'ADAMA MAIN Consolidated Sales Ledger'
                  : currentShopId === 'all'
                  ? 'Consolidated Multi-Branch Spreadsheet'
                  : `${currentShop?.name || 'Shop'} ${t.spreadsheetTitle}`}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#EAF4FC] text-[#2878B9] border border-[#DCEEFF]">
                {t.officialLedger}
              </span>
            </div>
            <p className="text-xs text-[#778493] mt-1">
              Addis Ababa Daily/Weekly/Monthly Sales and Float Reconciliation Report for <strong className="text-[#202B38]">{currentMonthKey}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-semibold text-[#202B38] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>{t.exportCsv}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-semibold text-[#202B38] transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>{t.printSheet}</span>
            </button>

            {!isAdamaMain && (
              <button
                onClick={onOpenRecordSale}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold shadow-xs transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ {t.recordSale}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E8EDF2]">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#778493] absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
            />
          </div>

          {/* Sub-shop filter for Adama Main */}
          {isAdamaMain && (
            <div>
              <select
                value={selectedSubShop}
                onChange={(e) => setSelectedSubShop(e.target.value)}
                className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden font-medium"
              >
                <option value="all">All 5 Consolidated Branches</option>
                <option value="adama">Adama</option>
                <option value="hawassa">Hawassa</option>
                <option value="borena">Borena</option>
                <option value="bale">Bale</option>
                <option value="assela">Assela</option>
              </select>
            </div>
          )}

          {/* District Filter */}
          {!isAdamaMain && activeDistricts.length > 0 && (
            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
              >
                <option value="all">{t.allDistricts}</option>
                {activeDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="reconciled">{t.fullyReconciled}</option>
              <option value="partial">{t.partialDeposits}</option>
              <option value="unreconciled">Unreconciled</option>
              <option value="evidence_pending">{t.pendingEvidence}</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="flex items-center justify-between sm:justify-end">
            <button
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] text-xs text-[#202B38] hover:bg-[#EAF4FC]"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>{sortDirection === 'asc' ? t.earliestFirst : t.latestFirst}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Real Spreadsheet Transaction Table (CRITICAL: REMOVED REMAINING FLOAT AS COLUMN) */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
        {/* Print Header */}
        <div className="hidden print:block p-4 border-b border-black text-center">
          <h2 className="text-base font-bold uppercase">Moderntech Shop ERP — Sales Transaction Ledger</h2>
          <p className="text-xs">
            Branch: {currentShop?.name} • Month: {currentMonthKey}
          </p>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-[#EAF4FC] text-[#202B38] sticky top-0 z-20 border-b border-[#DCEEFF] shadow-2xs">
              <tr className="text-[11px] font-semibold tracking-tight">
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-center w-10">{t.colRef}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] whitespace-nowrap">{t.colShop}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] whitespace-nowrap">{t.colDistrict}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] whitespace-nowrap">{t.colInvoice}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] whitespace-nowrap">{t.colProduct}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] whitespace-nowrap">{t.colDate}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-right whitespace-nowrap">{t.quantityLabel}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-right whitespace-nowrap">{t.unitPriceLabel}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-right whitespace-nowrap font-bold text-[#202B38]">{t.colAmount}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-right whitespace-nowrap">{t.colDeposited}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-right whitespace-nowrap">{t.variance}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-center whitespace-nowrap">{t.colEvidence}</th>
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-center whitespace-nowrap">{t.colStatus}</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap no-print">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF2] text-[#202B38]">
              {processedSales.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-[#778493]">
                    No recorded transactions matching the selected filters.
                  </td>
                </tr>
              ) : (
                processedSales.map((sale, idx) => (
                  <tr
                    key={sale.id}
                    onClick={() => onSelectSale(sale)}
                    className="hover:bg-[#EAF4FC]/40 cursor-pointer transition-colors text-xs"
                  >
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-center text-[#778493]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] font-medium text-[#202B38] whitespace-nowrap">
                      {sale.shopName || sale.shopId}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-[#778493] whitespace-nowrap">
                      {sale.districtName || 'General'}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] font-mono font-bold text-[#202B38] whitespace-nowrap">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-[#778493] whitespace-nowrap">
                      {sale.productName || 'FLOAT'}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] whitespace-nowrap font-medium">
                      {sale.salesDate}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-right text-[#778493] whitespace-nowrap">
                      {sale.quantity || 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-right text-[#778493] whitespace-nowrap">
                      {formatNumber(sale.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-right font-bold text-[#202B38] whitespace-nowrap">
                      {formatNumber(sale.salesAmount)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-right font-medium text-emerald-700 whitespace-nowrap">
                      {formatNumber(sale.totalDeposited)}
                    </td>
                    <td
                      className={`py-2.5 px-3 border-r border-[#E8EDF2] text-right font-mono font-medium whitespace-nowrap ${
                        sale.depositDifference === 0
                          ? 'text-emerald-600'
                          : sale.depositDifference > 0
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {formatNumber(sale.depositDifference)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#F7FAFD] border border-[#E8EDF2] text-[#2878B9]">
                        <FileCheck2 className="w-3 h-3" />
                        {(sale.invoiceImages?.length || 0) + (sale.bankDeposits?.length || 0)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#E8EDF2] text-center whitespace-nowrap">
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
                    <td className="py-2.5 px-3 text-right no-print">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSale(sale);
                        }}
                        className="p-1 rounded text-[#2878B9] hover:bg-[#EAF4FC]"
                        title="Inspect / Edit"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total Footer Row */}
            <tfoot className="bg-[#F7FAFD] font-bold border-t-2 border-[#DCEEFF] text-xs">
              <tr>
                <td colSpan={8} className="py-3 px-3 text-right uppercase tracking-wider text-[#778493]">
                  TOTAL TRANSACTION VALUE:
                </td>
                <td className="py-3 px-3 text-right text-[#202B38] font-bold">
                  {formatNumber(summary.totalSales)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                  {formatNumber(summary.totalDeposited)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                  {formatNumber(summary.unreconciledDepositAmount)}
                </td>
                <td colSpan={3} className="py-3 px-3 text-center text-[#778493] text-[11px]">
                  {processedSales.length} Total Sales Invoices
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SEPARATE MONTHLY RECONCILIATION SUMMARY BOX (WHERE REMAINING FLOAT & CLOSING SOH BELONGS) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8EDF2] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#202B38] uppercase tracking-wide">
              {t.summaryTitle} {currentMonthKey}
            </h3>
            <p className="text-xs text-[#778493]">
              {isAdamaMain
                ? 'Regional Float Reconciliation (Combined Adama, Hawassa, Borena, Bale, Assela)'
                : `Official Float Reconciliation for ${currentShop?.name}`}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#EAF4FC] text-[#2878B9]">
            {summary.status.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-[#E8EDF2] rounded-xl overflow-hidden">
            <thead className="bg-[#EAF4FC] text-[#202B38] font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.bbfOpening}</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.colPurchaseTransfer}</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.totalSales}</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF] bg-[#DCEEFF]/60 font-bold text-[#2878B9]">
                  {t.colSoh}
                </th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.colActSoh}</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.upfrontCommission} ({(summary.commissionRate * 100).toFixed(1)}%)</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.difference}</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.colCarriedForward}</th>
                <th className="py-2.5 px-3 border border-[#DCEEFF]">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="bg-white font-mono text-xs">
              <tr>
                <td className="py-3 px-3 border border-[#E8EDF2] font-semibold text-red-600">
                  {formatNumber(summary.openingBalance)}
                </td>
                <td className="py-3 px-3 border border-[#E8EDF2] font-bold text-[#2878B9]">
                  {formatNumber(summary.totalTransferOut)}
                </td>
                <td className="py-3 px-3 border border-[#E8EDF2] font-bold text-[#202B38]">
                  {formatNumber(summary.totalSales)}
                </td>
                <td className="py-3 px-3 border border-[#E8EDF2] font-bold text-[#2878B9] bg-[#EAF4FC]/30 text-sm">
                  {formatNumber(summary.closingBalance)}
                </td>
                <td className="py-3 px-3 border border-[#E8EDF2] text-[#778493]">-</td>
                <td className="py-3 px-3 border border-[#E8EDF2] font-bold text-[#202B38]">
                  {formatNumber(summary.commissionAmount)}
                </td>
                <td
                  className={`py-3 px-3 border border-[#E8EDF2] font-bold ${
                    summary.difference === 0
                      ? 'text-emerald-600'
                      : summary.difference < 0
                      ? 'text-[#2878B9]'
                      : 'text-amber-600'
                  }`}
                >
                  {formatNumber(summary.difference)}
                </td>
                <td className="py-3 px-3 border border-[#E8EDF2] font-bold text-[#2878B9]">
                  {formatNumber(summary.closingBalance)}
                </td>
                <td className="py-3 px-3 border border-[#E8EDF2] font-sans font-semibold text-xs">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      summary.status === 'Balanced'
                        ? 'bg-emerald-100 text-emerald-800'
                        : summary.status === 'Overage'
                        ? 'bg-blue-100 text-[#2878B9]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {summary.status === 'Balanced' ? t.balanced : summary.status === 'Shortage' ? t.shortage : t.overage}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[#778493] pt-2">
          <div className="flex items-center gap-4 text-[11px]">
            <span>• <strong>SOH &gt; Agent Commission</strong> &rarr; {t.shortage}</span>
            <span>• <strong>SOH &lt; Agent Commission</strong> &rarr; {t.overage}</span>
          </div>
          <div className="text-[11px]">
            Closing SOH carries forward as the beginning balance (BBF) for the next reporting month.
          </div>
        </div>
      </div>
    </div>
  );
};
