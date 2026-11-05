import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  Settings,
  History,
  Plus,
  Edit2,
  Lock,
  Unlock,
  Search,
  DollarSign,
  TrendingUp,
  Percent,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { UserRole } from '../../types';

interface SuperadminDashboardProps {
  onSelectShop: (shopId: string) => void;
}

export const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({ onSelectShop }) => {
  const {
    shops,
    districts,
    products,
    allUsers,
    sales,
    transferOuts,
    reportingPeriods,
    auditLogs,
    appSetting,
    currentMonthKey,
    addShop,
    updateShop,
    addDistrict,
    updateDistrict,
    addUser,
    updateUser,
    closeReportingPeriod,
    reopenReportingPeriod,
    updateOpeningBalance,
    updateCommissionSettings
  } = useShop();

  const { language } = useAuth();
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'adama_main' | 'shops' | 'districts' | 'users' | 'bbf' | 'commission' | 'periods' | 'audits'
  >('overview');

  // Modals & form state
  const [showAddShop, setShowAddShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCode, setNewShopCode] = useState('');
  const [newShopLocation, setNewShopLocation] = useState('');

  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [distShopId, setDistShopId] = useState('adama');
  const [newDistName, setNewDistName] = useState('');
  const [newDistCode, setNewDistCode] = useState('');

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('shop_manager');
  const [newUserShops, setNewUserShops] = useState<string[]>(['jemo']);

  // BBF Management State
  const [bbfShopId, setBbfShopId] = useState<string>('jemo');
  const [bbfMonthKey, setBbfMonthKey] = useState<string>(currentMonthKey);
  const [bbfAmount, setBbfAmount] = useState<string>('');
  const [bbfReason, setBbfReason] = useState<string>('');
  const [bbfSuccess, setBbfSuccess] = useState<string>('');

  // Commission Settings State
  const [commRatePercent, setCommRatePercent] = useState<string>((appSetting.defaultCommissionRate * 100).toString());
  const [commBasis, setCommBasis] = useState<'transfer_out' | 'total_sales'>(appSetting.calculationBasis);
  const [commEffectiveMonth, setCommEffectiveMonth] = useState<string>(currentMonthKey);
  const [commReason, setCommReason] = useState<string>('');
  const [commSuccess, setCommSuccess] = useState<string>('');

  const [reopenReason, setReopenReason] = useState('');
  const [selectedPeriodToReopen, setSelectedPeriodToReopen] = useState<{ shopId: string; monthKey: string } | null>(null);
  const [auditSearch, setAuditSearch] = useState('');

  // Consolidated KPIs across all shops for current month
  const monthSales = sales.filter((s) => s.monthKey === currentMonthKey);
  const monthTransfers = transferOuts.filter((t) => t.monthKey === currentMonthKey);

  const totalGlobalSales = monthSales.reduce((sum, s) => sum + s.salesAmount, 0);
  const totalGlobalDeposits = monthSales.reduce((sum, s) => sum + s.totalDeposited, 0);
  const totalGlobalTransfers = monthTransfers.reduce((sum, t) => sum + t.amount, 0);

  // Shop-by-Shop Summary Table
  const shopSummaries = shops.map((shop) => {
    let sSales = sales.filter((s) => s.shopId === shop.id && s.monthKey === currentMonthKey);
    let sTransfers = transferOuts.filter((t) => t.shopId === shop.id && t.monthKey === currentMonthKey);

    // If Adama Main, consolidate sales from the 5 assigned shops!
    if (shop.id === 'adama_main') {
      const assigned = ['adama', 'hawassa', 'borena', 'bale', 'assela'];
      sSales = sales.filter((s) => assigned.includes(s.shopId) && s.monthKey === currentMonthKey);
    }

    const period = reportingPeriods.find((p) => p.shopId === shop.id && p.monthKey === currentMonthKey);
    const opening = period ? period.openingBalance : (shop.id === 'jemo' && currentMonthKey === '2026-10' ? -1021 : 0);

    const sSalesTotal = sSales.reduce((sum, s) => sum + s.salesAmount, 0);
    const sDeposited = sSales.reduce((sum, s) => sum + s.totalDeposited, 0);
    const sTransferTotal = sTransfers.reduce((sum, t) => sum + t.amount, 0);
    const closing = opening + sTransferTotal - sSalesTotal;
    const upfront = Math.round(sTransferTotal * appSetting.defaultCommissionRate);
    const diff = closing - upfront;
    const pendingCount = sSales.filter((s) => s.status !== 'reconciled').length;

    return {
      shop,
      opening,
      salesTotal: sSalesTotal,
      deposited: sDeposited,
      transfers: sTransferTotal,
      closing,
      upfront,
      diff,
      invoices: sSales.length,
      pendingCount,
      periodStatus: period?.status || 'open'
    };
  });

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newShopCode.trim()) return;
    await addShop({
      name: newShopName.trim(),
      code: newShopCode.trim().toUpperCase(),
      location: newShopLocation.trim() || 'Ethiopia',
      status: 'active'
    });
    setNewShopName('');
    setNewShopCode('');
    setNewShopLocation('');
    setShowAddShop(false);
  };

  const handleCreateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistName.trim() || !newDistCode.trim()) return;
    await addDistrict({
      shopId: distShopId,
      name: newDistName.trim(),
      code: newDistCode.trim().toUpperCase(),
      status: 'active'
    });
    setNewDistName('');
    setNewDistCode('');
    setShowAddDistrict(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    await addUser({
      email: newUserEmail.trim().toLowerCase(),
      displayName: newUserName.trim() || newUserEmail.split('@')[0],
      role: newUserRole,
      shopIds: newUserRole === 'superadmin' ? shops.map((s) => s.id) : newUserShops,
      status: 'active'
    });
    setNewUserEmail('');
    setNewUserName('');
    setShowAddUser(false);
  };

  const handleSaveBBF = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(bbfAmount);
    if (isNaN(amountNum)) {
      alert('Please enter a valid numeric opening balance.');
      return;
    }
    if (!bbfReason.trim()) {
      alert('A mandatory audit reason is required for adjusting BBF.');
      return;
    }

    await updateOpeningBalance(bbfShopId, bbfMonthKey, amountNum, bbfReason.trim());
    setBbfSuccess(`BBF for ${bbfShopId} (${bbfMonthKey}) updated to ETB ${amountNum.toLocaleString()} with audit record.`);
    setBbfReason('');
    setTimeout(() => setBbfSuccess(''), 4000);
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(commRatePercent) / 100;
    if (isNaN(rateNum) || rateNum < 0) {
      alert('Please enter a valid positive commission percentage.');
      return;
    }

    await updateCommissionSettings(rateNum, commBasis, commEffectiveMonth, commReason.trim());
    setCommSuccess(`Commission configuration updated to ${commRatePercent}% effective ${commEffectiveMonth}.`);
    setCommReason('');
    setTimeout(() => setCommSuccess(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Superadmin Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#202B38]">Superadmin Global Control Center</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#2878B9] text-white">
              HQ Access
            </span>
          </div>
          <p className="text-xs text-[#778493] mt-0.5">
            Moderntech Multi-Branch Master Administration • Active Cycle: <strong>{currentMonthKey}</strong>
          </p>
        </div>

        {/* Action Tabs Menu */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F7FAFD] p-1.5 rounded-xl border border-[#E8EDF2] text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'overview' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('adama_main')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'adama_main' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Adama Main Regional</span>
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'shops' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Shops ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'districts' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Districts
          </button>
          <button
            onClick={() => setActiveTab('bbf')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'bbf' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            BBF Management
          </button>
          <button
            onClick={() => setActiveTab('commission')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'commission' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Commission
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'users' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'periods' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Monthly Rollover
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'audits' ? 'bg-[#2878B9] text-white' : 'text-[#778493] hover:text-[#202B38]'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
              <span className="text-xs text-[#778493] font-medium uppercase tracking-wider block">
                Total Multi-Branch Sales
              </span>
              <span className="text-xl font-bold text-[#202B38] block mt-1">
                {formatCurrency(totalGlobalSales)}
              </span>
              <span className="text-[11px] text-[#778493] mt-1 block">
                Across {shops.length - 1} operational branches in {currentMonthKey}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
              <span className="text-xs text-[#778493] font-medium uppercase tracking-wider block">
                Total Bank Deposited
              </span>
              <span className="text-xl font-bold text-emerald-700 block mt-1">
                {formatCurrency(totalGlobalDeposits)}
              </span>
              <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
                Verified with receipts
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
              <span className="text-xs text-[#778493] font-medium uppercase tracking-wider block">
                Total Transfer Out
              </span>
              <span className="text-xl font-bold text-[#2878B9] block mt-1">
                {formatCurrency(totalGlobalTransfers)}
              </span>
              <span className="text-[11px] text-[#778493] mt-1 block">
                Moderntech HQ allocations
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAF4FC]/70 border border-[#DCEEFF] shadow-2xs">
              <span className="text-xs text-[#2878B9] font-semibold uppercase tracking-wider block">
                System Accounts
              </span>
              <span className="text-xl font-bold text-[#2878B9] block mt-1">
                8 Shops + Adama Main
              </span>
              <span className="text-[11px] text-[#778493] mt-1 block">
                Strict database isolation
              </span>
            </div>
          </div>

          {/* Master Shop Performance & Reconciliation Table */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E8EDF2] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#202B38]">Accounts Status ({currentMonthKey})</h2>
                <p className="text-xs text-[#778493]">Click any row to switch active view and inspect isolated records</p>
              </div>

              <button
                onClick={() => setShowAddShop(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Shop</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
                  <tr>
                    <th className="py-3 px-4">Account / Branch</th>
                    <th className="py-3 px-4 text-right">BBF (Opening)</th>
                    <th className="py-3 px-4 text-right">Transfer Out</th>
                    <th className="py-3 px-4 text-right">Total Sales</th>
                    <th className="py-3 px-4 text-right font-bold text-[#202B38]">Closing Float</th>
                    <th className="py-3 px-4 text-right">Up Front ({((appSetting?.defaultCommissionRate || 0.01) * 100).toFixed(0)}%)</th>
                    <th className="py-3 px-4 text-right">Difference</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {shopSummaries.map(({ shop, opening, salesTotal, transfers, closing, upfront, diff, invoices, pendingCount, periodStatus }) => (
                    <tr
                      key={shop.id}
                      onClick={() => onSelectShop(shop.id)}
                      className={`hover:bg-[#EAF4FC]/40 cursor-pointer transition-colors ${
                        shop.isConsolidated ? 'bg-purple-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#202B38] flex items-center gap-2">
                          {shop.isConsolidated ? (
                            <Layers className="w-3.5 h-3.5 text-purple-700" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-[#2878B9]" />
                          )}
                          <span className={shop.isConsolidated ? 'text-purple-900 font-bold' : ''}>{shop.name}</span>
                        </div>
                        <div className="text-[10px] text-[#778493] font-mono">
                          {shop.code} {shop.isConsolidated ? '• Consolidated (Adama, Hawassa, Borena, Bale, Assela)' : `• ${shop.location || 'Branch'}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-red-600">
                        {formatNumber(opening)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#2878B9]">
                        {formatCurrency(transfers)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#202B38]">
                        {formatCurrency(salesTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#2878B9] bg-[#EAF4FC]/30">
                        {formatCurrency(closing)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#778493]">
                        {formatCurrency(upfront)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          diff === 0 ? 'text-emerald-600' : diff < 0 ? 'text-[#2878B9]' : 'text-amber-600'
                        }`}
                      >
                        {formatCurrency(diff)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-[#202B38]">{invoices}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            periodStatus === 'closed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {periodStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShop(shop.id);
                          }}
                          className="px-2.5 py-1 rounded bg-[#EAF4FC] text-[#2878B9] hover:bg-[#DCEEFF] font-semibold text-[11px]"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADAMA MAIN REGIONAL CONSOLIDATION TAB (ADMIN ONLY) */}
      {activeTab === 'adama_main' && (
        <div className="space-y-6">
          {/* Architecture Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-[#EAF4FC] p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-purple-950">
                    ADAMA MAIN — Regional Consolidation Control Engine
                  </h2>
                  <p className="text-xs text-purple-800">
                    Administrative regional account consolidating live sales from 5 designated branches.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectShop('adama_main')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Open Regional Ledger &rarr;
              </button>
            </div>

            {/* Strict Business Rules Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-white/80 rounded-xl border border-purple-200 text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>5 Constituent Operational Branches (Included):</span>
                </div>
                <div className="text-[11px] text-purple-800 font-medium pl-5">
                  1. Adama (4 Districts) • 2. Hawassa • 3. Borena • 4. Bale • 5. Assela
                </div>
                <div className="text-[10px] text-purple-600 pl-5 italic">
                  Sales are entered directly into each operational branch and aggregate dynamically into Adama Main without duplicate records.
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-red-200 text-red-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-950">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Strictly Excluded Independent Branches:</span>
                </div>
                <div className="text-[11px] text-red-800 font-medium pl-5">
                  1. Jemo • 2. Chiro • 3. Shashemene
                </div>
                <div className="text-[10px] text-red-600 pl-5 italic">
                  These branches operate completely independently with their own separate Float reconciliation and are strictly excluded from Adama Main.
                </div>
              </div>
            </div>
          </div>

          {/* Regional Live Financial Totals for Current Month */}
          {(() => {
            const assignedIds = ['adama', 'hawassa', 'borena', 'bale', 'assela'];
            const regSales = sales.filter((s) => assignedIds.includes(s.shopId) && s.monthKey === currentMonthKey);
            const regTransfers = transferOuts.filter((t) => t.shopId === 'adama_main' && t.monthKey === currentMonthKey);
            const regSalesTotal = regSales.reduce((sum, s) => sum + s.salesAmount, 0);
            const regDepositsTotal = regSales.reduce((sum, s) => sum + s.totalDeposited, 0);
            const regTransferTotal = regTransfers.reduce((sum, t) => sum + t.amount, 0);
            const regPeriod = reportingPeriods.find((p) => p.shopId === 'adama_main' && p.monthKey === currentMonthKey);
            const regOpening = regPeriod ? regPeriod.openingBalance : 0;
            const regClosing = regOpening + regTransferTotal - regSalesTotal;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
                  <span className="text-xs text-[#778493] font-medium uppercase tracking-wider block">
                    Consolidated Regional Sales
                  </span>
                  <span className="text-xl font-bold text-[#202B38] block mt-1">
                    {formatCurrency(regSalesTotal)}
                  </span>
                  <span className="text-[11px] text-[#778493] mt-1 block">
                    {regSales.length} total invoices across 5 branches
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
                  <span className="text-xs text-[#778493] font-medium uppercase tracking-wider block">
                    Regional Bank Deposits
                  </span>
                  <span className="text-xl font-bold text-emerald-700 block mt-1">
                    {formatCurrency(regDepositsTotal)}
                  </span>
                  <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
                    Evidence attached
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] shadow-2xs">
                  <span className="text-xs text-[#778493] font-medium uppercase tracking-wider block">
                    Adama Main Transfer Out
                  </span>
                  <span className="text-xl font-bold text-[#2878B9] block mt-1">
                    {formatCurrency(regTransferTotal)}
                  </span>
                  <span className="text-[11px] text-[#778493] mt-1 block">
                    Regional HQ Float allocation
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-2xs">
                  <span className="text-xs text-purple-900 font-semibold uppercase tracking-wider block">
                    Regional Closing SOH
                  </span>
                  <span className="text-xl font-bold text-purple-900 block mt-1">
                    {formatCurrency(regClosing)}
                  </span>
                  <span className="text-[11px] text-purple-700 mt-1 block font-medium">
                    BBF: {formatCurrency(regOpening)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Constituent 5 Branches Breakdown Table */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E8EDF2] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#202B38]">
                  Consolidated Branches Live Performance ({currentMonthKey})
                </h3>
                <p className="text-xs text-[#778493]">
                  Real-time sales, bank deposits, and reconciliation metrics for each of the 5 branches
                </p>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">
                5 Branches Aggregating
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Code / Location</th>
                    <th className="py-3 px-4 text-center">Districts</th>
                    <th className="py-3 px-4 text-right">Total Sales</th>
                    <th className="py-3 px-4 text-right">Bank Deposited</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {['adama', 'hawassa', 'borena', 'bale', 'assela'].map((shopId) => {
                    const sh = shops.find((s) => s.id === shopId) || { id: shopId, name: shopId, code: shopId.toUpperCase(), location: 'Ethiopia' };
                    const shDistricts = districts.filter((d) => d.shopId === shopId && d.status === 'active');
                    const shSales = sales.filter((s) => s.shopId === shopId && s.monthKey === currentMonthKey);
                    const sTotal = shSales.reduce((sum, s) => sum + s.salesAmount, 0);
                    const sDep = shSales.reduce((sum, s) => sum + s.totalDeposited, 0);
                    const sVar = sTotal - sDep;

                    return (
                      <tr key={shopId} className="hover:bg-[#F7FAFD]">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#202B38] flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#2878B9]" />
                            <span>{sh.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#778493]">
                          {sh.code} • {sh.location || 'Ethiopia'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF4FC] text-[#2878B9]">
                            {shDistricts.length} active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#202B38]">
                          {formatCurrency(sTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency(sDep)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-semibold ${
                            sVar === 0 ? 'text-emerald-600' : sVar > 0 ? 'text-amber-600' : 'text-blue-600'
                          }`}
                        >
                          {formatCurrency(sVar)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-[#202B38]">
                          {shSales.length}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onSelectShop(shopId)}
                            className="px-2.5 py-1 rounded bg-[#EAF4FC] text-[#2878B9] hover:bg-[#DCEEFF] font-semibold text-[11px]"
                          >
                            Open Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adama Districts Specific Configuration Module */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8EDF2] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#202B38]">
                  Adama Branch Districts (District 1, District 2, District 3, District 4)
                </h3>
                <p className="text-xs text-[#778493]">
                  Superadmins can add, rename, and activate/deactivate Adama operational districts.
                </p>
              </div>

              <button
                onClick={() => {
                  setDistShopId('adama');
                  setShowAddDistrict(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2878B9] text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Adama District</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {districts
                .filter((d) => d.shopId === 'adama')
                .map((d) => (
                  <div key={d.id} className="p-3.5 bg-[#F7FAFD] rounded-xl border border-[#E8EDF2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#202B38]">{d.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          d.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {d.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#778493] font-mono">Code: {d.code}</div>

                    <div className="pt-2 border-t border-[#E8EDF2] flex justify-end">
                      <button
                        onClick={() => updateDistrict(d.id, { status: d.status === 'active' ? 'inactive' : 'active' })}
                        className="text-xs text-[#2878B9] hover:underline font-medium"
                      >
                        {d.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* BBF MANAGEMENT TAB (SUPERADMIN ONLY) */}
      {activeTab === 'bbf' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="border-b border-[#E8EDF2] pb-3">
            <h2 className="text-sm font-bold text-[#202B38]">Beginning Balance (BBF) Management</h2>
            <p className="text-xs text-[#778493]">
              Superadmin authority to review and adjust the Opening Balance (BBF) for any operational shop or Adama Main with mandatory audit reason.
            </p>
          </div>

          {bbfSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
              {bbfSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSaveBBF} className="p-4 bg-[#F7FAFD] rounded-xl border border-[#E8EDF2] space-y-3.5 text-xs">
              <h3 className="font-bold text-[#202B38]">Adjust Account BBF</h3>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Select Shop / Account *</label>
                <select
                  value={bbfShopId}
                  onChange={(e) => setBbfShopId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Reporting Month *</label>
                <select
                  value={bbfMonthKey}
                  onChange={(e) => setBbfMonthKey(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38] font-semibold"
                >
                  <option value="2026-10">October 2026</option>
                  <option value="2026-11">November 2026</option>
                  <option value="2026-12">December 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">New Opening Balance (ETB) *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., -1021 or 25640"
                  value={bbfAmount}
                  onChange={(e) => setBbfAmount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38] font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-bold text-red-600">
                  Mandatory Audit Adjustment Reason *
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this opening balance is being updated (e.g. Audit reconciliation adjustment, official Telegram sheet carry-forward)..."
                  value={bbfReason}
                  onChange={(e) => setBbfReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-red-300 rounded-xl"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2878B9] hover:bg-[#1e6197] text-white font-semibold rounded-xl shadow-xs"
              >
                Save Audited BBF
              </button>
            </form>

            {/* Existing BBF Records Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#202B38]">Current Configured Opening Balances</h3>
              <div className="overflow-x-auto border border-[#E8EDF2] rounded-xl bg-white max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FAFD] text-[#778493] border-b border-[#E8EDF2]">
                    <tr>
                      <th className="py-2.5 px-3">Account</th>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">BBF (ETB)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDF2]">
                    {reportingPeriods.map((p) => {
                      const sh = shops.find((s) => s.id === p.shopId);
                      return (
                        <tr key={p.id} className="hover:bg-[#F7FAFD]">
                          <td className="py-2 px-3 font-medium text-[#202B38]">{sh?.name || p.shopId}</td>
                          <td className="py-2 px-3 text-[#778493]">{p.monthKey}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#202B38]">
                            {formatNumber(p.openingBalance)}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMMISSION SETTINGS TAB (SUPERADMIN ONLY) */}
      {activeTab === 'commission' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="border-b border-[#E8EDF2] pb-3">
            <h2 className="text-sm font-bold text-[#202B38]">Up Front Commission Settings</h2>
            <p className="text-xs text-[#778493]">
              Configure the upfront commission percentage (default 1%) and calculation basis for all reconciliation reports.
            </p>
          </div>

          {commSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
              {commSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSaveCommission} className="p-4 bg-[#F7FAFD] rounded-xl border border-[#E8EDF2] space-y-3.5 text-xs">
              <h3 className="font-bold text-[#202B38]">Configure Commission Parameters</h3>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Up Front Commission Rate (%) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={commRatePercent}
                    onChange={(e) => setCommRatePercent(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold text-sm"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-[#778493] font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Calculation Basis *</label>
                <select
                  value={commBasis}
                  onChange={(e) => setCommBasis(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38] font-semibold"
                >
                  <option value="transfer_out">Transfer Out Allocations (Standard Float Model)</option>
                  <option value="total_sales">Total Sales Value</option>
                </select>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Effective Reporting Month *</label>
                <select
                  value={commEffectiveMonth}
                  onChange={(e) => setCommEffectiveMonth(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38]"
                >
                  <option value="2026-10">October 2026</option>
                  <option value="2026-11">November 2026</option>
                  <option value="2026-12">December 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Audit Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reason for rate adjustment..."
                  value={commReason}
                  onChange={(e) => setCommReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E8EDF2] rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2878B9] hover:bg-[#1e6197] text-white font-semibold rounded-xl shadow-xs"
              >
                Apply Commission Configuration
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#202B38]">Commission Configuration History</h3>
              <div className="overflow-x-auto border border-[#E8EDF2] rounded-xl bg-white max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FAFD] text-[#778493] border-b border-[#E8EDF2]">
                    <tr>
                      <th className="py-2 px-3">Effective Month</th>
                      <th className="py-2 px-3">Rate</th>
                      <th className="py-2 px-3">Basis</th>
                      <th className="py-2 px-3">Configured By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDF2]">
                    {appSetting.history?.map((h, idx) => (
                      <tr key={idx} className="hover:bg-[#F7FAFD]">
                        <td className="py-2 px-3 font-semibold text-[#202B38]">{h.effectiveMonthKey}</td>
                        <td className="py-2 px-3 font-bold text-[#2878B9]">{(h.rate * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-[#778493]">{h.basis}</td>
                        <td className="py-2 px-3 text-[#778493]">{h.updatedBy}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-[#778493]">
                          Initial 1.00% rate active.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHOPS TAB */}
      {activeTab === 'shops' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38]">Shop Accounts Directory (8 Operational + Adama Main)</h2>
              <p className="text-xs text-[#778493]">Independent retail shops and regional consolidation account</p>
            </div>
            <button
              onClick={() => setShowAddShop(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2878B9] text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Shop</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  shop.isConsolidated
                    ? 'border-purple-200 bg-purple-50/40'
                    : 'border-[#E8EDF2] bg-[#F7FAFD]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#202B38] text-sm">{shop.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      shop.isConsolidated
                        ? 'bg-purple-100 text-purple-800'
                        : shop.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {shop.isConsolidated ? 'CONSOLIDATED' : shop.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-[#778493] space-y-1">
                  <div>Code: <strong className="text-[#202B38] font-mono">{shop.code}</strong></div>
                  <div>Location: <strong className="text-[#202B38]">{shop.location || 'Ethiopia'}</strong></div>
                  {shop.isConsolidated && (
                    <div className="text-[11px] text-purple-800 font-medium">
                      Consolidates: Adama, Hawassa, Borena, Bale, Assela
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E8EDF2] flex items-center justify-between">
                  <button
                    onClick={() => onSelectShop(shop.id)}
                    className="text-xs font-semibold text-[#2878B9] hover:underline"
                  >
                    Open Account
                  </button>
                  {!shop.isConsolidated && (
                    <button
                      onClick={() => updateShop(shop.id, { status: shop.status === 'active' ? 'inactive' : 'active' })}
                      className="text-[11px] text-[#778493] hover:text-[#202B38]"
                    >
                      {shop.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISTRICTS TAB */}
      {activeTab === 'districts' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38]">District Management</h2>
              <p className="text-xs text-[#778493]">
                Configure districts for Adama (District 1, 2, 3, 4) and other operational branches without code changes.
              </p>
            </div>
            <button
              onClick={() => setShowAddDistrict(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2878B9] text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add District</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
                <tr>
                  <th className="py-2.5 px-4">District Name</th>
                  <th className="py-2.5 px-4">District Code</th>
                  <th className="py-2.5 px-4">Branch Shop</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {districts.map((d) => {
                  const s = shops.find((sh) => sh.id === d.shopId);
                  return (
                    <tr key={d.id} className="hover:bg-[#F7FAFD]">
                      <td className="py-3 px-4 font-semibold text-[#202B38]">{d.name}</td>
                      <td className="py-3 px-4 font-mono text-[#778493]">{d.code}</td>
                      <td className="py-3 px-4 text-[#202B38]">{s?.name || d.shopId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            d.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => updateDistrict(d.id, { status: d.status === 'active' ? 'inactive' : 'active' })}
                          className="text-xs text-[#2878B9] hover:underline"
                        >
                          {d.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS & ROLES TAB */}
      {activeTab === 'users' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38]">User Roles & Access Control</h2>
              <p className="text-xs text-[#778493]">Authorized emails and shop access boundaries</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2878B9] text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite / Authorize User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
                <tr>
                  <th className="py-2.5 px-4">Name / Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Assigned Shops</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F7FAFD]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#202B38]">{u.displayName}</div>
                      <div className="text-[11px] text-[#778493]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EAF4FC] text-[#2878B9]">
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#778493]">
                      {u.role === 'superadmin' ? (
                        <span className="font-medium text-[#202B38]">Global (All Shops)</span>
                      ) : (
                        u.shopIds?.map((sid) => shops.find((s) => s.id === sid)?.name || sid).join(', ') || 'None'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== 'brookaklilu33@gmail.com' && (
                        <button
                          onClick={() => updateUser(u.id, { status: u.status === 'active' ? 'suspended' : 'active' })}
                          className={`text-xs hover:underline ${
                            u.status === 'active' ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY ROLLOVER TAB */}
      {activeTab === 'periods' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="border-b border-[#E8EDF2] pb-3">
            <h2 className="text-sm font-bold text-[#202B38]">Monthly Reporting Cycles & Carry-Forward</h2>
            <p className="text-xs text-[#778493]">
              Closing freezes the monthly ledger and automatically carries forward closing SOH as next month's opening balance (BBF).
            </p>
          </div>

          <div className="space-y-3">
            {shops.map((shop) => {
              const period = reportingPeriods.find(
                (p) => p.shopId === shop.id && p.monthKey === currentMonthKey
              );
              const isClosed = period?.status === 'closed';

              return (
                <div
                  key={shop.id}
                  className="p-4 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#202B38] text-sm block">{shop.name}</span>
                    <span className="text-[#778493]">
                      Period: <strong>{currentMonthKey}</strong> • Current BBF:{' '}
                      <strong className="text-red-600">
                        {formatCurrency(period?.openingBalance ?? (shop.id === 'jemo' && currentMonthKey === '2026-10' ? -1021 : 0))}
                      </strong>
                    </span>
                    {isClosed && (
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Closed by {period?.closedBy} at {new Date(period?.closedAt || '').toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isClosed ? (
                      <button
                        onClick={() => setSelectedPeriodToReopen({ shopId: shop.id, monthKey: currentMonthKey })}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Reopen Period</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Close month ${currentMonthKey} for ${shop.name}? This carries forward the closing balance into the next month.`)) {
                            closeReportingPeriod(shop.id, currentMonthKey);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Close Month & Carry SOH</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AUDIT TRAIL TAB */}
      {activeTab === 'audits' && (
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8EDF2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202B38]">System Audit Logs (Append-Only)</h2>
              <p className="text-xs text-[#778493]">Complete immutable operational trail of all entries, corrections, and BBF adjustments</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#778493] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filter audit logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="text-xs pl-8 pr-3 py-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {auditLogs
                  .filter((log) => !auditSearch || log.details.toLowerCase().includes(auditSearch.toLowerCase()) || log.action.toLowerCase().includes(auditSearch.toLowerCase()))
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7FAFD]">
                      <td className="py-2.5 px-4 text-[#778493] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#2878B9]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-[#202B38]">{log.performedBy}</td>
                      <td className="py-2.5 px-4 text-[#202B38] max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-4 text-[#778493] italic">
                        {log.reason || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Shop Modal */}
      {showAddShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleCreateShop} className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3.5 border border-[#E8EDF2] shadow-xl text-xs">
            <h3 className="text-sm font-bold text-[#202B38]">Add New Operational Shop</h3>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Shop Name *</label>
              <input
                type="text"
                placeholder="e.g., Harar Shop"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Branch Code *</label>
              <input
                type="text"
                placeholder="e.g., HARAR"
                value={newShopCode}
                onChange={(e) => setNewShopCode(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Location</label>
              <input
                type="text"
                placeholder="e.g., Harar, Eastern Ethiopia"
                value={newShopLocation}
                onChange={(e) => setNewShopLocation(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddShop(false)}
                className="px-3 py-1.5 border rounded-lg text-[#778493]"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-[#2878B9] text-white font-semibold rounded-lg">
                Create Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add District Modal */}
      {showAddDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleCreateDistrict} className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3.5 border border-[#E8EDF2] shadow-xl text-xs">
            <h3 className="text-sm font-bold text-[#202B38]">Add District</h3>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Shop *</label>
              <select
                value={distShopId}
                onChange={(e) => setDistShopId(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
              >
                {shops.filter((s) => !s.isConsolidated).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">District Name *</label>
              <input
                type="text"
                placeholder="e.g., District 5"
                value={newDistName}
                onChange={(e) => setNewDistName(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">District Code *</label>
              <input
                type="text"
                placeholder="e.g., DIST-5"
                value={newDistCode}
                onChange={(e) => setNewDistCode(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl font-mono uppercase"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDistrict(false)}
                className="px-3 py-1.5 border rounded-lg text-[#778493]"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-[#2878B9] text-white font-semibold rounded-lg">
                Save District
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3.5 border border-[#E8EDF2] shadow-xl text-xs">
            <h3 className="text-sm font-bold text-[#202B38]">Invite Authorized User</h3>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Email Address *</label>
              <input
                type="email"
                placeholder="manager@moderntech.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Full Name</label>
              <input
                type="text"
                placeholder="e.g., Almaz Tesfaye"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[#778493] mb-1 font-medium">System Role *</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl font-semibold"
              >
                <option value="shop_manager">Shop Manager (Shop Restricted)</option>
                <option value="recorder">Recorder (Sales Entry Only)</option>
                <option value="auditor">Auditor (Read-Only Evidence)</option>
                <option value="superadmin">Superadmin (Global HQ)</option>
              </select>
            </div>
            {newUserRole !== 'superadmin' && (
              <div>
                <label className="block text-[#778493] mb-1 font-medium">Assign Shop</label>
                <select
                  value={newUserShops[0]}
                  onChange={(e) => setNewUserShops([e.target.value])}
                  className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl"
                >
                  {shops.filter((s) => !s.isConsolidated).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-3 py-1.5 border rounded-lg text-[#778493]"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-[#2878B9] text-white font-semibold rounded-lg">
                Authorize Email
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reopen Period Modal */}
      {selectedPeriodToReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3.5 border border-[#E8EDF2] shadow-xl text-xs">
            <h3 className="text-sm font-bold text-[#202B38]">Reopen Closed Period</h3>
            <p className="text-[#778493]">
              Reopening {selectedPeriodToReopen.monthKey} allows retroactive modifications. A mandatory audit explanation is required.
            </p>
            <textarea
              rows={2}
              placeholder="Reason for reopening period..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full p-2.5 border border-amber-300 rounded-xl"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPeriodToReopen(null)}
                className="px-3 py-1.5 border rounded-lg text-[#778493]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!reopenReason.trim()) return alert('Please enter reason');
                  await reopenReportingPeriod(selectedPeriodToReopen.shopId, selectedPeriodToReopen.monthKey, reopenReason);
                  setSelectedPeriodToReopen(null);
                  setReopenReason('');
                }}
                className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
