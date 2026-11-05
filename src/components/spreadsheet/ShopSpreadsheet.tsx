import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  FileCheck2,
  Eye,
  Building,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  Camera,
  Check,
  Plus,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  X
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { Sale, BankDeposit, TransferOut } from '../../types';
import { exportShopLedgerToExcel } from '../../services/excelExport';
import { ImageModal } from '../common/ImageModal';

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
    products,
    shops,
    addSale,
    addTransferOut,
    auditLogs
  } = useShop();

  const { language, userProfile, isSuperAdmin } = useAuth();
  const t = getTranslation(language);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubShop, setSelectedSubShop] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Quick Inline Entry State directly on the spreadsheet
  const [showInlineEntry, setShowInlineEntry] = useState(true);
  const [inlineDate, setInlineDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inlineInvoice, setInlineInvoice] = useState<string>('');
  const [inlineDistrict, setInlineDistrict] = useState<string>(activeDistricts[0]?.id || '');
  const [inlineProduct, setInlineProduct] = useState<string>(products[0]?.id || 'float');
  const [inlineQty, setInlineQty] = useState<string>('1');
  const [inlineAmount, setInlineAmount] = useState<string>('');
  const [inlineDepositAmount, setInlineDepositAmount] = useState<string>('');
  const [inlineBankName, setInlineBankName] = useState<string>('Commercial Bank of Ethiopia (CBE)');
  const [inlineInvoiceImages, setInlineInvoiceImages] = useState<string[]>([]);
  const [inlineError, setInlineError] = useState<string>('');
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);

  // Quick Admin Transfer Out Modal/Row state
  const [showAdminTransferModal, setShowAdminTransferModal] = useState(false);
  const [newTORef, setNewTORef] = useState('');
  const [newTOAmount, setNewTOAmount] = useState('');
  const [newTODate, setNewTODate] = useState(new Date().toISOString().split('T')[0]);
  const [newTONotes, setNewTONotes] = useState('');

  // Lightbox preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

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

  // Export to Real Microsoft Excel (.xlsx)
  const handleExportExcel = () => {
    exportShopLedgerToExcel({
      shopName: currentShop?.name || 'All Shops',
      shopCode: currentShop?.code || 'HQ',
      monthKey: currentMonthKey,
      sales: processedSales,
      transfers: filteredTransfers,
      summary,
      auditLogs
    });
  };

  // Handle Quick Inline File Process
  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setInlineInvoiceImages((prev) => [...prev, ev.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Fast inline sale submission
  const handleAddInlineSale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineInvoice.trim()) {
      setInlineError('Please enter an Invoice / Reference Number.');
      return;
    }
    const amountNum = parseFloat(inlineAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setInlineError('Please enter a valid Sales Amount.');
      return;
    }

    setIsSubmittingInline(true);
    setInlineError('');

    try {
      const q = parseFloat(inlineQty) || 1;
      let targetShop = currentShopId;
      if (currentShopId === 'adama_main') {
        targetShop = selectedSubShop !== 'all' ? selectedSubShop : 'adama';
      } else if (currentShopId === 'all') {
        targetShop = selectedSubShop !== 'all' ? selectedSubShop : 'jemo';
      }

      const bankDepositsList: BankDeposit[] = [];
      const depNum = parseFloat(inlineDepositAmount);
      if (!isNaN(depNum) && depNum > 0) {
        bankDepositsList.push({
          id: `dep-${Date.now()}`,
          depositDate: inlineDate,
          amount: depNum,
          bankName: inlineBankName,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userProfile?.displayName
        });
      }

      await addSale({
        shopId: targetShop,
        districtId: inlineDistrict || undefined,
        productId: inlineProduct || 'float',
        monthKey: inlineDate.substring(0, 7),
        salesDate: inlineDate,
        invoiceNumber: inlineInvoice.trim(),
        salesAmount: amountNum,
        quantity: q,
        unitPrice: amountNum / q,
        invoiceImages: inlineInvoiceImages,
        bankDeposits: bankDepositsList,
        createdBy: userProfile?.id || 'cashier',
        createdByName: userProfile?.displayName || 'Shop Manager'
      });

      // Clear input for next rapid entry
      setInlineInvoice('');
      setInlineAmount('');
      setInlineDepositAmount('');
      setInlineInvoiceImages([]);
    } catch (err: any) {
      setInlineError(err.message || 'Failed to record sale.');
    } finally {
      setIsSubmittingInline(false);
    }
  };

  // Admin Transfer Out Insertion
  const handleSaveAdminTransfer = async () => {
    if (!newTORef.trim() || !newTOAmount) return;
    const amountNum = parseFloat(newTOAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    try {
      await addTransferOut({
        shopId: currentShopId === 'all' ? 'jemo' : currentShopId,
        monthKey: newTODate.substring(0, 7),
        amount: amountNum,
        date: newTODate,
        refNumber: newTORef.trim(),
        notes: newTONotes.trim() || undefined,
        productId: 'float',
        createdBy: userProfile?.email || 'admin@moderntech.com'
      });

      setShowAdminTransferModal(false);
      setNewTORef('');
      setNewTOAmount('');
      setNewTONotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to allocate transfer out.');
    }
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
            {/* Real Excel Export Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
              title="Download Microsoft Excel Workbook (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.exportExcel}</span>
            </button>

            {/* Standard CSV Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-semibold text-[#202B38] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>{t.exportCsv}</span>
            </button>

            {/* Toggle Inline Entry Bar */}
            {!isAdamaMain && (
              <button
                onClick={() => setShowInlineEntry(!showInlineEntry)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                  showInlineEntry
                    ? 'bg-[#EAF4FC] text-[#2878B9] border-[#DCEEFF]'
                    : 'bg-[#F7FAFD] text-[#778493] border-[#E8EDF2] hover:bg-[#EAF4FC]'
                }`}
              >
                <span>⚡ {showInlineEntry ? 'Hide Inline Form' : 'Show Inline Entry'}</span>
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

      {/* FLOAT FUNDING & TRANSFER OUT SECTION (AS IN THE REFERENCE SPREADSHEET, INSERTED BY ADMIN) */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#EAF4FC]/60 border-b border-[#DCEEFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#2878B9]" />
            <h2 className="text-xs font-bold uppercase text-[#202B38] tracking-wider">
              {t.floatFundingHeader}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#2878B9] border border-[#DCEEFF] font-semibold">
              Admin Inserted
            </span>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setShowAdminTransferModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2878B9] text-white text-xs font-medium hover:bg-[#1e6197]"
            >
              <Plus className="w-3 h-3" />
              <span>+ Insert Transfer Out</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7FAFD] text-[#778493] text-[11px] font-semibold border-b border-[#E8EDF2]">
              <tr>
                <th className="py-2 px-3 border-r border-[#E8EDF2] w-12 text-center">Ref #</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2]">Type / Channel</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2]">Ref Number</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2]">Product ITEM</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2]">Date</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2] text-right">Qty</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2] text-right">Unit Cost</th>
                <th className="py-2 px-3 border-r border-[#E8EDF2] text-right font-bold text-[#202B38]">Total Cost (ETB)</th>
                <th className="py-2 px-3 text-[#778493]">Authorized Admin / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF2] text-xs">
              {/* Row 1: BBF (Beginning Balance) */}
              <tr className="bg-amber-50/20 font-medium">
                <td className="py-2 px-3 border-r border-[#E8EDF2] text-center text-[#778493]">1</td>
                <td className="py-2 px-3 border-r border-[#E8EDF2] font-bold text-[#2878B9]">BBF</td>
                <td className="py-2 px-3 border-r border-[#E8EDF2] font-mono font-bold text-[#202B38]">
                  BBF {currentMonthKey}
                </td>
                <td className="py-2 px-3 border-r border-[#E8EDF2] text-[#778493]">FLOAT / MPESA</td>
                <td className="py-2 px-3 border-r border-[#E8EDF2]">{currentMonthKey}-01</td>
                <td className="py-2 px-3 border-r border-[#E8EDF2] text-right text-[#778493]">1</td>
                <td className="py-2 px-3 border-r border-[#E8EDF2] text-right font-mono text-red-600 font-bold">
                  {formatNumber(summary.openingBalance)}
                </td>
                <td className="py-2 px-3 border-r border-[#E8EDF2] text-right font-mono text-red-600 font-bold">
                  {formatNumber(summary.openingBalance)}
                </td>
                <td className="py-2 px-3 text-[11px] text-[#778493] italic">
                  Opening float balance brought forward
                </td>
              </tr>

              {/* Rows 2+: Admin Transfer Out Allocations */}
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-3 px-3 text-center text-[#778493] text-xs">
                    No additional Float Transfer Out allocated for this period yet.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((to, idx) => (
                  <tr key={to.id} className="hover:bg-[#F7FAFD] transition-colors">
                    <td className="py-2 px-3 border-r border-[#E8EDF2] text-center text-[#778493]">{idx + 2}</td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] font-bold text-indigo-700">
                      Transfer Out (TO)
                    </td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] font-mono font-bold text-[#202B38]">
                      {to.refNumber}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] text-[#778493]">
                      {to.productName || 'FLOAT'}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] font-medium">{to.date}</td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] text-right text-[#778493]">1</td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] text-right font-mono font-semibold text-[#2878B9]">
                      {formatNumber(to.amount)}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E8EDF2] text-right font-mono font-bold text-[#2878B9]">
                      {formatNumber(to.amount)}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-[#778493]">
                      {to.notes || `Allocated by ${to.createdBy || 'Moderntech Admin'}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-[#F7FAFD] border-t border-[#E8EDF2] font-bold text-xs">
              <tr>
                <td colSpan={7} className="py-2.5 px-3 text-right text-[#778493] uppercase">
                  TOTAL TRANSFER OUT / PURCHASES:
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2878B9]">
                  {formatNumber(summary.totalTransferOut)}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-[#778493]">
                  {filteredTransfers.length} allocation batch(es)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* QUICK INLINE RECORD SALE ROW DIRECTLY ON THE SPREADSHEET */}
      {!isAdamaMain && showInlineEntry && (
        <div className="bg-white rounded-2xl border-2 border-[#2878B9]/30 shadow-xs p-4 space-y-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#2878B9] text-white flex items-center justify-center font-bold text-xs">
                +
              </div>
              <h3 className="text-xs font-bold text-[#202B38] uppercase tracking-wide">
                {t.quickInlineSale}
              </h3>
              <span className="text-[10px] text-[#778493]">
                (Type fast and hit Enter to add transaction directly to spreadsheet)
              </span>
            </div>
            {inlineError && (
              <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {inlineError}
              </span>
            )}
          </div>

          <form onSubmit={handleAddInlineSale} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 items-end">
            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">{t.salesDateLabel}</label>
              <input
                type="date"
                value={inlineDate}
                onChange={(e) => setInlineDate(e.target.value)}
                className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-medium text-[#202B38]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">{t.invoiceRefLabel} *</label>
              <input
                type="text"
                placeholder="e.g. 0036452"
                value={inlineInvoice}
                onChange={(e) => setInlineInvoice(e.target.value)}
                className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-mono font-bold text-[#202B38]"
                required
              />
            </div>

            {activeDistricts.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">{t.colDistrict}</label>
                <select
                  value={inlineDistrict}
                  onChange={(e) => setInlineDistrict(e.target.value)}
                  className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg text-[#202B38]"
                >
                  <option value="">General</option>
                  {activeDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">{t.colProduct}</label>
              <select
                value={inlineProduct}
                onChange={(e) => setInlineProduct(e.target.value)}
                className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg text-[#202B38]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">Sales Amount (ETB) *</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={inlineAmount}
                onChange={(e) => setInlineAmount(e.target.value)}
                className="w-full text-xs p-1.5 bg-white border-2 border-[#2878B9]/40 rounded-lg font-bold text-[#2878B9]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">Bank Deposited (ETB)</label>
              <input
                type="number"
                step="any"
                placeholder="Same as sales"
                value={inlineDepositAmount}
                onChange={(e) => setInlineDepositAmount(e.target.value)}
                className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg text-emerald-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">Deposit Bank</label>
              <select
                value={inlineBankName}
                onChange={(e) => setInlineBankName(e.target.value)}
                className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg text-[#202B38]"
              >
                <option value="Commercial Bank of Ethiopia (CBE)">CBE</option>
                <option value="Telebirr / Ethio Telecom">Telebirr</option>
                <option value="Awash Bank">Awash</option>
                <option value="Dashen Bank">Dashen</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#778493] mb-0.5">Receipt Photo</label>
              <div className="flex items-center gap-1.5">
                <label className="cursor-pointer flex-1 text-xs p-1.5 bg-[#EAF4FC] hover:bg-[#DCEEFF] text-[#2878B9] border border-[#DCEEFF] rounded-lg flex items-center justify-center gap-1 font-medium transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{inlineInvoiceImages.length > 0 ? `${inlineInvoiceImages.length} Snapped` : 'Snap'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleInlineImageUpload}
                    className="hidden"
                  />
                </label>

                {inlineInvoiceImages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(inlineInvoiceImages[0]);
                        setPreviewTitle(`Inline Receipt Preview (1 of ${inlineInvoiceImages.length})`);
                      }}
                      className="p-1 bg-white border border-[#E8EDF2] text-[#2878B9] hover:bg-[#EAF4FC] rounded text-[10px] font-bold"
                      title="See uploaded receipt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlineInvoiceImages([])}
                      className="p-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded text-[10px]"
                      title="Clear photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingInline}
                className="w-full text-xs py-2 px-3 bg-[#2878B9] hover:bg-[#1e6197] text-white font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
              >
                {isSubmittingInline ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.addRecord}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN SPREADSHEET SALES TABLE (MERGED EVIDENCE & ACTION COLUMN, NO REMAINING FLOAT AS TABLE COLUMN) */}
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
                <th className="py-2.5 px-3 border-r border-[#DCEEFF] text-center whitespace-nowrap">{t.colStatus}</th>
                {/* UNIFIED EVIDENCE & ACTIONS COLUMN AS REQUESTED */}
                <th className="py-2.5 px-3 text-center whitespace-nowrap no-print font-bold text-[#2878B9]">
                  {t.evidenceAndActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF2] text-[#202B38]">
              {processedSales.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-[#778493]">
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
                    {/* MERGED EVIDENCE & ACTIONS CELL */}
                    <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {/* Evidence Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                            (sale.invoiceImages?.length || 0) + (sale.bankDeposits?.length || 0) > 0
                              ? 'bg-[#EAF4FC] border-[#DCEEFF] text-[#2878B9]'
                              : 'bg-gray-100 border-gray-200 text-gray-500'
                          }`}
                          title={`${sale.invoiceImages?.length || 0} invoice photo(s), ${sale.bankDeposits?.length || 0} bank deposit slip(s)`}
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>
                            {(sale.invoiceImages?.length || 0) + (sale.bankDeposits?.length || 0)}
                          </span>
                        </span>

                        {/* Action / Inspect Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSale(sale);
                          }}
                          className="px-2 py-1 rounded-md text-xs font-medium text-[#2878B9] hover:bg-[#EAF4FC] border border-[#E8EDF2] flex items-center gap-1 shadow-2xs"
                          title="View Evidence & Correct"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
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
                <td colSpan={2} className="py-3 px-3 text-center text-[#778493] text-[11px]">
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

      {/* Admin Transfer Out Quick Modal */}
      {showAdminTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-[#E8EDF2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
              <h3 className="text-sm font-bold text-[#202B38]">Insert Float Transfer Out</h3>
              <button
                onClick={() => setShowAdminTransferModal(false)}
                className="text-[#778493] hover:text-[#202B38]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#778493] mb-1">Target Shop</label>
                <div className="font-semibold text-[#202B38] p-2 bg-[#F7FAFD] rounded-lg border border-[#E8EDF2]">
                  {currentShop?.name} ({currentShop?.code})
                </div>
              </div>

              <div>
                <label className="block text-[#778493] mb-1">Transfer Ref Number *</label>
                <input
                  type="text"
                  placeholder="e.g. TO 1-20 or TO 21-31"
                  value={newTORef}
                  onChange={(e) => setNewTORef(e.target.value)}
                  className="w-full p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[#778493] mb-1">Amount (ETB) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1600000"
                  value={newTOAmount}
                  onChange={(e) => setNewTOAmount(e.target.value)}
                  className="w-full p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-bold text-[#2878B9]"
                />
              </div>

              <div>
                <label className="block text-[#778493] mb-1">Allocation Date *</label>
                <input
                  type="date"
                  value={newTODate}
                  onChange={(e) => setNewTODate(e.target.value)}
                  className="w-full p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[#778493] mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Initial Float Allocation"
                  value={newTONotes}
                  onChange={(e) => setNewTONotes(e.target.value)}
                  className="w-full p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8EDF2]">
              <button
                onClick={() => setShowAdminTransferModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs text-[#778493]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdminTransfer}
                className="px-4 py-1.5 rounded-lg bg-[#2878B9] text-white text-xs font-bold hover:bg-[#1e6197]"
              >
                Insert Transfer Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for spreadsheet evidence previews */}
      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />
    </div>
  );
};
